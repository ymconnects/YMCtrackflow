import gspread
from google.oauth2.service_account import Credentials
from config import load_config
from datetime import datetime

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets"
]

def connect_contacts_sheet():
    config = load_config()
    creds = Credentials.from_service_account_file(
        config["GOOGLE_CREDENTIALS_FILE"],
        scopes=SCOPES
    )
    client = gspread.authorize(creds)
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    return sheet.worksheet("Contacts")

def get_all_customers():
    sheet = connect_contacts_sheet()
    return sheet.get_all_records()

def filter_by_date_range(start, end):
    customers = get_all_customers()
    filtered = []
    
    start_date = datetime.strptime(start, "%Y-%m-%d")
    end_date = datetime.strptime(end, "%Y-%m-%d")
    
    for customer in customers:
        try:
            order_date = datetime.strptime(customer["Last Order Date"], "%Y-%m-%d")
            if start_date <= order_date <= end_date:
                filtered.append(customer)
        except:
            continue
    return filtered

def filter_by_status(status):
    customers = get_all_customers()
    filtered = []
    for customer in customers:
        if customer.get("Status") == status:
            filtered.append(customer)
    return filtered

def filter_by_city(city):
    customers = get_all_customers()
    filtered = []
    for customer in customers:
        if customer.get("City", "").lower() == city.lower():
            filtered.append(customer)
    return filtered

def filter_by_tags(tags):
    customers = get_all_customers()
    filtered = []
    for customer in customers:
        customer_tags = customer.get("Tags", "").split(",")
        customer_tags = [t.strip().lower() for t in customer_tags]
        
        for tag in tags:
            if tag.lower() in customer_tags:
                filtered.append(customer)
                break
    return filtered

def filter_opted_in_only():
    customers = get_all_customers()
    filtered = []
    for customer in customers:
        if customer.get("Opted In", "").upper() == "YES":
            filtered.append(customer)
    return filtered

def estimate_audience_count(filters):
    customers = get_all_customers()
    count = len(customers)
    
    if filters.get("opted_in_only"):
        customers = filter_opted_in_only()
        count = len(customers)
    
    if filters.get("city"):
        customers = [c for c in customers if c.get("City", "").lower() == filters["city"].lower()]
        count = len(customers)
    
    return count