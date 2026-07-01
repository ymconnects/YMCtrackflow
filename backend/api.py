from flask import Flask, request, jsonify
from flask_cors import CORS
from auth import check_login, create_session, verify_session, get_user_role, get_user_tab
from scheduler import start_scheduler
from main import process_all_tabs, process_single_tab, retry_failed_orders
from sheets import get_all_orders, get_all_pending_orders, refresh_cache
from logger import log_system_start
import tempfile
from campaigns.campaign_manager import create_campaign, get_campaign, get_contacts_by_book
from campaigns.bulk_sender import send_campaign
from campaigns.audience_filter import parse_csv, save_contact_book
from supabase_db import supabase
from config import load_config
from whatsapp import get_all_templates, delete_template, create_template
import os
import threading
import time
import queue

app = Flask(__name__)
CORS(app, origins="*")

campaign_webhook_queue = queue.Queue()

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

@app.route("/templates", methods=["GET"])
def templates():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    success, data = get_all_templates()
    if success:
        return jsonify({"success": True, "templates": data})
    return jsonify({"success": False, "message": data}), 500


@app.route("/templates/delete", methods=["DELETE"])
def template_delete():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    name = request.args.get("name")
    if not name:
        return jsonify({"success": False, "message": "Template name required"}), 400
    success, msg = delete_template(name)
    if success:
        return jsonify({"success": True, "message": f"{name} deleted"})
    return jsonify({"success": False, "message": msg}), 500


@app.route("/templates/create", methods=["POST"])
def template_create():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    data = request.json
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400
    success, result = create_template(data)
    if success:
        return jsonify({"success": True, "result": result})
    return jsonify({"success": False, "message": result}), 500

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

@app.route("/retry-single", methods=["POST"])
def retry_single():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "manager"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    data = request.json
    tab_name = data.get("tab_name")
    row_number = data.get("row_number")
    phone = data.get("phone")
    name = data.get("customer_name")
    tracking_id = data.get("tracking_id")
    tracking_link = data.get("tracking_link")
    courier = data.get("courier")
    
    from whatsapp import send_whatsapp_message
    from sheets import batch_update_orders
    from logger import log_success, log_failure
    
    success, message = send_whatsapp_message(
        phone=phone,
        name=name,
        tracking_id=tracking_id,
        tracking_link=tracking_link,
        courier_name=courier
    )
    
    status = "SENT" if success else "FAILED"
    batch_update_orders([{"tab_name": tab_name, "row_number": row_number, "status": status}])
    
    if success:
        log_success(phone, name, tab_name)
        return jsonify({"success": True, "message": "Message sent"})
    else:
        log_failure(phone, name, tab_name, message)
        return jsonify({"success": False, "message": message})
    
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
    
@app.route("/campaigns/books/<book_id>/columns", methods=["GET"])
def get_book_columns(book_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    result = supabase.table("contacts").select("extra_data") \
        .eq("book_id", book_id).limit(1).execute()
    extra = (result.data[0].get("extra_data") or {}) if result.data else {}
    columns = ["name", "phone"] + list(extra.keys())
    return jsonify({"success": True, "columns": columns})


@app.route("/campaigns/upload", methods=["POST"])
def campaign_upload():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    file = request.files["file"]
    book_name = request.form.get("book_name", "Untitled")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv", mode="wb") as tmp:
        file.save(tmp)
        tmp_path = tmp.name

    try:
        contacts = parse_csv(tmp_path)
        book_id = save_contact_book(book_name, contacts)
        return jsonify({"success": True, "book_id": book_id, "book_name": book_name, "total_contacts": len(contacts)})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        os.remove(tmp_path)


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
    template_name = data.get("template_name")
    book_id = data.get("book_id")
    variables = data.get("variables", {})  # e.g. {"1": "name", "2": "phone"}

    campaign_id = create_campaign(name, template_name, book_id)
    contacts = get_contacts_by_book(book_id)

    rows = []
    for contact in contacts:
        extra = contact.get("extra_data") or {}
        resolved = []
        for key in sorted(variables.keys(), key=lambda x: int(x)):
            col = variables[key]
            if col in ("name", "phone"):
                resolved.append(contact.get(col, ""))
            else:
                resolved.append(extra.get(col, ""))
        rows.append({
            "campaign_id": campaign_id,
            "name": contact["name"],
            "phone": contact["phone"],
            "variables": resolved,
            "status": "NO",
            "status_rank": 0
        })

    supabase.table("campaign_recipients").insert(rows).execute()
    supabase.table("campaigns").update({"total": len(rows)}).eq("id", campaign_id).execute()

    return jsonify({"success": True, "campaign_id": campaign_id, "total": len(rows)})


@app.route("/campaigns/send/<campaign_id>", methods=["POST"])
def campaign_send(campaign_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403

    thread = threading.Thread(target=send_campaign, args=(campaign_id,))
    thread.daemon = True
    thread.start()
    return jsonify({"success": True, "status": "started", "campaign_id": campaign_id})


@app.route("/campaigns/status/<campaign_id>", methods=["GET"])
def campaign_status_endpoint(campaign_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403

    result = supabase.table("campaigns").select("status,sent,failed,total") \
        .eq("id", campaign_id).single().execute()
    if not result.data:
        return jsonify({"success": False, "message": "Campaign not found"}), 404
    d = result.data
    return jsonify({"success": True, "status": d["status"],
                    "sent": d["sent"], "failed": d["failed"], "total": d["total"]})

@app.route("/campaigns/books", methods=["GET"])
def get_contact_books():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    result = supabase.table("contact_books").select("*").order("created_at", desc=True).execute()
    return jsonify({"success": True, "books": result.data})


@app.route("/campaigns/books/<book_id>", methods=["DELETE"])
def delete_contact_book(book_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] != "admin":
        return jsonify({"success": False, "message": "Access denied"}), 403
    try:
        # Detach campaigns referencing this book so any FK on campaigns.book_id doesn't block the delete
        supabase.table("campaigns").update({"book_id": None}).eq("book_id", book_id).execute()
        supabase.table("contact_books").delete().eq("id", book_id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/campaigns/books/<book_id>/contacts", methods=["GET"])
def get_book_contacts(book_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    result = supabase.table("contacts").select("name,phone").eq("book_id", book_id).execute()
    return jsonify({"success": True, "contacts": result.data})


@app.route("/campaigns/<campaign_id>/recipients", methods=["GET"])
def get_campaign_recipients(campaign_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    result = supabase.table("campaign_recipients") \
        .select("name,phone,status,error_code") \
        .eq("campaign_id", campaign_id).execute()
    return jsonify({"success": True, "recipients": result.data})


@app.route("/campaigns/history", methods=["GET"])
def campaign_history():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "campaigner"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    result = supabase.table("campaigns").select("*").order("created_at", desc=True).execute()
    return jsonify({"success": True, "campaigns": result.data})


@app.route("/campaigns/<campaign_id>", methods=["DELETE"])
def delete_campaign(campaign_id):
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] != "admin":
        return jsonify({"success": False, "message": "Access denied"}), 403
    try:
        supabase.table("campaigns").delete().eq("id", campaign_id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


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

@app.route("/webhook", methods=["GET"])
def webhook_verify():
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")
    
    if mode == "subscribe" and token == os.getenv("WEBHOOK_VERIFY_TOKEN"):
        print("Webhook verified", flush=True)
        return challenge, 200
    else:
        return "Forbidden", 403

@app.route("/webhook", methods=["POST"])
def webhook_receive():
    data = request.json
    
    try:
        entry = data["entry"][0]
        changes = entry["changes"][0]
        value = changes["value"]
        
        # handle delivery status updates
        if "statuses" in value:
            for status in value["statuses"]:
                msg_id = status["id"]
                status_type = status["status"]
                phone = status["recipient_id"]
                print(f"Status update: {phone} | {status_type}", flush=True)
                from sheets import update_order_status_by_phone
                update_order_status_by_phone(phone, status_type)

                # campaign_recipients — queue for background processing
                STATUS_MAP = {"sent": "SENT", "delivered": "DELIVERED", "read": "DELIVERED", "failed": "FAILED"}
                mapped = STATUS_MAP.get(status_type)
                if mapped:
                    errors = status.get("errors") or []
                    error_code = str(errors[0]["code"]) if errors else None
                    campaign_webhook_queue.put({"wamid": msg_id, "status": mapped, "error_code": error_code})
        
        # handle incoming messages
        if "messages" in value:
            message = value["messages"][0]
            from_phone = message["from"]
            print(f"Incoming message from: {from_phone}", flush=True)
            from sheets import was_message_sent_within_24hrs
            from whatsapp import send_fixed_reply
            if was_message_sent_within_24hrs(from_phone):
                send_fixed_reply(from_phone)
                print(f"Auto replied to: {from_phone}", flush=True)
            else:
                print(f"Outside 24hr window. No reply sent.", flush=True)

    except Exception as e:
        print(f"Webhook error: {e}", flush=True)
    
    return jsonify({"status": "ok"}), 200

def process_campaign_webhook_queue():
    from campaigns.bulk_sender import update_recipient_status
    while True:
        try:
            items = []
            while not campaign_webhook_queue.empty():
                try:
                    items.append(campaign_webhook_queue.get_nowait())
                except queue.Empty:
                    break
            for item in items:
                try:
                    row = supabase.table("campaign_recipients") \
                        .select("id").eq("wamid", item["wamid"]).limit(1).execute()
                    if row.data:
                        update_recipient_status(row.data[0]["id"], item["status"], error_code=item.get("error_code"))
                except Exception as e:
                    print(f"Campaign queue item error: {e}", flush=True)
        except Exception as e:
            print(f"Campaign queue processor error: {e}", flush=True)
        time.sleep(10)


if __name__ == "__main__":
    config = load_config()
    log_system_start()
    # auto start scheduler on boot
    start_scheduler()
    threading.Thread(target=process_campaign_webhook_queue, daemon=True).start()
    app.run(host='0.0.0.0', port=config["FLASK_PORT"], debug=True, use_reloader=False)

