import csv
from supabase_db import supabase
from datetime import datetime

def parse_csv(file_path):
    contacts = []
    with open(file_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # flexible name detection: exact → common aliases → any col containing "name"
            name = (
                row.get("name") or row.get("Name") or
                row.get("Billing Name") or row.get("Customer Name") or
                row.get("Full Name") or row.get("Contact Name") or
                next((v for k, v in row.items() if k.strip() and "name" in k.lower()), "")
            ) or ""

            # flexible phone detection: exact → common aliases → any col containing "phone"/"mobile"
            phone = (
                row.get("phone") or row.get("Phone") or
                row.get("Billing Phone") or row.get("Mobile") or
                row.get("mobile") or row.get("Phone Number") or
                row.get("Mobile Number") or
                next((v for k, v in row.items()
                      if k.strip() and ("phone" in k.lower() or "mobile" in k.lower())), "")
            ) or ""

            phone = phone.strip()
            if not phone:
                continue
            phone = "".join(c for c in phone if c.isdigit())
            if not phone:
                continue

            # extra_data: skip name-like cols, phone-like cols, and empty keys (trailing commas)
            name_keys  = {k for k in row if k.strip() and "name"   in k.lower()}
            phone_keys = {k for k in row if k.strip() and ("phone" in k.lower() or "mobile" in k.lower())}
            skip_keys  = name_keys | phone_keys | {""}
            extra = {k: v for k, v in row.items() if k not in skip_keys}

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
