import pytz
from datetime import datetime, timezone
from supabase_db import supabase, select_all
from whatsapp import get_error_reason

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


def _format_message_sent_at(row):
    raw = row.get("message_sent_at")
    if not raw:
        return ""
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt = dt.astimezone(IST)
        return dt.strftime("%Y-%m-%d %I:%M %p")
    except Exception:
        return ""


def _to_legacy_shape(row):
    courier = row.get("courier") or ""
    is_other = courier == "others"
    display_courier = row.get("courier_name") if is_other else COURIER_DISPLAY_NAMES.get(courier, courier)
    error_code = row.get("error_code") or ""
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
        "message_sent_at": _format_message_sent_at(row),
        "wamid": row.get("wamid") or "",
        "error_code": error_code,
        "error_reason": get_error_reason(error_code),
        "is_other": is_other,
        "manually_delivered": bool(row.get("manually_delivered")),
    }


def get_all_orders():
    rows = select_all("orders", "*", order_by="id", desc=True)
    return [_to_legacy_shape(r) for r in rows]


def _phone_candidates(phone):
    phone = str(phone).strip().replace("+", "").replace(" ", "")
    if len(phone) == 12 and phone.startswith("91"):
        return [phone, phone[2:]]
    if len(phone) == 10:
        return [phone, "91" + phone]
    return [phone]


def was_message_sent_within_24hrs(phone):
    candidates = _phone_candidates(phone)
    rows = supabase.table("orders").select("status,last_updated,created_at") \
        .in_("phone", candidates).in_("status", ["SENT", "DELIVERED", "FAILED"]).execute().data

    now = datetime.now(timezone.utc)
    for row in rows:
        raw = row.get("last_updated") or row.get("created_at")
        if not raw:
            continue
        try:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            diff = (now - dt).total_seconds()
            if diff < 86400:
                return True
        except Exception:
            continue
    return False
