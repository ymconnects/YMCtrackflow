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

def read_logs():
    logs = []
    if not os.path.exists(LOG_FILE):
        return logs
    with open(LOG_FILE, "r") as f:
        lines = f.readlines()
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            # parse: [timestamp] [level] message
            parts = line.split('] [')
            time_part = parts[0].replace('[', '').strip()
            level_part = parts[1].replace(']', '').strip()
            message_part = parts[2].strip() if len(parts) > 2 else ''
            logs.append({
                'time': time_part[11:19],  # HH:MM:SS only
                'level': level_part,
                'message': message_part,
                'order_id': '',
                'customer': '',
                'courier': ''
            })
        except:
            continue
    return logs[:100]  # return last 100 logs