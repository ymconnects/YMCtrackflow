# tracking_links.py
# Generates the courier deep link for an order - replicates the old
# Google Apps Script logic. Used both for the one-time Supabase backfill
# and for order creation going forward (paste-to-dashboard UI).

from supabase_db import supabase


def generate_tracking_link(courier, tracking_id, courier_name=None):
    tracking_id = (tracking_id or "").strip()
    if not tracking_id:
        return ""

    courier = (courier or "").strip().lower()

    if courier == "dtdc":
        return f"https://www.dtdc.com/track-your-shipment/?awb={tracking_id}"
    if courier == "maruti":
        return f"https://shreemaruti.com/track-shipment/?awb={tracking_id}"
    if courier == "anjani":
        return f"https://shreeanjani.co.in/tracking?awb={tracking_id}"
    if courier == "others" and (courier_name or "").strip().lower() == "india post":
        return "https://www.indiapost.gov.in/"

    return ""


def backfill_tracking_links():
    rows = supabase.table("orders").select("id,courier,courier_name,tracking_id,tracking_link").execute().data

    updated = 0
    unchanged = 0

    for row in rows:
        correct_link = generate_tracking_link(row.get("courier"), row.get("tracking_id"), row.get("courier_name"))
        current_link = row.get("tracking_link") or ""

        if correct_link != current_link:
            supabase.table("orders").update({"tracking_link": correct_link or None}).eq("id", row["id"]).execute()
            updated += 1
        else:
            unchanged += 1

    return {"updated": updated, "unchanged": unchanged, "total": len(rows)}
