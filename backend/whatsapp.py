import requests# for sending https calls to whatsapp api
from config import load_config

def get_template_for_courier(courier_name):#Returns correct template name for that courier
    config = load_config()
    templates = {
        "Anjani": config["META_TEMPLATE_ANJANI"],
        "DTDC": config["META_TEMPLATE_DTDC"],
        "MARUTI": config["META_TEMPLATE_MARUTI"],
        "Others": config["META_TEMPLATE_OTHERS"],
    }
    return templates.get(courier_name, config["META_TEMPLATE_OTHERS"])

def format_phone_number(phone):
    phone = str(phone).strip()# Ensure the phone number is a string and remove any leading/trailing whitespace
    if not phone.startswith("91"):# Add country code if not present
        phone = "91" + phone
    return phone

def validate_phone_number(phone):
    phone = str(phone).strip()
    if len(phone) == 12 and phone.startswith("91"):
        return True
    return False

def send_whatsapp_message(phone, name, tracking_id, tracking_link, courier_name):
    phone = format_phone_number(phone)
    if not validate_phone_number(phone):
        return False, "Invalid phone number"
    config = load_config()
    template_name = get_template_for_courier(courier_name)
    url = f"https://graph.facebook.com/v18.0/{config['META_PHONE_NUMBER_ID']}/messages"
    headers = {
        "Authorization": f"Bearer {config['META_ACCESS_TOKEN']}",
        "Content-Type": "application/json"
    }
    data = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": name},
                        {"type": "text", "text": tracking_id},
                        {"type": "text", "text": tracking_link}
                        
                    ]
                }
            ]
        }
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return True, "Message sent successfully"
    else:
        return False, response.text 