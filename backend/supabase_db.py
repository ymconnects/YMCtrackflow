import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

PAGE_SIZE = 1000

def select_all(table, columns="*", filters=None, order_by="id", desc=False):
    """Read every matching row, one page at a time.

    PostgREST caps a single response at db-max-rows (1000 on hosted Supabase)
    and returns the truncated page without any error, so a plain
    .select(...).execute() silently drops everything past row 1000. We page
    with .range() and advance by however many rows actually came back, so this
    stays correct whatever the server-side cap is.
    """
    rows = []
    offset = 0
    while True:
        query = supabase.table(table).select(columns)
        for column, value in (filters or {}).items():
            query = query.eq(column, value)
        if order_by:
            query = query.order(order_by, desc=desc)
        page = query.range(offset, offset + PAGE_SIZE - 1).execute().data
        if not page:
            break
        rows.extend(page)
        offset += len(page)
    return rows

def ping():
    try:
        supabase.table("orders").select("id").limit(1).execute()
        return "OK"
    except Exception as e:
        return f"ERROR: {e}"
