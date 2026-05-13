import jwt
import datetime
import os
from config import load_config

def get_all_users():
    config = load_config()
    users = {
        config["ADMIN_USERNAME"]: {
            "password": config["ADMIN_PASSWORD"],
            "role": "admin",
            "tab": None
        },
        config["MANAGER_USERNAME"]: {
            "password": config["MANAGER_PASSWORD"],
            "role": "manager",
            "tab": None
        },
        config["CAMPAIGNER_USERNAME"]: {
            "password": config["CAMPAIGNER_PASSWORD"],
            "role": "campaigner",
            "tab": None
        },
        config["VIEWER_USERNAME"]: {
            "password": config["VIEWER_PASSWORD"],
            "role": "viewer",
            "tab": None
        },
    }
    return users
def check_login(username, password):
    users = get_all_users()
    if username in users:
        if users[username]["password"] == password:
            return True
    return False

def get_user_role(username):
    users = get_all_users()
    if username in users:
        return users[username]["role"]
    return None

def get_user_tab(username):
    users = get_all_users()
    if username in users:
        return users[username]["tab"]
    return None

def create_session(username):
    config = load_config()
    payload = {
        "username": username,
        "role": get_user_role(username),
        "tab": get_user_tab(username),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, config["FLASK_SECRET_KEY"], algorithm="HS256")
    return token

def logout(token):
    return True