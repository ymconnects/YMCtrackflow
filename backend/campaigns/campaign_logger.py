from datetime import datetime

CAMPAIGN_LOG_FILE = "campaign_logs.txt"

def write_campaign_log(level, message):
    timestamp = str(datetime.now())
    log_line = f"[{timestamp}] [{level}] {message}\n"
    with open(CAMPAIGN_LOG_FILE, "a") as f:
        f.write(log_line)
    print(log_line)

def log_campaign_start(campaign_id):
    write_campaign_log("START", f"Campaign {campaign_id} started")

def log_campaign_result(campaign_id, sent, failed):
    write_campaign_log("RESULT", f"Campaign {campaign_id} | Sent: {sent} | Failed: {failed}")

def log_campaign_complete(campaign_id):
    write_campaign_log("COMPLETE", f"Campaign {campaign_id} completed")