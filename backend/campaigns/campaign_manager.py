import gspread
from google.oauth2.service_account import Credentials
from config import load_config
from datetime import datetime
import uuid

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets"
]

def connect_campaigns_sheet():
    config = load_config()
    creds = Credentials.from_service_account_file(
        config["GOOGLE_CREDENTIALS_FILE"],
        scopes=SCOPES
    )
    client = gspread.authorize(creds)
    sheet = client.open_by_key(config["GOOGLE_SHEET_ID"])
    return sheet.worksheet("Campaigns")

def create_campaign(name, template, audience):
    sheet = connect_campaigns_sheet()
    campaign_id = str(uuid.uuid4())[:8]
    created_at = str(datetime.now())
    
    new_row = [
        campaign_id,
        name,
        template,
        len(audience),
        0,
        0,
        "DRAFT",
        created_at,
        ""
    ]
    sheet.append_row(new_row)
    return campaign_id