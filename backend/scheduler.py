from apscheduler.schedulers.background import BackgroundScheduler
from config import load_config
from main import process_all_tabs

import requests
scheduler = BackgroundScheduler()
auto_message_enabled = True
system_on = True

def keep_alive():
    try:
        requests.get("https://ymctrackflow-backend.onrender.com/status")
        print("Keep alive ping sent.")
    except Exception as e:
        print(f"Keep alive failed: {e}")

def run_if_enabled():
    if auto_message_enabled:
        process_all_tabs()

def start_scheduler():
    config = load_config()
    interval = config["CHECK_INTERVAL_MINUTES"]
    # keep alive runs every 10 minutes to prevent server sleep
    scheduler.add_job(keep_alive, 'interval', minutes=10)
    # message processing runs on configured interval
    scheduler.add_job(run_if_enabled, 'interval', minutes=interval)
    scheduler.start()
    print(f"Scheduler started. Keep alive every 10 min. Messages every {interval} minutes.")

def stop_scheduler():
    scheduler.shutdown()
    print("Scheduler stopped.")

def toggle_auto_message(state):
    global auto_message_enabled
    auto_message_enabled = state
    print(f"Auto message: {'ON' if state else 'OFF'}")

def get_auto_message_status():
    return auto_message_enabled     

def get_system_status():
    # return current system on/off state
    return system_on

def toggle_system(state):
    # set system on or off
    global system_on
    system_on = state
    print(f"System: {'ON' if state else 'OFF'}")   