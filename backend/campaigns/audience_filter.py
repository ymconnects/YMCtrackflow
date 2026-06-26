import csv
from supabase_db import supabase
from datetime import datetime

def parse_csv(file_path):
    contacts = []
    with open(file_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        # drop empty/trailing-comma ghost headers
        headers = [h for h in (reader.fieldnames or []) if h.strip()]

        # name: contains "name" but exclude "username" / "user name" / "file" false matches
        name_col = next(
            (h for h in headers
             if "name" in h.lower()
             and "username" not in h.lower()
             and "user name" not in h.lower()
             and "file" not in h.lower()),
            None
        )

        # phone priority 1: contains "phone" or "mobile"
        phone_col = next(
            (h for h in headers if "phone" in h.lower() or "mobile" in h.lower()),
            None
        )
        # phone priority 2: fallback — "contact number" or "whatsapp" (avoids bare "number")
        if not phone_col:
            phone_col = next(
                (h for h in headers
                 if "contact number" in h.lower() or "whatsapp" in h.lower()),
                None
            )

        if not name_col or not phone_col:
            missing = []
            if not name_col:  missing.append("name")
            if not phone_col: missing.append("phone/mobile")
            raise ValueError(f"Could not find {' and '.join(missing)} column in CSV")

        for row in reader:
            # skip fully empty rows
            if not any((v or "").strip() for v in row.values()):
                continue

            name  = (row.get(name_col)  or "").strip()
            phone = (row.get(phone_col) or "").strip()

            if not phone:
                continue
            phone = "".join(c for c in phone if c.isdigit())
            if not phone:
                continue

            # extra_data: all other non-empty headers, values trimmed
            extra = {
                k: (v or "").strip()
                for k, v in row.items()
                if k and k.strip() and k not in (name_col, phone_col)
            }

            contacts.append({
                "name": name,
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
