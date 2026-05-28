from flask import Flask, request, jsonify
from flask_cors import CORS
from auth import check_login, create_session, verify_session, get_user_role, get_user_tab
from scheduler import start_scheduler
from main import process_all_tabs, process_single_tab, retry_failed_orders
from sheets import get_all_orders, get_all_pending_orders, refresh_cache
from logger import log_system_start
from campaigns.campaign_manager import create_campaign, get_all_campaigns, get_campaign_status, update_campaign_status, delete_campaign
from campaigns.bulk_sender import send_campaign, calculate_cost, track_progress
from campaigns.audience_filter import estimate_audience_count
from campaigns.campaign_scheduler import schedule_campaign, cancel_scheduled_campaign, get_scheduled_campaigns
from config import load_config

app = Flask(__name__)
CORS(app, origins="*")

def get_token_from_request():
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    return None

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if check_login(username, password):
        token = create_session(username)
        return jsonify({
            "success": True,
            "token": token,
            "role": get_user_role(username),
            "tab": get_user_tab(username)
        })
    else:
        return jsonify({
            "success": False,
            "message": "Wrong username or password"
        }), 401

@app.route("/logout", methods=["POST"])
def logout():
    return jsonify({"success": True, "message": "Logged out"})

@app.route("/me", methods=["GET"])
def me():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    return jsonify({
        "success": True,
        "username": payload["username"],
        "role": payload["role"],
        "tab": payload["tab"]
    })

@app.route("/status", methods=["GET"])
def status():
    # return system on/off and auto message status
    from scheduler import get_system_status, get_auto_message_status
    return jsonify({
        "success": True,
        "status": "running",
        "system_on": get_system_status(),
        "auto_message": get_auto_message_status()
    })

@app.route("/run-now", methods=["POST"])
def run_now():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "manager"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    try:
        process_all_tabs()
        return jsonify({"success": True, "message": "Processing started"})
    except Exception as e:
        print(f"Error in run-now: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/orders", methods=["GET"])
def orders():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] == "campaigner":
        return jsonify({"success": False, "message": "Access denied"}), 403
    from sheets import get_all_orders, refresh_cache
    data = get_all_orders()
    return jsonify({"success": True, "orders": data})

@app.route("/retry-failed", methods=["POST"])
def retry_failed():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "manager"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    retry_failed_orders()
    return jsonify({"success": True, "message": "Retry started"})

@app.route("/toggle-auto-message", methods=["POST"])
def toggle_auto_message_endpoint():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] != "admin":
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    data = request.json
    enabled = data.get("enabled", True)
    
    from scheduler import toggle_auto_message
    toggle_auto_message(enabled)
    
    return jsonify({"success": True, "auto_message": enabled})

@app.route("/auto-message-status", methods=["GET"])
def auto_message_status():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    from scheduler import get_auto_message_status
    return jsonify({"success": True, "enabled": get_auto_message_status()})

@app.route("/toggle-system", methods=["POST"])
def toggle_system_endpoint():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] != "admin":
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    data = request.json
    action = data.get("action")
    
    from scheduler import toggle_system
    
    if action == "start":
        toggle_system(True)
        return jsonify({"success": True, "system": "started"})
    elif action == "stop":
        toggle_system(False)
        return jsonify({"success": True, "system": "stopped"})
    else:
        return jsonify({"success": False, "message": "Invalid action"}), 400
    
@app.route("/campaigns", methods=["GET"])
def list_campaigns():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    campaigns = get_all_campaigns()
    return jsonify({"success": True, "campaigns": campaigns})

@app.route("/campaigns/create", methods=["POST"])
def create_new_campaign():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    data = request.json
    name = data.get("name")
    template = data.get("template")
    audience = data.get("audience", [])
    
    campaign_id = create_campaign(name, template, audience)
    return jsonify({"success": True, "campaign_id": campaign_id})

@app.route("/campaigns/<campaign_id>/status", methods=["GET"])
def campaign_status(campaign_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    campaign = get_campaign_status(campaign_id)
    if not campaign:
        return jsonify({"success": False, "message": "Campaign not found"}), 404
    return jsonify({"success": True, "campaign": campaign})

@app.route("/campaigns/<campaign_id>/send", methods=["POST"])
def send_campaign_endpoint(campaign_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    success, result = send_campaign(campaign_id)
    return jsonify({"success": success, "result": result})

@app.route("/campaigns/<campaign_id>/cancel", methods=["POST"])
def cancel_campaign_endpoint(campaign_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    success = cancel_scheduled_campaign(campaign_id)
    return jsonify({"success": success})

@app.route("/campaigns/<campaign_id>/report", methods=["GET"])
def campaign_report(campaign_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    progress = track_progress(campaign_id)
    if not progress:
        return jsonify({"success": False, "message": "Campaign not found"}), 404
    return jsonify({"success": True, "report": progress})

@app.route("/audience/estimate", methods=["POST"])
def audience_estimate():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    data = request.json
    filters = data.get("filters", {})
    
    count = estimate_audience_count(filters)
    cost = calculate_cost(count, "campaign")
    
    return jsonify({
        "success": True,
        "count": count,
        "estimated_cost": cost
    })

@app.route("/logs", methods=["GET"])
def get_logs():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    try:
        from logger import read_logs
        logs = read_logs()
        return jsonify({"success": True, "logs": logs})
    except Exception as e:
        return jsonify({"success": True, "logs": []})
    
@app.route("/sync", methods=["POST"])
def sync():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    from sheets import refresh_cache
    orders = refresh_cache()
    return jsonify({"success": True, "message": "Synced", "orders": orders})

if __name__ == "__main__":
    config = load_config()
    log_system_start()
    # auto start scheduler on boot
    start_scheduler()
    app.run(host='0.0.0.0', port=config["FLASK_PORT"], debug=True, use_reloader=False)

