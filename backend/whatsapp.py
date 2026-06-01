import requests
from config import load_config
def get_template_for_courier(courier_name):
    config = load_config()
    templates = {
        "DTDC Couriers": config["META_TEMPLATE_DTDC"],
        "Shree Maruti Couriers": config["META_TEMPLATE_MARUTI"],
        "Shree Anjani Couriers": config["META_TEMPLATE_ANJANI"],
    }
    return templates.get(courier_name, config["META_TEMPLATE_OTHERS"])

def format_phone_number(phone):
    phone = str(phone).strip()
    if not phone.startswith("91"):
        phone = "91" + phone
    return phone

def validate_phone_number(phone):
    phone = str(phone).strip()
    return len(phone) == 12 and phone.startswith("91")

def send_whatsapp_message(phone, name, tracking_id, tracking_link, courier_name):
    phone = format_phone_number(phone)
    if not validate_phone_number(phone):
        return False, "Invalid phone number"
    
    config = load_config()
    is_other = courier_name not in ["Shree Anjani Couriers", "DTDC Couriers", "Shree Maruti Couriers"]
    
    url = f"https://graph.facebook.com/v18.0/{config['META_PHONE_NUMBER_ID']}/messages"
    headers = {
        "Authorization": f"Bearer {config['META_ACCESS_TOKEN']}",
        "Content-Type": "application/json"
    }

    if is_other:
        # Others — 3 variables, no button
        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": name},
                    {"type": "text", "text": tracking_id},
                    {"type": "text", "text": tracking_link}
                ]
            }
        ]
    else:
        # Anjani, DTDC, Maruti — 2 variables + button
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
            "name": get_template_for_courier(courier_name),
            "language": {"code": "en_US"},
            "components": components
        }
    }

    response = requests.post(url, headers=headers, json=data)
    return (True, "Message sent successfully") if response.status_code == 200 else (False, response.text)