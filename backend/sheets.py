import gspread
from google.oauth2.service_account import Credentials
from config import load_config
from datetime import datetime

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets"
]

def connect_google_sheets():
    config = load_config()
    creds = Credentials.from_service_account_file(config["GOOGLE_CREDENTIALS_FILE"], scopes=SCOPES)
    client = gspread.authorize(creds)
    return client

def read_all_tabs():
    config = load_config()
    client = connect_google_sheets()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    tab1 = sheet.worksheet(config["SHEET_TAB_1"])
    tab2 = sheet.worksheet(config["SHEET_TAB_2"])
    tab3 = sheet.worksheet(config["SHEET_TAB_3"])
    tab4 = sheet.worksheet(config["SHEET_TAB_4"])
    return {
        "Anjani": tab1,
        "DTDC": tab2,
        "MARUTI": tab3,
        "Others": tab4
    }

def get_pending_orders_from_tab(tab_name):
    tabs = read_all_tabs()
    tab = tabs[tab_name]
    all_rows = tab.get_all_records()
    pending = []
    for row in all_rows:
        if row["Message Sent"] != "YES":
            pending.append(row)
    return pending
        
def get_all_pending_orders():
    all_pending = []
    all_pending += get_pending_orders_from_tab("Anjani")
    all_pending += get_pending_orders_from_tab("DTDC")
    all_pending += get_pending_orders_from_tab("MARUTI")
    all_pending += get_pending_orders_from_tab("Others")
    return all_pending

# This function will mark the order as failed in the respective tab and row number
def mark_as_sent(tab_name, row_number):
    tabs = read_all_tabs()
    tab = tabs[tab_name]
    tab.update_cell(row_number, 6, "YES")
    tab.update_cell(row_number, 7, str(datetime.now()))

# to mark the order as failed in the respective tab and row number
def mark_as_failed(tab_name, row_number):
    tabs = read_all_tabs()
    tab = tabs[tab_name]
    tab.update_cell(row_number, 6, "FAILED")
    tab.update_cell(row_number, 7, str(datetime.now()))
   

def get_failed_orders():
    all_failed = []
    tabs = read_all_tabs()
    for tab_name, tab in tabs.items():
        rows = tab.get_all_records()
        for row in rows:
            if row["Message Sent"] == "FAILED":
                all_failed.append(row)
    return all_failed

def get_all_contacts():
    config = load_config()
    client = connect_google_sheets()
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    tab = sheet.worksheet("Contacts")
    return tab.get_all_records()

