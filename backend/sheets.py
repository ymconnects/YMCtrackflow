# sheets.py
# Google Sheets connection and data reading
# Has caching to avoid rate limits

import gspread
from google.oauth2.service_account import Credentials
from config import load_config
from datetime import datetime
import pytz
import time

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

# cache storage
_cache = {
    "orders": None,
    "last_fetch": 0,
    "ttl": 600
}

def connect_google_sheets():
    config = load_config()
    creds = Credentials.from_service_account_file(
        config["GOOGLE_CREDENTIALS_FILE"],
        scopes=SCOPES
    )
    client = gspread.authorize(creds)
    return client

def _is_cache_valid():
    if _cache["orders"] is None:
        return False
    return time.time() - _cache["last_fetch"] < _cache["ttl"]

def _fetch_all_orders():
    config = load_config()
    client = connect_google_sheets()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])

    all_orders = []
    fixed_tabs = [
        config["SHEET_TAB_1"],  # DTDC Couriers
        config["SHEET_TAB_2"],  # Shree Maruti Couriers
        config["SHEET_TAB_3"],  # Shree Anjani Couriers
    ]
    other_tab = config["SHEET_TAB_4"]  # Others

    # fixed courier sheets
    for tab_name in fixed_tabs:
        try:
            tab = sheet.worksheet(tab_name)
            rows = tab.get_all_records()
            for i, row in enumerate(rows, start=2):
                all_orders.append({
                    "order_id":      f"{tab_name[:3].upper()}{i:04d}",
                    "customer_name": row.get("Name", ""),
                    "phone":         str(row.get("Phone", "")),
                    "courier":       tab_name,
                    "tracking_id":   str(row.get("Tracking ID", "")),
                    "tracking_link": row.get("Tracking Link", ""),
                    "msg_sent":      row.get("Message Sent", "NO") or "NO",
                    "last_updated":  row.get("Last Updated", ""),
                    "tab_name":      tab_name,
                    "row_number":    i,
                    "is_other":      False
                })
        except Exception as e:
            print(f"Error reading tab {tab_name}: {e}")
            continue

    # other sheet
    try:
        tab = sheet.worksheet(other_tab)
        rows = tab.get_all_records()
        for i, row in enumerate(rows, start=2):
            all_orders.append({
                "order_id":      f"OTH{i:04d}",
                "customer_name": row.get("Name", ""),
                "phone":         str(row.get("Phone", "")),
                "courier":       row.get("Courier Name", ""),
                "tracking_id":   str(row.get("Tracking ID", "")),
                "tracking_link": row.get("Tracking Link", ""),
                "msg_sent":      row.get("Message Sent", "NO") or "NO",
                "last_updated":  row.get("Last Updated", ""),
                "tab_name":      other_tab,
                "row_number":    i,
                "is_other":      True
            })
    except Exception as e:
        print(f"Error reading tab {other_tab}: {e}")

    return all_orders

def get_all_orders():
    if not _is_cache_valid():
        print("Cache expired. Reading Google Sheets...")
        _cache["orders"] = _fetch_all_orders()
        _cache["last_fetch"] = time.time()
    else:
        print("Returning cached orders.")
    return _cache["orders"]

def refresh_cache():
    print("Force refreshing cache...")
    _cache["orders"] = _fetch_all_orders()
    _cache["last_fetch"] = time.time()
    return _cache["orders"]

def get_all_pending_orders():
    orders = get_all_orders()
    return [o for o in orders if o["msg_sent"] != "YES"]

def get_failed_orders():
    orders = get_all_orders()
    return [o for o in orders if o["msg_sent"] == "FAILED"]

def _get_status_columns(tab_name):
    # Other sheet has extra Courier Name column so status columns shift by 1
    config = load_config()
    if tab_name == config["SHEET_TAB_4"]:
        return 6, 7  # Message Sent, Last Updated
    return 5, 6      # Message Sent, Last Updated

def mark_as_sent(tab_name, row_number):
    client = connect_google_sheets()
    config = load_config()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    tab = sheet.worksheet(tab_name)
    msg_col, date_col = _get_status_columns(tab_name)
    tab.update_cell(row_number, msg_col, "YES")
    tab.update_cell(row_number, date_col, str(datetime.now()))

def mark_as_failed(tab_name, row_number):
    client = connect_google_sheets()
    config = load_config()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    tab = sheet.worksheet(tab_name)
    msg_col, date_col = _get_status_columns(tab_name)
    tab.update_cell(row_number, msg_col, "FAILED")
    tab.update_cell(row_number, date_col, str(datetime.now()))

def batch_update_orders(updates):
    config = load_config()
    client = connect_google_sheets()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    IST = pytz.timezone('Asia/Kolkata')
    now = str(datetime.now(IST).strftime('%Y-%m-%d %H:%M:%S'))

    tabs = {}
    for update in updates:
        tab_name = update["tab_name"]
        if tab_name not in tabs:
            tabs[tab_name] = []
        tabs[tab_name].append(update)

    for tab_name, tab_updates in tabs.items():
        tab = sheet.worksheet(tab_name)
        msg_col, date_col = _get_status_columns(tab_name)
        for update in tab_updates:
            row = update["row_number"]
            status = update["status"]
           
            tab.update_cell(row, msg_col, status)
            tab.update_cell(row, msg_col, status)
            tab.update_cell(row, date_col, now)
            if _cache["orders"]:
                for order in _cache["orders"]:
                    if order["row_number"] == row and order["tab_name"] == tab_name:
                        order["msg_sent"] = status
                        order["last_updated"] = now

def get_all_contacts():
    config = load_config()
    client = connect_google_sheets()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    try:
        tab = sheet.worksheet("Contacts")
        return tab.get_all_records()
    except:
        return []

def get_settings():
    config = load_config()
    client = connect_google_sheets()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    tab = sheet.worksheet("Settings")
    row = tab.row_values(2)
    return {
        "system_on": row[0].upper() == "TRUE",
        "auto_message": row[1].upper() == "TRUE"
    }

def save_settings_to_sheet(system_on, auto_message):
    config = load_config()
    client = connect_google_sheets()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    tab = sheet.worksheet("Settings")
    tab.update_cell(2, 1, str(system_on).upper())
    tab.update_cell(2, 2, str(auto_message).upper())

def update_order_status_by_phone(phone, status_type):
    orders = get_all_orders()
    target = None
    
    status_map = {
        "sent": "SENT",
        "delivered": "DELIVERED",
        "read": "DELIVERED",
        "failed": "FAILED"
    }
    
    new_status = status_map.get(status_type)
    if not new_status:
        return

    for order in orders:
        formatted = format_phone(order["phone"])
        if formatted == phone:
            target = order
            break
    
    if not target:
        print(f"No order found for phone: {phone}", flush=True)
        return
    
    batch_update_orders([{
        "tab_name": target["tab_name"],
        "row_number": target["row_number"],
        "status": new_status
    }])
    print(f"Status updated: {phone} → {new_status}", flush=True)

def format_phone(phone):
    phone = str(phone).strip().replace("+", "").replace(" ", "")
    if len(phone) == 10:
        phone = "91" + phone
    return phone

def was_message_sent_within_24hrs(phone):
    from datetime import timezone, timedelta
    orders = get_all_orders()
    IST = pytz.timezone('Asia/Kolkata')
    now = datetime.now(IST)
    
    for order in orders:
        formatted = format_phone(order["phone"])
        if formatted == phone and order["msg_sent"] in ["YES", "SENT", "DELIVERED", "FAILED"]:
            try:
                last = datetime.strptime(order["last_updated"], "%Y-%m-%d %H:%M:%S")
                last = IST.localize(last)
                diff = now - last
                print(f"24hr check: {phone} | last={last} | now={now} | diff={diff.total_seconds()}", flush=True)
                if diff.total_seconds() < 86400:
                    return True
            except:
                pass
    return False