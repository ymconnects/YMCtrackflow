from apscheduler.schedulers.background import BackgroundScheduler
from config import load_config
from orders.bulk_sender import send_pending_orders
from supabase_db import supabase

import requests
scheduler = BackgroundScheduler()
# load settings from Supabase on startup
try:
    _settings = supabase.table("system_settings").select("*").eq("id", 1).single().execute().data
    auto_message_enabled = _settings["auto_message"]
    system_on = _settings["system_on"]
except:
    # default if Supabase not available
    auto_message_enabled = True
    system_on = True

def keep_alive():
    try:
        requests.get("https://ymctrackflow.onrender.com/status")
        print("Keep alive ping sent.")
    except Exception as e:
        print(f"Keep alive failed: {e}")

def run_if_enabled():
    if auto_message_enabled:
        send_pending_orders()

def start_scheduler():
    config = load_config()
    interval = config["CHECK_INTERVAL_MINUTES"]
    # keep alive runs every 10 minutes to prevent server sleep
    scheduler.add_job(keep_alive, 'interval', minutes=10)
    # message processing runs on configured interval
    scheduler.add_job(run_if_enabled, 'interval', minutes=interval)
    scheduler.start()
    print(f"Scheduler started. Keep alive every 10 min. Messages every {interval} minutes. "
          f"Campaign retries are manual only (Retry button).")

def stop_scheduler():
    scheduler.shutdown()
    print("Scheduler stopped.")

def toggle_auto_message(state):
    global auto_message_enabled
    auto_message_enabled = state
    # save to Supabase so it persists after restart
    supabase.table("system_settings").update({"auto_message": state}).eq("id", 1).execute()
    print(f"Auto message: {'ON' if state else 'OFF'}")

def get_auto_message_status():
    return auto_message_enabled     

def get_system_status():
    # return current system on/off state
    return system_on

def toggle_system(state):
    global system_on
    system_on = state
    # save to Supabase so it persists after restart
    supabase.table("system_settings").update({"system_on": state}).eq("id", 1).execute()
    print(f"System: {'ON' if state else 'OFF'}")