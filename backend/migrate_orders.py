# migrate_orders.py
# Repeatable sync: Google Sheets (all 4 courier tabs) -> Supabase orders table
# Safe to re-run - matches existing rows by tracking_id+phone, only moves status forward

import time
from sheets import refresh_cache
from supabase_db import supabase

STATUS_MAP = {
    "": "NO",
    "NO": "NO",
    "SENT": "SENT",
    "YES": "SENT",
    "READ": "DELIVERED",
    "DELIVERED": "DELIVERED",
    "FAILED": "FAILED",
}
STATUS_RANK = {"NO": 0, "SENT": 1, "FAILED": 2, "DELIVERED": 3}


def _detect_courier(order):
    if order.get("is_other"):
        return "others"
    tab = (order.get("tab_name") or "").lower()
    if "anjani" in tab:
        return "anjani"
    if "dtdc" in tab:
        return "dtdc"
    if "maruti" in tab:
        return "maruti"
    return "others"


def _write_with_retry(fn):
    for attempt in range(3):
        try:
            fn()
            return True
        except Exception as e:
            if attempt < 2:
                time.sleep(1)
            else:
                print(f"Sync write failed after 3 attempts: {e}", flush=True)
                return False


def sync_orders_from_sheets():
    orders = refresh_cache()

    inserted = 0
    updated = 0
    skipped = 0

    for o in orders:
        tracking_id = str(o.get("tracking_id") or "").strip()
        phone = str(o.get("phone") or "").strip()
        if not tracking_id or not phone:
            skipped += 1
            continue

        courier = _detect_courier(o)
        status = STATUS_MAP.get((o.get("msg_sent") or "NO").upper(), "NO")
        status_rank = STATUS_RANK[status]

        row = {
            "customer_name": o.get("customer_name") or "",
            "phone": phone,
            "courier": courier,
            "tracking_id": tracking_id,
            "tracking_link": o.get("tracking_link") or None,
            "status": status,
            "status_rank": status_rank,
        }
        if courier == "others":
            row["courier_name"] = o.get("courier") or ""

        existing = supabase.table("orders").select("id,status_rank") \
            .eq("tracking_id", tracking_id).eq("phone", phone).limit(1).execute()

        if existing.data:
            existing_row = existing.data[0]
            if status_rank > existing_row["status_rank"]:
                ok = _write_with_retry(
                    lambda: supabase.table("orders").update(row).eq("id", existing_row["id"]).execute()
                )
                if ok:
                    updated += 1
            else:
                skipped += 1
        else:
            ok = _write_with_retry(
                lambda: supabase.table("orders").insert(row).execute()
            )
            if ok:
                inserted += 1

    return {
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "total_seen": len(orders)
    }
