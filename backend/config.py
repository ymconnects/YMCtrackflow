from dotenv import load_dotenv # pip install python-dotenv
import os # for accessing environment variables

load_dotenv() # Load environment variables from .env file

def load_config(): 
    META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")# Access token for Meta API
    META_PHONE_NUMBER_ID = os.getenv("META_PHONE_NUMBER_ID")  # Phone number ID for Meta API
    META_WABA_ID = os.getenv("META_WABA_ID")# WhatsApp Business Account ID for Meta API

    GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")# Google Sheet ID for storing data
    GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")# Path to Google credentials file
    META_TEMPLATE_ANJANI = os.getenv("META_TEMPLATE_ANJANI")
    META_TEMPLATE_DTDC = os.getenv("META_TEMPLATE_DTDC")
    META_TEMPLATE_MARUTI = os.getenv("META_TEMPLATE_MARUTI")
    META_TEMPLATE_OTHERS = os.getenv("META_TEMPLATE_OTHERS")
    SHEET_TAB_1 = os.getenv("SHEET_TAB_1", "Anjani")
    SHEET_TAB_2 = os.getenv("SHEET_TAB_2", "DTDC")
    SHEET_TAB_3 = os.getenv("SHEET_TAB_3", "MARUTI")
    SHEET_TAB_4 = os.getenv("SHEET_TAB_4", "Others")
    CHECK_INTERVAL_MINUTES = int(os.getenv("CHECK_INTERVAL_MINUTES", "10"))
    RETRY_INTERVAL_HOURS = int(os.getenv("RETRY_INTERVAL_HOURS", "2"))
    BATCH_SIZE = int(os.getenv("BATCH_SIZE", "80"))
    FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))

    MANAGER_USERNAME = os.getenv("MANAGER_USERNAME")
    MANAGER_PASSWORD = os.getenv("MANAGER_PASSWORD")
    
    CAMPAIGNER_USERNAME = os.getenv("CAMPAIGNER_USERNAME")
    CAMPAIGNER_PASSWORD = os.getenv("CAMPAIGNER_PASSWORD")
    
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
    
    VIEWER_USERNAME = os.getenv("VIEWER_USERNAME")
    VIEWER_PASSWORD = os.getenv("VIEWER_PASSWORD")
    FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY")
    return {
        "META_ACCESS_TOKEN": META_ACCESS_TOKEN,
        "META_PHONE_NUMBER_ID": META_PHONE_NUMBER_ID,
        "META_WABA_ID": META_WABA_ID,
        "GOOGLE_SHEET_ID": GOOGLE_SHEET_ID,
        "GOOGLE_CREDENTIALS_FILE": GOOGLE_CREDENTIALS_FILE,
        "META_TEMPLATE_ANJANI": META_TEMPLATE_ANJANI,
        "META_TEMPLATE_DTDC": META_TEMPLATE_DTDC,
        "META_TEMPLATE_MARUTI": META_TEMPLATE_MARUTI,
        "META_TEMPLATE_OTHERS": META_TEMPLATE_OTHERS,
        "SHEET_TAB_1": SHEET_TAB_1,
        "SHEET_TAB_2": SHEET_TAB_2,
        "SHEET_TAB_3": SHEET_TAB_3,
        "SHEET_TAB_4": SHEET_TAB_4,
        "CHECK_INTERVAL_MINUTES": CHECK_INTERVAL_MINUTES,
        "RETRY_INTERVAL_HOURS": RETRY_INTERVAL_HOURS,
        "BATCH_SIZE": BATCH_SIZE,
        "FLASK_PORT": FLASK_PORT,
        "FLASK_SECRET_KEY": FLASK_SECRET_KEY,
        "MANAGER_USERNAME": MANAGER_USERNAME,
        "MANAGER_PASSWORD": MANAGER_PASSWORD,
        "CAMPAIGNER_USERNAME": CAMPAIGNER_USERNAME,
        "CAMPAIGNER_PASSWORD": CAMPAIGNER_PASSWORD,
        "ADMIN_USERNAME": ADMIN_USERNAME,
        "ADMIN_PASSWORD": ADMIN_PASSWORD,
        "VIEWER_USERNAME": VIEWER_USERNAME,
        "VIEWER_PASSWORD": VIEWER_PASSWORD,
    }
def validate_config(config):
    required = [
        "META_ACCESS_TOKEN",
        "META_PHONE_NUMBER_ID",
        "GOOGLE_SHEET_ID",
        "FLASK_SECRET_KEY",
    ]
    missing = []
    for key in required:
        if not config[key]:
            missing.append(key)
    if missing:
        print(f"ERROR: Missing config keys: {missing}")
        return False
    
    print("Config OK. All keys loaded.")
    return True                             