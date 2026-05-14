from datetime import datetime
import os

LOG_FILE = "logs.txt"

def write_log(level, message):
    timestamp = str(datetime.now())
    log_line = f"[{timestamp}] [{level}] {message}\n"
    with open(LOG_FILE, "a") as f:
        f.write(log_line)
    print(log_line)

def log_success(phone, name, courier):
    write_log("SUCCESS", f"{name} | {phone} | {courier} | Message sent")

def log_failure(phone, name, courier, error):
    write_log("FAILED", f"{name} | {phone} | {courier} | {error}")

def log_system_start():
    write_log("SYSTEM", "YMCTrackFlow started.")

def log_summary():
    write_log("SUMMARY", "Daily summary log.")