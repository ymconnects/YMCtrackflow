import gspread
from google.oauth2.service_account import Credentials
from config import load_config
from datetime import datetime

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets"
]
