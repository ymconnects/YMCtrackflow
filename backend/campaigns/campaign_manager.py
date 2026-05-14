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

def get_all_campaigns():
    sheet = connect_campaigns_sheet()
    return sheet.get_all_records()

def get_campaign_status(campaign_id):
    campaigns = get_all_campaigns()
    for campaign in campaigns:
        if campaign["Campaign ID"] == campaign_id:
            return campaign
    return None

def update_campaign_status(campaign_id, status):
    sheet = connect_campaigns_sheet()
    campaigns = sheet.get_all_records()
    
    for index, campaign in enumerate(campaigns):
        if campaign["Campaign ID"] == campaign_id:
            row_number = index + 2
            sheet.update_cell(row_number, 7, status)
            if status == "SENT":
                sheet.update_cell(row_number, 9, str(datetime.now()))
            return True
    return False

def delete_campaign(campaign_id):
    sheet = connect_campaigns_sheet()
    campaigns = sheet.get_all_records()
    
    for index, campaign in enumerate(campaigns):
        if campaign["Campaign ID"] == campaign_id:
            row_number = index + 2
            sheet.delete_rows(row_number)
            return True
    return False