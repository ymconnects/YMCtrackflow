from apscheduler.schedulers.background import BackgroundScheduler
from config import load_config
from main import process_all_tabs

import requests
scheduler = BackgroundScheduler()
def keep_alive():
    try:
        requests.get("https://ymctrackflow-backend.onrender.com/status")
        print("Keep alive ping sent.")
    except Exception as e:
        print(f"Keep alive failed: {e}")