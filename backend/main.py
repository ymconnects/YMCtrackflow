from sheets import get_all_orders, mark_as_sent, mark_as_failed, get_failed_orders, refresh_cache
from whatsapp import send_whatsapp_message
from logger import log_success, log_failure, log_system_start
from config import load_config
import time
def should_send_message(order):
    if order["msg_sent"] == "YES":
        return False
    if not order["phone"]:
        return False
    if not order["tracking_link"]:
        return False
    return True

def process_single_tab(tab_name):
    all_orders = get_all_orders()
    orders = [o for o in all_orders if o["tab_name"] == tab_name and o["msg_sent"] != "YES"]
    print(f"Processing {tab_name}: {len(orders)} pending orders")
    for order in orders:
        if not should_send_message(order):
            continue
        success, message = send_whatsapp_message(
            phone=order["phone"],
            name=order["customer_name"],
            tracking_id=order["tracking_id"],
            tracking_link=order["tracking_link"],
            courier_name=tab_name
        )
        if success:
            mark_as_sent(tab_name, order["row_number"])
            log_success(order["phone"], order["customer_name"], tab_name)
        else:
            mark_as_failed(tab_name, order["row_number"])
            log_failure(order["phone"], order["customer_name"], tab_name, message)
        
        time.sleep(0.5)
        
def process_all_tabs():
    print("Starting to process all tabs...")
    process_single_tab("Anjani")
    process_single_tab("DTDC")
    process_single_tab("MARUTI")
    process_single_tab("Others")
    print("All tabs processed.")
    
           

def retry_failed_orders():
    failed_orders = get_failed_orders()
    print(f"Retrying {len(failed_orders)} failed orders")
    for order in failed_orders:
        success, message = send_whatsapp_message(
            phone=order["phone"],
            name=order["customer_name"],
            tracking_id=order["tracking_id"],
            tracking_link=order["tracking_link"],
            courier_name=order["tab_name"]
        )
        if success:
            mark_as_sent(order["tab_name"], order["row_number"])
            print(f"Retry success: {order['customer_name']}")
        else:
            mark_as_failed(order["tab_name"], order["row_number"])
            print(f"Retry failed: {order['customer_name']}")
        time.sleep(0.5)
