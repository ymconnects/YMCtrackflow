# sheets.py
# Google Sheets connection and data reading
# Only kept alive for migrate_orders.py's one-off resync (Group E will remove both)

import gspread
from google.oauth2.service_account import Credentials
from config import load_config
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

def refresh_cache():
    print("Force refreshing cache...")
    _cache["orders"] = _fetch_all_orders()
    _cache["last_fetch"] = time.time()
    return _cache["orders"]
