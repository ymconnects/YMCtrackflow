import time
from datetime import datetime
from supabase_db import supabase
from whatsapp import send_order_template_message

STATUS_RANK = {"NO": 0, "SENT": 1, "FAILED": 2, "DELIVERED": 3}


def update_order_status(order_id, status, wamid=None, error_code=None):
    current = supabase.table("orders") \
        .select("status_rank").eq("id", order_id).single().execute()
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
            supabase.table("orders").update(update_data).eq("id", order_id).execute()
            return
        except Exception:
            if attempt < 2:
                time.sleep(1)


def send_pending_orders():
    sent_count = 0
    failed_count = 0

    while True:
        batch = supabase.table("orders") \
            .select("*").eq("status", "NO") \
            .limit(5).execute().data

        if not batch:
            break

        for order in batch:
            success, result = send_order_template_message(
                order["phone"],
                order["courier"],
                order.get("courier_name"),
                order["customer_name"],
                order["tracking_id"],
                order["tracking_link"]
            )

            if success:
                update_order_status(order["id"], "SENT", wamid=result)
                sent_count += 1
            else:
                update_order_status(order["id"], "FAILED", error_code=str(result))
                failed_count += 1

            time.sleep(1)

    print(f"Order send complete: {sent_count} sent, {failed_count} failed", flush=True)
    return sent_count, failed_count
