from apscheduler.schedulers.background import BackgroundScheduler
from config import load_config
from main import process_all_tabs

import requests
scheduler = BackgroundScheduler()
auto_message_enabled = True
def run_if_enabled():
    if auto_message_enabled:
        process_all_tabs()
def keep_alive():
    try:
        requests.get("https://ymctrackflow-backend.onrender.com/status")
        print("Keep alive ping sent.")
    except Exception as e:
        print(f"Keep alive failed: {e}")

def start_scheduler():
    config = load_config()
    interval = config["CHECK_INTERVAL_MINUTES"]
    scheduler.add_job(run_if_enabled, 'interval', minutes=interval)
    scheduler.add_job(keep_alive, 'interval', minutes=interval)
    scheduler.start()
    print(f"Scheduler started. Running every {interval} minutes.")

def stop_scheduler():
    scheduler.shutdown()
    print("Scheduler stopped.")        