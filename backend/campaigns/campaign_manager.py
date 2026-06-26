from supabase_db import supabase
from datetime import datetime

def create_campaign(name, template_name, book_id):
    result = supabase.table("campaigns").insert({
        "name": name,
        "template_name": template_name,
        "book_id": book_id,
        "status": "DRAFT",
        "total": 0,
        "sent": 0,
        "failed": 0,
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    return result.data[0]["id"]

def get_campaign(campaign_id):
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
    return result.data

def update_campaign_status(campaign_id, status, sent=0, failed=0):
    supabase.table("campaigns").update({
        "status": status,
        "sent": sent,
        "failed": failed
    }).eq("id", campaign_id).execute()

def get_contact_book(book_id):
    result = supabase.table("contact_books").select("*").eq("id", book_id).single().execute()
    return result.data

def get_contacts_by_book(book_id):
    result = supabase.table("contacts").select("*").eq("book_id", book_id).execute()
    return result.data
