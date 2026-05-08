from sheets import get_all_pending_orders, get_pending_orders_from_tab, mark_as_sent, mark_as_failed, get_failed_orders
from whatsapp import send_whatsapp_message
from config import load_config
import time
def should_send_message(order):
    if order["Message Sent"] == "YES":
        return False
    if not order["Phone"]:
        return False
    if not order["Tracking Link"]:
        return False
    return True

def process_single_tab(tab_name):
    orders = get_pending_orders_from_tab(tab_name)
    print(f"Processing {tab_name}: {len(orders)} pending orders")
    for order in orders:
        if not should_send_message(order):
            continue
        success, message = send_whatsapp_message(
            phone=order["Phone"],
            name=order["Customer Name"],
            tracking_id=order["Tracking ID"],
            tracking_link=order["Tracking Link"],
            courier_name=tab_name
        )
        if success:
            mark_as_sent(tab_name, order["row_number"])
            print(f"Sent to {order['Customer Name']} - {order['Phone']}")
        else:
            mark_as_failed(tab_name, order["row_number"])
            print(f"Failed for {order['Customer Name']} - {message}")
        
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
            phone=order["Phone"],
            name=order["Customer Name"],
            tracking_id=order["Tracking ID"],
            tracking_link=order["Tracking Link"],
            courier_name=order["tab_name"]
        )
        if success:
            mark_as_sent(order["tab_name"], order["row_number"])
            print(f"Retry success: {order['Customer Name']}")
        else:
            mark_as_failed(order["tab_name"], order["row_number"])
            print(f"Retry failed: {order['Customer Name']}")
        time.sleep(0.5)

