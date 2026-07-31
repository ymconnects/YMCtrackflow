import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from supabase_db import supabase, select_all
from campaigns.campaign_manager import get_campaign
from whatsapp import send_template_message

STATUS_RANK = {"NO": 0, "SENT": 1, "FAILED": 2, "DELIVERED": 3}
DAILY_LIMIT = 1900

# Meta's default Cloud API throughput is 80 messages/sec with a 45-in-6-sec
# burst allowance; this account is TIER_10K / GREEN quality. 7/sec is well
# inside both, paced to land on ~1 second per batch rather than firing all
# 7 at once - concurrency gives the throughput, the pacing keeps it steady.
# This is only the CEILING - the sender throttles itself down from here the
# moment Meta or Supabase starts complaining, and only walks back up after
# clean batches. Correctness first: it is always allowed to go slower.
SEND_CONCURRENCY = 7
MIN_CONCURRENCY = 1

# Meta codes that mean "you are going too fast" - these must reduce the rate,
# never be treated as a per-recipient permanent failure.
RATE_LIMIT_ERROR_CODES = {
    "4",       # API Too Many Calls
    "429",     # HTTP 429
    "613",     # Rate limit hit
    "80007",   # Rate limit issues
    "130429",  # Cloud API message throughput reached
    "131048",  # Spam rate limit hit
    "131056",  # Business/consumer pair rate limit hit
}

# Transient/server-side failures - back off, but they are recorded as FAILED
# for that recipient so the retry flow can pick them up later.
TRANSIENT_ERROR_CODES = {"1", "2", "500", "502", "503", "504", "131000", "133000"}

MAX_CONSECUTIVE_DEAD_BATCHES = 3

PERMANENT_ERROR_CODES = {
    "131026": "Not on WhatsApp",
    "130403": "Blocked by recipient",
    "131050": "Recipient opted out",
    "130472": "Blocked by Meta's marketing message experiment (no retry will help)",
}

# Only one send/retry loop per campaign may run inside this process at a time.
# The 409 checks in api.py read campaign["status"] and only *then* start the
# thread, so two clicks a few milliseconds apart both pass that check and both
# loops end up selecting the same status='NO' rows -> the same customer gets
# messaged twice. This claim closes that TOCTOU window atomically.
_active_campaigns = set()
_active_campaigns_lock = threading.Lock()


def _claim_campaign(campaign_id):
    with _active_campaigns_lock:
        if campaign_id in _active_campaigns:
            return False
        _active_campaigns.add(campaign_id)
        return True


def _release_campaign(campaign_id):
    with _active_campaigns_lock:
        _active_campaigns.discard(campaign_id)


def update_recipient_status(recipient_id, status, wamid=None, error_code=None):
    """Write a recipient's outcome, never letting a lower rank overwrite a
    higher one. Returns True when the row is known to reflect `status` (or
    already held something better), False when the write could not be made -
    the caller MUST treat False as "this outcome was not recorded".

    Every DB call here is retried and guarded: this function is called right
    after a real WhatsApp message has gone out, so an exception escaping it
    would strand a message that was actually delivered to a real customer.
    """
    new_rank = STATUS_RANK.get(status, 0)

    current_rank = None
    for attempt in range(3):
        try:
            current = supabase.table("campaign_recipients") \
                .select("status_rank").eq("id", recipient_id).single().execute()
            current_rank = (current.data or {}).get("status_rank", 0) or 0
            break
        except Exception as e:
            if attempt < 2:
                time.sleep(1 + attempt)
            else:
                print(f"STATUS READ FAILED recipient={recipient_id} status={status} "
                      f"wamid={wamid} error_code={error_code}: {e}", flush=True)

    if current_rank is None:
        # We could not read the current rank. Do not guess - a blind write
        # could stomp a DELIVERED webhook with a stale SENT.
        return False

    if new_rank <= current_rank:
        return True

    update_data = {
        "status": status,
        "status_rank": new_rank,
        "last_updated": datetime.utcnow().isoformat()
    }
    if wamid:
        update_data["wamid"] = wamid
    if error_code:
        update_data["error_code"] = error_code

    for attempt in range(3):
        try:
            supabase.table("campaign_recipients").update(update_data).eq("id", recipient_id).execute()
            return True
        except Exception as e:
            if attempt < 2:
                time.sleep(1 + attempt)
            else:
                print(f"STATUS WRITE FAILED recipient={recipient_id} status={status} "
                      f"wamid={wamid} error_code={error_code}: {e}", flush=True)
    return False


def _send_one(recipient, template_name):
    """Runs on a worker thread. Must never raise - the recipient id is
    captured before anything that can fail, so the caller always gets a
    result it can attribute to a row."""
    recipient_id = recipient.get("id")
    try:
        variables = recipient.get("variables") or []
        success, result = send_template_message(recipient["phone"], template_name, variables)
    except Exception as e:
        success, result = False, f"send_error: {e}"
    return recipient_id, success, result


def _send_batch_concurrent(batch, template_name, counts, concurrency=SEND_CONCURRENCY):
    """Send one batch in parallel, then persist every outcome.

    Two rules make this safe:

    1. ALL sends are collected before ANY database work starts. If a DB write
       blows up we still hold every other recipient's real outcome in memory
       and can keep writing them, instead of aborting the loop and stranding
       messages that were genuinely delivered.
    2. Database writes happen on THIS thread only, one at a time. The worker
       threads only talk to Meta. So update_recipient_status's
       read-rank-then-write is never run concurrently with itself from the
       send path - no lost updates within a campaign.

    Returns per-batch stats so the caller can throttle itself.
    """
    batch_start = time.time()
    results = []

    executor = ThreadPoolExecutor(max_workers=max(1, concurrency))
    try:
        futures = {executor.submit(_send_one, r, template_name): r for r in batch}
        for future in as_completed(futures):
            try:
                recipient_id, success, result = future.result()
            except Exception as e:
                # _send_one is written not to raise, so this is a worker/pool
                # level failure. Fall back to the submitted row for the id.
                recipient_id = (futures.get(future) or {}).get("id")
                success, result = False, f"send_error: {e}"
            results.append((recipient_id, success, result))
    finally:
        # Never leave worker threads behind, even if as_completed itself dies.
        executor.shutdown(wait=True)

    # Safety net: if for any reason a submitted row produced no result at all,
    # record it explicitly rather than letting it sit silently at NO.
    seen_ids = {rid for rid, _, _ in results if rid is not None}
    for recipient in batch:
        rid = recipient.get("id")
        if rid is not None and rid not in seen_ids:
            print(f"NO RESULT for recipient={rid} - recording as FAILED", flush=True)
            results.append((rid, False, "send_error: no result returned"))

    stats = {"sent": 0, "failed": 0, "rate_limited": 0, "transient": 0, "unrecorded": []}

    for recipient_id, success, result in results:
        if recipient_id is None:
            print(f"UNATTRIBUTABLE SEND RESULT success={success} result={result}", flush=True)
            stats["unrecorded"].append(None)
            continue

        code = str(result)
        if not success:
            if code in RATE_LIMIT_ERROR_CODES:
                stats["rate_limited"] += 1
            elif code in TRANSIENT_ERROR_CODES or code.startswith("send_error"):
                stats["transient"] += 1

        try:
            if success:
                written = update_recipient_status(recipient_id, "SENT", wamid=result)
            else:
                written = update_recipient_status(recipient_id, "FAILED", error_code=code)
        except Exception as e:
            written = False
            print(f"STATUS UPDATE CRASHED recipient={recipient_id} success={success} "
                  f"result={result}: {e}", flush=True)

        if not written:
            # The message really was sent/attempted but the row does not say
            # so. Surface it loudly - the caller stops the run rather than
            # looping back around and messaging this person a second time.
            print(f"UNRECORDED OUTCOME recipient={recipient_id} success={success} "
                  f"result={result}", flush=True)
            stats["unrecorded"].append(recipient_id)

        if success:
            counts["sent"] += 1
        else:
            counts["failed"] += 1

    # Pace: at least one second per batch, so the send rate never exceeds
    # `concurrency` messages/sec and drops automatically when we throttle down.
    elapsed = time.time() - batch_start
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)

    return stats


def _apply_throttle(state, stats, batch_size):
    """Slow down on any sign of trouble, recover only after clean batches.
    Returns False when the run should stop entirely (circuit breaker)."""
    trouble = stats["rate_limited"] + stats["transient"] + len(stats["unrecorded"])

    if stats["rate_limited"]:
        state["concurrency"] = max(MIN_CONCURRENCY, state["concurrency"] // 2)
        state["backoff"] = min(60, max(5, state["backoff"] * 2))
        print(f"Rate limited by Meta ({stats['rate_limited']} in batch) - concurrency now "
              f"{state['concurrency']}, sleeping {state['backoff']}s", flush=True)
        time.sleep(state["backoff"])
    elif trouble:
        state["concurrency"] = max(MIN_CONCURRENCY, state["concurrency"] - 1)
        state["backoff"] = min(30, max(2, state["backoff"] * 2))
        print(f"Errors in batch (transient={stats['transient']}, "
              f"unrecorded={len(stats['unrecorded'])}) - concurrency now "
              f"{state['concurrency']}, sleeping {state['backoff']}s", flush=True)
        time.sleep(state["backoff"])
    else:
        state["backoff"] = 0
        if state["concurrency"] < SEND_CONCURRENCY:
            state["concurrency"] += 1

    # Circuit breaker: a batch where nothing at all got through counts as dead.
    if batch_size and stats["sent"] == 0:
        state["dead_batches"] += 1
    else:
        state["dead_batches"] = 0

    return state["dead_batches"] < MAX_CONSECUTIVE_DEAD_BATCHES


def send_campaign(campaign_id):
    from supabase import create_client
    import os
    db = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

    campaign = get_campaign(campaign_id)
    if not campaign:
        return False, "Campaign not found"

    if not _claim_campaign(campaign_id):
        return False, "Campaign is already sending"

    try:
        db.table("campaigns").update({"status": "SENDING"}).eq("id", campaign_id).execute()

        counts = {"sent": 0, "failed": 0}
        state = {"concurrency": SEND_CONCURRENCY, "backoff": 0, "dead_batches": 0}
        paused = False
        stop_reason = None
        # Every recipient we have already fired a message at during THIS run.
        # If a status write failed, the row is still 'NO' and the next select
        # would hand it back to us - re-sending to a real customer. Never.
        attempted = set()

        try:
            while True:
                if counts["sent"] >= DAILY_LIMIT:
                    paused = True
                    stop_reason = f"Daily safety limit reached, paused at {counts['sent']} sent."
                    break

                size = min(state["concurrency"], DAILY_LIMIT - counts["sent"])
                if size <= 0:
                    paused = True
                    stop_reason = f"Daily safety limit reached, paused at {counts['sent']} sent."
                    break

                fetched = None
                for attempt in range(3):
                    try:
                        # Over-fetch so rows we already attempted (but whose
                        # status write failed) cannot permanently mask the
                        # rows behind them.
                        fetched = db.table("campaign_recipients") \
                            .select("*").eq("campaign_id", campaign_id).eq("status", "NO") \
                            .limit(size + 2 * SEND_CONCURRENCY).execute().data
                        break
                    except Exception:
                        if attempt < 2:
                            time.sleep(2)
                        else:
                            raise

                if not fetched:
                    break

                batch = [r for r in fetched if r.get("id") not in attempted][:size]
                if not batch:
                    # Everything still marked NO is something we already sent
                    # and failed to record. Stop - do not message them again.
                    raise RuntimeError(
                        "Stopping: recipients already sent this run are still marked NO "
                        "(status writes are not landing). Refusing to re-send."
                    )

                attempted.update(r.get("id") for r in batch)

                stats = _send_batch_concurrent(
                    batch, campaign["template_name"], counts, state["concurrency"]
                )

                if not _apply_throttle(state, stats, len(batch)):
                    paused = True
                    stop_reason = (
                        f"Stopped after {MAX_CONSECUTIVE_DEAD_BATCHES} consecutive batches "
                        f"with zero successful sends - paused at {counts['sent']} sent."
                    )
                    break

        except Exception as e:
            print(f"Campaign {campaign_id} crashed: {e}", flush=True)
            try:
                db.table("campaigns").update({
                    "status": "PAUSED",
                    "sent": counts["sent"],
                    "failed": counts["failed"]
                }).eq("id", campaign_id).execute()
            except Exception:
                pass
            return False, str(e)

        if paused:
            print(stop_reason, flush=True)
            db.table("campaigns").update({
                "status": "PAUSED",
                "sent": counts["sent"],
                "failed": counts["failed"]
            }).eq("id", campaign_id).execute()
            return False, stop_reason

        db.table("campaigns").update({
            "status": "DONE",
            "sent": counts["sent"],
            "failed": counts["failed"]
        }).eq("id", campaign_id).execute()

        return True, {"sent": counts["sent"], "failed": counts["failed"]}
    finally:
        _release_campaign(campaign_id)


def determine_retry_batch(campaign_id, recipient_id=None):
    campaign = get_campaign(campaign_id)
    if not campaign:
        return None, "Campaign not found"

    filters = {"campaign_id": campaign_id, "status": "FAILED"}
    if recipient_id:
        filters["id"] = recipient_id
    failed_rows = select_all("campaign_recipients", "*", filters)

    if recipient_id and not failed_rows:
        return None, "Recipient not found or not in FAILED status"

    to_retry = []
    skipped_reasons = []
    for row in failed_rows:
        code = row.get("error_code")
        if code in PERMANENT_ERROR_CODES:
            skipped_reasons.append({
                "recipient_id": row["id"],
                "phone": row.get("phone"),
                "error_code": code,
                "reason": PERMANENT_ERROR_CODES[code]
            })
        else:
            to_retry.append(row)

    return {
        "campaign": campaign,
        "to_retry": to_retry,
        "skipped_reasons": skipped_reasons
    }, None


def process_retry_batch(campaign_id, template_name, rows):
    if not _claim_campaign(campaign_id):
        print(f"Retry for campaign {campaign_id} skipped - a send/retry is already running.",
              flush=True)
        return

    try:
        supabase.table("campaigns").update({"status": "SENDING"}).eq("id", campaign_id).execute()

        counts = {"sent": 0, "failed": 0}
        state = {"concurrency": SEND_CONCURRENCY, "backoff": 0, "dead_batches": 0}

        i = 0
        while i < len(rows):
            chunk = rows[i:i + state["concurrency"]]
            i += len(chunk)

            ready = []
            for row in chunk:
                try:
                    # wamid must be cleared too: a late webhook for the OLD
                    # message would otherwise be matched to this row and
                    # overwrite the retry's real outcome with stale data.
                    supabase.table("campaign_recipients").update({
                        "status": "NO",
                        "status_rank": 0,
                        "error_code": None,
                        "wamid": None
                    }).eq("id", row["id"]).execute()
                    ready.append(row)
                except Exception as e:
                    # Do NOT send this one: the row is still FAILED (rank 2),
                    # so a successful SENT (rank 1) would be discarded and the
                    # customer would show as failed despite being messaged.
                    print(f"Retry row {row.get('id')} reset for campaign {campaign_id} "
                          f"failed, skipping send: {e}", flush=True)

            if not ready:
                continue

            stats = _send_batch_concurrent(ready, template_name, counts, state["concurrency"])

            if not _apply_throttle(state, stats, len(ready)):
                print(f"Retry for campaign {campaign_id} stopped after "
                      f"{MAX_CONSECUTIVE_DEAD_BATCHES} consecutive dead batches.", flush=True)
                break

        # recompute the real end state from the data rather than trusting a
        # possibly-stale status captured before this retry ran
        recipients = select_all("campaign_recipients", "status", {"campaign_id": campaign_id})
        sent_count = sum(1 for r in recipients if r["status"] in ("SENT", "DELIVERED"))
        failed_count = sum(1 for r in recipients if r["status"] == "FAILED")
        no_count = sum(1 for r in recipients if r["status"] == "NO")

        final_status = "DONE" if failed_count == 0 and no_count == 0 else "PAUSED"

        supabase.table("campaigns").update({
            "status": final_status,
            "sent": sent_count,
            "failed": failed_count
        }).eq("id", campaign_id).execute()
    finally:
        _release_campaign(campaign_id)
