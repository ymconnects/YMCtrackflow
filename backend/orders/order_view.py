import pytz
from datetime import datetime, timezone
from supabase_db import supabase

IST = pytz.timezone('Asia/Kolkata')

COURIER_DISPLAY_NAMES = {
    "anjani": "Shree Anjani Couriers",
    "dtdc": "DTDC Couriers",
    "maruti": "Shree Maruti Couriers",
}


def _format_last_updated(row):
    raw = row.get("last_updated") or row.get("created_at")
    if not raw:
        return ""
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt = dt.astimezone(IST)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return ""


def _to_legacy_shape(row):
    courier = row.get("courier") or ""
    is_other = courier == "others"
    display_courier = row.get("courier_name") if is_other else COURIER_DISPLAY_NAMES.get(courier, courier)
    return {
        "id": row["id"],
        "order_id": f"{courier[:3].upper()}{row['id']:04d}",
        "customer_name": row.get("customer_name") or "",
        "phone": row.get("phone") or "",
        "courier": display_courier or "",
        "tracking_id": row.get("tracking_id") or "",
        "tracking_link": row.get("tracking_link") or "",
        "msg_sent": row.get("status") or "NO",
        "last_updated": _format_last_updated(row),
        "is_other": is_other,
    }


def get_all_orders():
    rows = supabase.table("orders").select("*").order("id", desc=True).execute().data
    return [_to_legacy_shape(r) for r in rows]
