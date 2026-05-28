from sheets import get_all_orders, get_failed_orders, batch_update_orders
from whatsapp import send_whatsapp_message
from logger import log_success, log_failure, log_system_start
from config import load_config
import time
import sys
import builtins

# force all print to flush immediately
_original_print = print
def print(*args, **kwargs):
    kwargs['flush'] = True
    _original_print(*args, **kwargs)
builtins.print = print

def should_send_message(order):
    if order["msg_sent"].upper() == "YES":
        return False
    if not order["phone"]:
        return False
    if not order["tracking_link"]:
        return False
    return True

def process_single_tab(tab_name):
    all_orders = get_all_orders()
    orders = [o for o in all_orders if o["tab_name"] == tab_name and o["msg_sent"].upper() != "YES"]
    print(f"Processing {tab_name}: {len(orders)} pending orders")
    
    # collect all updates here
    updates = []
    
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
            updates.append({"tab_name": tab_name, "row_number": order["row_number"], "status": "YES"})
            log_success(order["phone"], order["customer_name"], tab_name)
        else:
            updates.append({"tab_name": tab_name, "row_number": order["row_number"], "status": "FAILED"})
            log_failure(order["phone"], order["customer_name"], tab_name, message)
        
        time.sleep(0.5)
    
    # send all updates in one API call
    if updates:
        batch_update_orders(updates)
        
def process_all_tabs():
    print("Starting to process all tabs...")
    from sheets import get_all_orders
    all_orders = get_all_orders()
    print(f"Total orders in cache: {len(all_orders)}")
    pending = [o for o in all_orders if o['msg_sent'].upper() == 'NO']
    print(f"Total pending: {len(pending)}")
    process_single_tab("Anjani")
    process_single_tab("DTDC")
    process_single_tab("MARUTI")
    process_single_tab("Others")
    print("All tabs processed.")
    
           

def retry_failed_orders():
    failed_orders = get_failed_orders()
    print(f"Retrying {len(failed_orders)} failed orders")
    
    # collect all updates
    updates = []
    
    for order in failed_orders:
        success, message = send_whatsapp_message(
            phone=order["phone"],
            name=order["customer_name"],
            tracking_id=order["tracking_id"],
            tracking_link=order["tracking_link"],
            courier_name=order["tab_name"]
        )
        if success:
            updates.append({"tab_name": order["tab_name"], "row_number": order["row_number"], "status": "YES"})
            print(f"Retry success: {order['customer_name']}")
        else:
            updates.append({"tab_name": order["tab_name"], "row_number": order["row_number"], "status": "FAILED"})
            print(f"Retry failed: {order['customer_name']}")
        time.sleep(0.5)
    
    # send all updates in one API call
    if updates:
        batch_update_orders(updates)
