# sheets.py
# Google Sheets connection and data reading
# Has caching to avoid rate limits

import gspread
from google.oauth2.service_account import Credentials
from config import load_config
from datetime import datetime
import time

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

# cache storage
_cache = {
    "orders": None,
    "last_fetch": 0,
    "ttl": 600
}
def connect_google_sheets():
    # connects to Google using credentials.json
    config = load_config()
    creds = Credentials.from_service_account_file(
        config["GOOGLE_CREDENTIALS_FILE"],
        scopes=SCOPES
    )
    client = gspread.authorize(creds)
    return client

def _is_cache_valid():
    # checks if cache is still fresh
    # returns True if within 10 minutes
    if _cache["orders"] is None:
        return False
    age = time.time() - _cache["last_fetch"]
    return age < _cache["ttl"]
def _fetch_all_orders():
    # reads ALL orders from ALL 4 tabs
    # called only when cache expires
    config = load_config()
    client = connect_google_sheets()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])

    all_orders = []
    tabs = [
        config["SHEET_TAB_1"],
        config["SHEET_TAB_2"],
        config["SHEET_TAB_3"],
        config["SHEET_TAB_4"]
    ]

    for tab_name in tabs:
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
                    "row_number":    i
                })
        except Exception as e:
            print(f"Error reading tab {tab_name}: {e}")
            continue

    return all_orders
def get_all_orders():
    # returns orders from cache
    # reads Google only if cache expired
    if not _is_cache_valid():
        print("Cache expired. Reading Google Sheets...")
        _cache["orders"] = _fetch_all_orders()
        _cache["last_fetch"] = time.time()
    else:
        print("Returning cached orders.")
    return _cache["orders"]

def refresh_cache():
    # forces cache refresh
    # called when Sync button clicked
    print("Force refreshing cache...")
    _cache["orders"] = _fetch_all_orders()
    _cache["last_fetch"] = time.time()
    return _cache["orders"]
def get_all_pending_orders():
    # returns only orders not yet sent
    orders = get_all_orders()
    return [o for o in orders if o["msg_sent"] != "YES"]

def get_failed_orders():
    # returns only failed orders
    orders = get_all_orders()
    return [o for o in orders if o["msg_sent"] == "FAILED"]

def mark_as_sent(tab_name, row_number):
    # updates Google Sheet cell to YES
    client = connect_google_sheets()
    config = load_config()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    tab = sheet.worksheet(tab_name)
    tab.update_cell(row_number, 5, "YES")
    tab.update_cell(row_number, 6, str(datetime.now()))
    # refresh cache after update
    

def mark_as_failed(tab_name, row_number):
    # updates Google Sheet cell to FAILED
    client = connect_google_sheets()
    config = load_config()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    tab = sheet.worksheet(tab_name)
    tab.update_cell(row_number, 5, "FAILED")
    tab.update_cell(row_number, 6, str(datetime.now()))
    # refresh cache after update
    
def batch_update_orders(updates):
    # updates multiple orders in ONE API call
    # updates = list of {tab_name, row_number, status}
    config = load_config()
    client = connect_google_sheets()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    now = str(datetime.now())
    
    # group updates by tab
    tabs = {}
    for update in updates:
        tab_name = update["tab_name"]
        if tab_name not in tabs:
            tabs[tab_name] = []
        tabs[tab_name].append(update)
    
    # update each tab once
    for tab_name, tab_updates in tabs.items():
        tab = sheet.worksheet(tab_name)
        for update in tab_updates:
            row = update["row_number"]
            status = update["status"]
            tab.update_cell(row, 5, status)
            tab.update_cell(row, 6, now)
            # update cache in memory directly
            if _cache["orders"]:
                for order in _cache["orders"]:
                    if order["row_number"] == row and order["tab_name"] == tab_name:
                        order["msg_sent"] = status
                        order["last_updated"] = now

def get_all_contacts():
    # returns contacts for campaigns
    config = load_config()
    client = connect_google_sheets()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    try:
        tab = sheet.worksheet("Contacts")
        return tab.get_all_records()
    except:
        return []