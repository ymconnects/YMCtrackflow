import csv
from supabase_db import supabase
from datetime import datetime

def parse_csv(file_path):
    contacts = []
    with open(file_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            phone = row.get("phone") or row.get("Phone") or ""
            name  = row.get("name")  or row.get("Name")  or ""

            phone = phone.strip()
            if not phone:
                continue

            phone = "".join(c for c in phone if c.isdigit())

            extra = {k: v for k, v in row.items()
                     if k.lower() not in ("name", "phone")}

            contacts.append({
                "name": name.strip(),
                "phone": phone,
                "extra_data": extra if extra else {}
            })
    return contacts


def save_contact_book(book_name, contacts_list):
    book_result = supabase.table("contact_books").insert({
        "name": book_name,
        "total": len(contacts_list),
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    book_id = book_result.data[0]["id"]

    rows = [{
        "book_id": book_id,
        "name": c["name"],
        "phone": c["phone"],
        "extra_data": c["extra_data"],
        "created_at": datetime.utcnow().isoformat()
    } for c in contacts_list]

    supabase.table("contacts").insert(rows).execute()
    return book_id
