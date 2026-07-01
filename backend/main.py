from sheets import get_all_orders, get_failed_orders, batch_update_orders
from whatsapp import send_whatsapp_message
from logger import log_success, log_failure, log_system_start
from config import load_config
import time
import sys
import builtins

_original_print = print
def print(*args, **kwargs):
    kwargs['flush'] = True
    _original_print(*args, **kwargs)
builtins.print = print

def should_send_message(order):
    if order["msg_sent"].upper() in ["YES", "SENT", "DELIVERED", "READ"]:
        return False
    if not order["phone"]:
        return False
    if not order["tracking_link"]:
        return False
    return True

def process_single_tab(tab_name):
    all_orders = get_all_orders()
    orders = [o for o in all_orders if o["tab_name"] == tab_name and o["msg_sent"].upper() not in ["YES", "SENT", "DELIVERED", "READ"]]
    print(f"Processing {tab_name}: {len(orders)} pending orders")

    # only orders we will actually send
    to_send = [o for o in orders if should_send_message(o)]

    # step 1: mark all as SENT first in one batch
    sent_updates = [{"tab_name": tab_name, "row_number": o["row_number"], "status": "SENT"} for o in to_send]
    if sent_updates:
        batch_update_orders(sent_updates)

    # step 2: send messages, only mark FAILED if api call itself fails
    fail_updates = []
    for order in to_send:
        success, message = send_whatsapp_message(
            phone=order["phone"],
            name=order["customer_name"],
            tracking_id=order["tracking_id"],
            tracking_link=order["tracking_link"],
            courier_name=order["courier"]
        )
        if success:
            log_success(order["phone"], order["customer_name"], tab_name)
        else:
            fail_updates.append({"tab_name": tab_name, "row_number": order["row_number"], "status": "FAILED"})
            log_failure(order["phone"], order["customer_name"], tab_name, message)
        time.sleep(0.5)

    # step 3: mark only the api-failed ones
    if fail_updates:
        batch_update_orders(fail_updates)
        
def process_all_tabs():
    from supabase_db import supabase
    result = supabase.table("campaigns").select("id").eq("status", "SENDING").limit(1).execute()
    if result.data:
        return
    config = load_config()
    print("Starting to process all tabs...")
    from sheets import get_all_orders
    all_orders = get_all_orders()
    print(f"Total orders in cache: {len(all_orders)}")
    pending = [o for o in all_orders if o['msg_sent'].upper() not in ['YES', 'SENT', 'DELIVERED', 'READ']]
    print(f"Total pending: {len(pending)}")
    process_single_tab(config["SHEET_TAB_1"])  # ✅ Shree Anjani Couriers
    process_single_tab(config["SHEET_TAB_2"])  # ✅ DTDC Couriers
    process_single_tab(config["SHEET_TAB_3"])  # ✅ Shree Maruti Couriers
    process_single_tab(config["SHEET_TAB_4"])  # ✅ Others
    print("All tabs processed.")

def retry_failed_orders():
    failed_orders = get_failed_orders()
    print(f"Retrying {len(failed_orders)} failed orders")

    if not failed_orders:
        return

    # step 1: mark all as SENT first
    sent_updates = [{"tab_name": o["tab_name"], "row_number": o["row_number"], "status": "SENT"} for o in failed_orders]
    batch_update_orders(sent_updates)

    # step 2: send messages
    fail_updates = []
    for order in failed_orders:
        success, message = send_whatsapp_message(
            phone=order["phone"],
            name=order["customer_name"],
            tracking_id=order["tracking_id"],
            tracking_link=order["tracking_link"],
            courier_name=order["courier"]
        )
        if success:
            print(f"Retry success: {order['customer_name']}")
        else:
            fail_updates.append({"tab_name": order["tab_name"], "row_number": order["row_number"], "status": "FAILED"})
            print(f"Retry failed: {order['customer_name']}")
        time.sleep(0.5)

    # step 3: mark only api-failed ones
    if fail_updates:
        batch_update_orders(fail_updates)