from flask import Flask, request, jsonify
from flask_cors import CORS
from auth import check_login, create_session, verify_session, get_user_role, get_user_tab
from main import process_all_tabs, process_single_tab, retry_failed_orders
from sheets import get_all_pending_orders, get_pending_orders_from_tab
from logger import log_system_start
from config import load_config

app = Flask(__name__)
CORS(app)

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
    return jsonify({"success": True, "status": "running"})

@app.route("/run-now", methods=["POST"])
def run_now():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] not in ["admin", "manager"]:
        return jsonify({"success": False, "message": "Access denied"}), 403
    process_all_tabs()
    return jsonify({"success": True, "message": "Processing started"})

@app.route("/orders", methods=["GET"])
def orders():
    token = get_token_from_request()
    payload = verify_session(token)
    if not payload:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    if payload["role"] == "admin":
        data = get_all_pending_orders()
    else:
        data = get_pending_orders_from_tab(payload["tab"])
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

if __name__ == "__main__":
    config = load_config()
    log_system_start()
    app.run(port=config["FLASK_PORT"], debug=True)