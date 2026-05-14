import requests
from config import load_config
from whatsapp import format_phone_number, validate_phone_number
from concurrent.futures import ThreadPoolExecutor # For concurrent sending
import time

def send_template_message(phone, template_name, variables):
    config = load_config()
    
    phone = format_phone_number(phone)
    if not validate_phone_number(phone):
        return False, "Invalid phone"
    
    url = f"https://graph.facebook.com/v18.0/{config['META_PHONE_NUMBER_ID']}/messages"
    headers = {
        "Authorization": f"Bearer {config['META_ACCESS_TOKEN']}",
        "Content-Type": "application/json"
    }
    
    parameters = [{"type": "text", "text": v} for v in variables]
    
    data = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": [{"type": "body", "parameters": parameters}]
        }
    }
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return True, "Sent"
    return False, response.text

def send_batch(contacts, template, variables_per_contact):
    results = []
    for index, contact in enumerate(contacts):
        variables = variables_per_contact[index]
        success, message = send_template_message(
            contact["Phone"],
            template,
            variables
        )
        results.append({
            "phone": contact["Phone"],
            "success": success,
            "message": message
        })
        time.sleep(0.5)
    return results

def send_bulk_parallel(contacts, template, variables_per_contact):
    results = []
    
    def send_one(index):
        contact = contacts[index]
        variables = variables_per_contact[index]
        success, message = send_template_message(
            contact["Phone"],
            template,
            variables
        )
        return {
            "phone": contact["Phone"],
            "success": success,
            "message": message
        }
    
    with ThreadPoolExecutor(max_workers=80) as executor:
        results = list(executor.map(send_one, range(len(contacts))))
    
    return results

def calculate_cost(audience_count, template_type):
    if template_type == "tracking":
        cost_per_msg = 0.125
    else:
        cost_per_msg = 0.88
    
    total = audience_count * cost_per_msg
    return round(total, 2)

def track_progress(campaign_id):
    from campaigns.campaign_manager import get_campaign_status
    
    campaign = get_campaign_status(campaign_id)
    if not campaign:
        return None
    
    total = campaign.get("Audience Count", 0)
    sent = campaign.get("Sent Count", 0)
    failed = campaign.get("Failed Count", 0)
    
    progress = {
        "campaign_id": campaign_id,
        "total": total,
        "sent": sent,
        "failed": failed,
        "pending": total - sent - failed,
        "percentage": round((sent + failed) / total * 100, 2) if total > 0 else 0
    }
    return progress

def send_campaign(campaign_id):
    from campaigns.campaign_manager import get_campaign_status, update_campaign_status
    from campaigns.audience_filter import get_all_customers
    
    campaign = get_campaign_status(campaign_id)
    if not campaign:
        return False, "Campaign not found"
    
    update_campaign_status(campaign_id, "RUNNING")
    
    contacts = get_all_customers()
    template = campaign["Template Used"]
    
    variables_per_contact = []
    for contact in contacts:
        variables_per_contact.append([
            contact.get("Name", "Customer")
        ])
    
    results = send_bulk_parallel(contacts, template, variables_per_contact)
    
    sent_count = sum(1 for r in results if r["success"])
    failed_count = sum(1 for r in results if not r["success"])
    
    update_campaign_status(campaign_id, "SENT")
    
    return True, {
        "sent": sent_count,
        "failed": failed_count,
        "total": len(results)
    }
