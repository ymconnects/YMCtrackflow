# bulk_add_orders.py
# Paste-to-dashboard: bulk-insert new orders into Supabase, with
# server-authoritative duplicate/conflict detection by tracking_id.
# Same function handles both preview (dry_run=True) and submit
# (dry_run=False) so preview and actual insert can never drift apart.

import time
from supabase_db import supabase
from tracking_links import generate_tracking_link

VALID_COURIERS = {"anjani", "dtdc", "maruti", "others"}


def _norm(v):
    return (v or "").strip()


def _insert_with_retry(row):
    for attempt in range(3):
        try:
            supabase.table("orders").insert(row).execute()
            return True
        except Exception as e:
            if attempt < 2:
                time.sleep(1)
            else:
                print(f"Bulk-add insert failed after 3 attempts: {e}", flush=True)
                return False


def process_bulk_add(courier, courier_name, rows, dry_run=False):
    courier = _norm(courier).lower()
    if courier not in VALID_COURIERS:
        return None, f"Invalid courier: {courier}"

    courier_name = _norm(courier_name) if courier == "others" else None

    results = []
    added = 0
    skipped_duplicates = 0
    flagged_conflicts = 0

    for row in rows or []:
        name = _norm(row.get("name"))
        phone = _norm(row.get("phone"))
        tracking_id = _norm(row.get("tracking_id"))

        if not name or not phone or not tracking_id:
            continue  # defensive - client should already filter these out

        existing = supabase.table("orders").select("id,customer_name,phone") \
            .eq("tracking_id", tracking_id).limit(1).execute()

        if existing.data:
            ex = existing.data[0]
            if _norm(ex.get("customer_name")).lower() == name.lower() and _norm(ex.get("phone")) == phone:
                results.append({"tracking_id": tracking_id, "status": "duplicate", "existing": None})
                skipped_duplicates += 1
            else:
                results.append({
                    "tracking_id": tracking_id,
                    "status": "conflict",
                    "existing": {"customer_name": ex.get("customer_name"), "phone": ex.get("phone")}
                })
                flagged_conflicts += 1
            continue

        tracking_link = generate_tracking_link(courier, tracking_id, courier_name)

        if not dry_run:
            new_row = {
                "customer_name": name,
                "phone": phone,
                "courier": courier,
                "tracking_id": tracking_id,
                "tracking_link": tracking_link or None,
                "status": "NO",
                "status_rank": 0,
            }
            if courier == "others":
                new_row["courier_name"] = courier_name or ""
            _insert_with_retry(new_row)

        results.append({"tracking_id": tracking_id, "status": "insert", "existing": None})
        added += 1

    return {
        "results": results,
        "added": added,
        "skipped_duplicates": skipped_duplicates,
        "flagged_conflicts": flagged_conflicts
    }, None
