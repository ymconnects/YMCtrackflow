import time
from datetime import datetime
from supabase_db import supabase
from campaigns.campaign_manager import get_campaign
from whatsapp import send_template_message

STATUS_RANK = {"NO": 0, "SENT": 1, "FAILED": 2, "DELIVERED": 3}
DAILY_LIMIT = 1900

PERMANENT_ERROR_CODES = {
    "131026": "Not on WhatsApp",
    "130403": "Blocked by recipient",
    "131050": "Recipient opted out",
}


def update_recipient_status(recipient_id, status, wamid=None, error_code=None):
    current = supabase.table("campaign_recipients") \
        .select("status_rank").eq("id", recipient_id).single().execute()
    current_rank = current.data.get("status_rank", 0)
    new_rank = STATUS_RANK.get(status, 0)

    if new_rank <= current_rank:
        return

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
            return
        except Exception:
            if attempt < 2:
                time.sleep(1)


def send_campaign(campaign_id):
    from supabase import create_client
    import os
    db = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

    campaign = get_campaign(campaign_id)
    if not campaign:
        return False, "Campaign not found"

    db.table("campaigns").update({"status": "SENDING"}).eq("id", campaign_id).execute()

    sent_count = 0
    failed_count = 0
    paused = False

    try:
        while True:
            batch = db.table("campaign_recipients") \
                .select("*").eq("campaign_id", campaign_id).eq("status", "NO") \
                .limit(5).execute().data

            if not batch:
                break

            for recipient in batch:
                if sent_count >= DAILY_LIMIT:
                    paused = True
                    break

                variables = recipient.get("variables") or []
                success, result = send_template_message(
                    recipient["phone"],
                    campaign["template_name"],
                    variables
                )

                if success:
                    update_recipient_status(recipient["id"], "SENT", wamid=result)
                    sent_count += 1
                else:
                    update_recipient_status(recipient["id"], "FAILED", error_code=str(result))
                    failed_count += 1

                time.sleep(1)

            if paused:
                break

    except Exception as e:
        print(f"Campaign {campaign_id} crashed: {e}", flush=True)
        try:
            db.table("campaigns").update({
                "status": "PAUSED",
                "sent": sent_count,
                "failed": failed_count
            }).eq("id", campaign_id).execute()
        except Exception:
            pass
        return False, str(e)

    if paused:
        print(f"Daily safety limit reached, paused at {sent_count} sent.", flush=True)
        db.table("campaigns").update({
            "status": "PAUSED",
            "sent": sent_count,
            "failed": failed_count
        }).eq("id", campaign_id).execute()
        return False, f"Daily safety limit reached, paused at {sent_count} sent."

    db.table("campaigns").update({
        "status": "DONE",
        "sent": sent_count,
        "failed": failed_count
    }).eq("id", campaign_id).execute()

    return True, {"sent": sent_count, "failed": failed_count}


def determine_retry_batch(campaign_id, recipient_id=None):
    campaign = get_campaign(campaign_id)
    if not campaign:
        return None, "Campaign not found"

    query = supabase.table("campaign_recipients").select("*") \
        .eq("campaign_id", campaign_id).eq("status", "FAILED")
    if recipient_id:
        query = query.eq("id", recipient_id)
    failed_rows = query.execute().data

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


def process_retry_batch(campaign_id, template_name, rows, original_status):
    supabase.table("campaigns").update({"status": "SENDING"}).eq("id", campaign_id).execute()

    try:
        for i in range(0, len(rows), 5):
            chunk = rows[i:i + 5]
            for row in chunk:
                supabase.table("campaign_recipients").update({
                    "status": "NO",
                    "status_rank": 0,
                    "error_code": None
                }).eq("id", row["id"]).execute()

                variables = row.get("variables") or []
                success, result = send_template_message(row["phone"], template_name, variables)

                if success:
                    update_recipient_status(row["id"], "SENT", wamid=result)
                else:
                    update_recipient_status(row["id"], "FAILED", error_code=str(result))

                time.sleep(1)
    except Exception as e:
        print(f"Retry for campaign {campaign_id} crashed: {e}", flush=True)

    recipients = supabase.table("campaign_recipients").select("status") \
        .eq("campaign_id", campaign_id).execute().data
    sent_count = sum(1 for r in recipients if r["status"] in ("SENT", "DELIVERED"))
    failed_count = sum(1 for r in recipients if r["status"] == "FAILED")

    supabase.table("campaigns").update({
        "status": original_status or "DONE",
        "sent": sent_count,
        "failed": failed_count
    }).eq("id", campaign_id).execute()
