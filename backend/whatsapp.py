import requests
from config import load_config

BACKEND_BASE_URL = "https://ymctrackflow.onrender.com"

# Campaign templates with an IMAGE header - WhatsApp rejects the send (error
# 132012) unless a header image parameter is supplied on every message, so we
# keep our own durable copy (backend/campaigns/assets/) instead of relying on
# Meta's example-image CDN link, which expires.
TEMPLATE_HEADER_IMAGES = {
    "_cacma_final_idt_fasttrack_batch_renu_didi": "cacma_idt_fasttrack_renu.png",
}

# WhatsApp Cloud API error codes we see in practice, mapped to a readable reason.
ERROR_CODE_MEANINGS = {
    "131026": "Number not on WhatsApp",
    "131047": "Re-engagement required (24hr window expired)",
    "131009": "Invalid template parameter",
    "132000": "Template parameter count mismatch",
    "132001": "Template does not exist or is not approved",
    "132012": "Template parameter format mismatch (e.g. missing required header image)",
    "130472": "Blocked by Meta's marketing message experiment (no retry will help)",
    "131021": "Recipient and sender are the same number",
    "131052": "Media could not be downloaded",
    "133010": "Business account not registered for Cloud API",
    "190": "Access token invalid or expired",
    "100": "Invalid request parameter",
}

def get_error_reason(error_code):
    if not error_code:
        return ""
    return ERROR_CODE_MEANINGS.get(str(error_code), f"Unknown error (code {error_code})")

def format_phone_number(phone):
    phone = str(phone).strip()
    phone = phone.replace("+", "").replace(" ", "")
    if len(phone) == 10:
        phone = "91" + phone
    return phone

def validate_phone_number(phone):
    phone = str(phone).strip()
    return len(phone) == 12 and phone.startswith("91")

def get_order_template_name(courier):
    config = load_config()
    templates = {
        "anjani": config["META_TEMPLATE_ANJANI"],
        "dtdc": config["META_TEMPLATE_DTDC"],
        "maruti": config["META_TEMPLATE_MARUTI"],
    }
    return templates.get(courier, config["META_TEMPLATE_OTHERS"])

def send_order_template_message(phone, courier, courier_name, name, tracking_id, tracking_link):
    phone = format_phone_number(phone)
    if not validate_phone_number(phone):
        return False, "Invalid phone number"
    config = load_config()
    is_other = courier == "others"
    url = f"https://graph.facebook.com/v18.0/{config['META_PHONE_NUMBER_ID']}/messages"
    headers = {
        "Authorization": f"Bearer {config['META_ACCESS_TOKEN']}",
        "Content-Type": "application/json"
    }
    if is_other:
        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": name},
                    {"type": "text", "text": courier_name},
                    {"type": "text", "text": tracking_id},
                    {"type": "text", "text": tracking_link}
                ]
            }
        ]
    else:
        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": name},
                    {"type": "text", "text": tracking_id}
                ]
            },
            {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                    {"type": "text", "text": tracking_id}
                ]
            }
        ]
    data = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": get_order_template_name(courier),
            "language": {"code": "en_US"},
            "components": components
        }
    }
    response = requests.post(url, headers=headers, json=data)
    print(f"Order send: {phone} | {response.status_code}", flush=True)
    if response.status_code == 200:
        try:
            wamid = response.json()["messages"][0]["id"]
        except Exception:
            wamid = "unknown"
        return True, wamid
    try:
        error_code = str(response.json().get("error", {}).get("code", response.status_code))
    except Exception:
        error_code = str(response.status_code)
    return False, error_code

def send_fixed_reply(phone):
    config = load_config()
    url = f"https://graph.facebook.com/v18.0/{config['META_PHONE_NUMBER_ID']}/messages"
    headers = {
        "Authorization": f"Bearer {config['META_ACCESS_TOKEN']}",
        "Content-Type": "application/json"
    }
    data = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {
            "body": "Thank you for contacting Yashvant Mangal Classes.\n\nFor any queries, please contact us:\n\nFor Dispatch/Courier Related Query : 8955122355\nFor Activation Related Query : 7425055442\nFor Lectures Link Related Query : 7073699442\nFor Software Related Technical Assistance : 7425055442\nFor Products Purchase Related Query : 8690270442 , 9216812400\nIf your books are not delivered within 7 working days, please contact : 8955122355\n\nTeam Yashvant Mangal Classes"
        }
    }
    response = requests.post(url, headers=headers, json=data)
    print(f"Auto reply sent to {phone}: {response.status_code}", flush=True)
    return response.status_code == 200

def get_all_templates():
    config = load_config()
    headers = {
        "Authorization": f"Bearer {config['META_ACCESS_TOKEN']}"
    }
    params = {
        "fields": "name,status,category,language,components",
        "limit": 100
    }
    all_templates = []
    url = f"https://graph.facebook.com/v18.0/{config['META_WABA_ID']}/message_templates"
    while url:
        response = requests.get(url, headers=headers, params=params)
        print(f"Get templates: {response.status_code}", flush=True)
        if response.status_code != 200:
            return False, response.text
        full = response.json()
        all_templates.extend(full.get("data", []))
        next_url = full.get("paging", {}).get("next")
        url = next_url
        params = {}
    return True, all_templates


def delete_template(name):
    config = load_config()
    url = f"https://graph.facebook.com/v18.0/{config['META_WABA_ID']}/message_templates"
    headers = {
        "Authorization": f"Bearer {config['META_ACCESS_TOKEN']}"
    }
    params = {"name": name}
    response = requests.delete(url, headers=headers, params=params)
    print(f"Delete template {name}: {response.status_code}", flush=True)
    return response.status_code == 200, response.text


def create_template(payload):
    config = load_config()
    url = f"https://graph.facebook.com/v18.0/{config['META_WABA_ID']}/message_templates"
    headers = {
        "Authorization": f"Bearer {config['META_ACCESS_TOKEN']}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, headers=headers, json=payload)
    print(f"Create template: {response.status_code} | {response.text}", flush=True)
    if response.status_code == 200:
        return True, response.json()
    return False, response.text


def send_template_message(phone, template_name, variables):
    phone = format_phone_number(phone)
    if not validate_phone_number(phone):
        return False, "Invalid phone"
    config = load_config()
    url = f"https://graph.facebook.com/v18.0/{config['META_PHONE_NUMBER_ID']}/messages"
    headers = {
        "Authorization": f"Bearer {config['META_ACCESS_TOKEN']}",
        "Content-Type": "application/json"
    }
    components = []
    header_image = TEMPLATE_HEADER_IMAGES.get(template_name)
    if header_image:
        components.append({
            "type": "header",
            "parameters": [{
                "type": "image",
                "image": {"link": f"{BACKEND_BASE_URL}/campaign-assets/{header_image}"}
            }]
        })
    if variables:
        components.append({
            "type": "body",
            "parameters": [{"type": "text", "text": str(v)} for v in variables]
        })
    data = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en_US"},
            "components": components
        }
    }
    response = requests.post(url, headers=headers, json=data)
    print(f"Campaign send: {phone} | {response.status_code}", flush=True)
    if response.status_code == 200:
        try:
            wamid = response.json()["messages"][0]["id"]
        except Exception:
            wamid = "unknown"
        return True, wamid
    try:
        error_code = str(response.json().get("error", {}).get("code", response.status_code))
    except Exception:
        error_code = str(response.status_code)
    return False, error_code