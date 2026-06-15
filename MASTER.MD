# YMCTRACKFLOW — MASTER DOCUMENT
# Version 9.0 — SYSTEM LIVE + WEBHOOK + STATUS FIX
# Paste this at start of every coding chat

═══════════════════════════════════════════
SECTION 1 — WHAT WE BUILDING
═══════════════════════════════════════════

Name    : YMCTrackFlow
What    : WhatsApp order tracking system
          + bulk campaign messaging
Who     : Small business team — YMC (Yashvant Mangal Classes)
How     : Manager pastes orders in Google Sheet
          System sends WhatsApp auto
          Team controls from dashboard
          Webhook updates real delivery status

═══════════════════════════════════════════
SECTION 2 — TECH WE USE
═══════════════════════════════════════════

Backend  : Python 3.11 + Flask
Frontend : React 18 + Tailwind CSS
Database : Google Sheets
Hosting  : Render (backend, free tier)
           Vercel (frontend, free forever)
WhatsApp : Meta Cloud API (direct)
Editor   : VS Code
Saving   : GitHub

NO MIDDLEMEN:
→ No AiSensy (cancelled)
→ No Pabbly
→ No Zapier
→ Direct Meta API only

═══════════════════════════════════════════
SECTION 3 — LIVE URLS
═══════════════════════════════════════════

Backend  : https://ymctrackflow.onrender.com
Frontend : https://ymctrackflow.vercel.app
GitHub   : https://github.com/ymconnects/YMCtrackflow

LOCAL DEV:
Backend  : cd D:\YMCtrackflow\backend → py -3.11 api.py
Frontend : cd D:\YMCtrackflow\frontend → npm run dev
Backend  : http://localhost:5000
Frontend : http://localhost:5173

═══════════════════════════════════════════
SECTION 4 — LOGIN CREDENTIALS
═══════════════════════════════════════════

admin/admin123
manager1/mgr123
campaign1/camp123
viewer1/view123

═══════════════════════════════════════════
SECTION 5 — SECRET KEYS (.env file)
═══════════════════════════════════════════

META:
META_ACCESS_TOKEN=
META_PHONE_NUMBER_ID=1141358262394241
META_WABA_ID=2813814805677902

TEMPLATES:
META_TEMPLATE_ANJANI=ymc_anjani
META_TEMPLATE_DTDC=ymc_dtdc
META_TEMPLATE_MARUTI=ymc_maruti
META_TEMPLATE_OTHERS=ymc_order_tracking

WEBHOOK:
WEBHOOK_VERIFY_TOKEN=ymctrackflow123

GOOGLE SHEETS:
GOOGLE_SHEET_ID=
GOOGLE_CREDENTIALS_FILE=credentials.json

SHEET TAB NAMES:
SHEET_TAB_1=Shree Anjani Couriers
SHEET_TAB_2=DTDC Couriers
SHEET_TAB_3=Shree Maruti Couriers
SHEET_TAB_4=Others

SYSTEM:
FLASK_PORT=5000
FLASK_SECRET_KEY=

═══════════════════════════════════════════
SECTION 6 — GOOGLE SHEET STRUCTURE
═══════════════════════════════════════════

ONE MASTER FILE — FIVE TABS

TAB 1: Shree Anjani Couriers
TAB 2: DTDC Couriers
TAB 3: Shree Maruti Couriers
TAB 4: Others (extra Courier Name column)
TAB 5: Settings (system_on, auto_message)

COURIER TABS (1-3) COLUMNS:
Col A → Name
Col B → Phone
Col C → Tracking ID
Col D → Tracking Link (auto by Apps Script)
Col E → Message Sent (NO/SENT/DELIVERED/FAILED)
Col F → Last Updated

OTHERS TAB COLUMNS:
Col A → Name
Col B → Phone
Col C → Courier Name ← EXTRA COLUMN
Col D → Tracking ID
Col E → Tracking Link
Col F → Message Sent
Col G → Last Updated

SETTINGS TAB:
Row 2, Col A → system_on (TRUE/FALSE)
Row 2, Col B → auto_message (TRUE/FALSE)

STATUS VALUES (standardised):
NO        → Not sent yet (Pending)
SENT      → Accepted by Meta
DELIVERED → Reached student phone
FAILED    → Failed (wrong number etc)
NOTE: OLD "YES" status replaced with DELIVERED in sheet

═══════════════════════════════════════════
SECTION 7 — WHATSAPP TEMPLATES
═══════════════════════════════════════════

PHONE NUMBER: +91 63500 44328
WABA ID: 2813814805677902

4 TEMPLATES — ALL APPROVED:

ymc_anjani (Utility, en_US):
→ Body: Dear {{1}}, Thank you... Courier: Shree Anjani... Tracking ID: {{2}}... contacts...
→ Button: Track Order → https://shreeanjani.co.in/tracking?awb={{1}}
→ Variables: {{1}}=Name, {{2}}=Tracking ID, Button {{1}}=Tracking ID

ymc_dtdc (Utility, en_US):
→ Body: Dear {{1}}, Thank you... Courier: DTDC... Tracking ID: {{2}}... contacts...
→ Button: Track Order → https://www.dtdc.com/track-your-shipment/?awb={{1}}
→ Variables: {{1}}=Name, {{2}}=Tracking ID, Button {{1}}=Tracking ID

ymc_maruti (Utility, en_US):
→ Body: Dear {{1}}, Thank you... Courier: Shree Maruti... Tracking ID: {{2}}... contacts...
→ Button: Track Order → https://shreemaruti.com/track-shipment/?awb={{1}}
→ Variables: {{1}}=Name, {{2}}=Tracking ID, Button {{1}}=Tracking ID

ymc_order_tracking (Utility, en_US) — FOR OTHERS:
→ Body: Dear {{1}}, Thank you... Courier: {{2}}... Tracking ID: {{3}}... Track: {{4}}... contacts...
→ No button (link in body)
→ Variables: {{1}}=Name, {{2}}=Courier Name, {{3}}=Tracking ID, {{4}}=Tracking Link

SOCIAL LINKS IN ALL TEMPLATES:
YouTube, Instagram, LinkedIn, Telegram CA Final, Telegram CA Inter

DEEP LINK FORMATS (Apps Script auto-generates):
DTDC    : https://www.dtdc.com/track-your-shipment/?awb=TRACKINGID
Anjani  : https://shreeanjani.co.in/tracking?awb=TRACKINGID
Maruti  : https://shreemaruti.com/track-shipment/?awb=TRACKINGID
India Post : https://www.indiapost.gov.in/ (fixed, if courier name = india post)
Others  : No auto link (Apps Script skips unknown couriers)

═══════════════════════════════════════════
SECTION 8 — WEBHOOK SYSTEM
═══════════════════════════════════════════

WEBHOOK URL: https://ymctrackflow.onrender.com/webhook
VERIFY TOKEN: ymctrackflow123 (also in Render env vars)

WHAT WEBHOOK DOES:
1. Delivery status updates:
   Meta sends → sent/delivered/read/failed
   We update Google Sheet accordingly
   Status map: sent→SENT, delivered→DELIVERED, read→DELIVERED, failed→FAILED

2. Auto reply to incoming messages:
   Student messages our number
   We check — did we send them a message in last 24 hours?
   Yes → send fixed reply (free, within 24hr window)
   No → ignore (avoid charges)

AUTO REPLY MESSAGE:
Thank you for contacting Yashvant Mangal Classes.
For any queries contact:
For Dispatch/Courier Related Query : 8955122355
For Activation Related Query : 7425055442
For Software Related Technical Assistance : 7425055442
For Products Purchase Related Query : 8690270442, 9216812400
If books not delivered in 7 days contact : 8955122355
Team Yashvant Mangal Classes

META APP STATUS: Published (Live mode) ✅
META BUSINESS: Verified (May 29, 2026) ✅
OBA STATUS: Pending (apply again after 2 weeks from verification)

═══════════════════════════════════════════
SECTION 9 — HOW SENDING WORKS
═══════════════════════════════════════════

CORRECT ORDER (to avoid status overwrite):

1. System gets pending orders
2. Marks ALL as SENT in one batch FIRST (before sending)
3. Sends messages one by one (0.5s delay between each)
4. If API call itself fails → marks FAILED immediately
5. Webhook fires later → updates DELIVERED or FAILED
6. Webhook always writes last → correct status stays

WHY THIS ORDER MATTERS:
Old problem: System marked YES after sending → overwrote webhook FAILED
New system: SENT written first → webhook fires after → webhook wins

ALL SENDING PATHS FIXED:
→ Run Now (Dashboard) → process_all_tabs → ✅ fixed
→ Run Now (Orders) → process_all_tabs → ✅ fixed
→ Auto scheduler (every 30 min) → process_all_tabs → ✅ fixed
→ Retry Failed → retry_failed_orders → ✅ fixed
→ Per-row Send button → retry_single → ✅ fixed

═══════════════════════════════════════════
SECTION 10 — USER ROLES
═══════════════════════════════════════════

ADMIN → full access, settings, campaigns
MANAGER → orders only, can send/retry, no settings
CAMPAIGNER → campaigns only, no orders
VIEWER → read only, no actions

PAGE          ADMIN    MANAGER   CAMPAIGNER   VIEWER
Dashboard     ALL      ALL       NO           ALL
Orders        ALL      ALL       NO           ALL (RO)
Campaigns     YES      NO        YES          NO
Logs          ALL      ORDERS    CAMPAIGNS    ORDERS (RO)
Settings      YES      NO        NO           NO

═══════════════════════════════════════════
SECTION 11 — ORDERS PAGE FEATURES
═══════════════════════════════════════════

FILTERS:
→ Search by name, order ID, phone
→ Courier filter: All / Anjani / DTDC / Maruti / Others
→ Status filter: All / Pending / Sent / Delivered / Failed
→ Sort: Pending First (default) / Newest First / Oldest First

STATUS DISPLAY:
NO       → Pending (amber)
SENT     → Sent (green)
DELIVERED → Delivered (blue)
FAILED   → Failed (red)

ACTION BUTTONS PER ROW:
→ Send (✉) — shows for NO and SENT orders
→ Retry (↺) — shows for FAILED orders
→ View (👁) — always shows, opens order detail modal

SORT LOGIC (Pending First):
1. FAILED → top
2. NO/Pending → next
3. SENT → next
4. DELIVERED → bottom
Within each group → newest Last Updated first

═══════════════════════════════════════════
SECTION 12 — APPS SCRIPT
═══════════════════════════════════════════

TWO FUNCTIONS:

onEdit(e):
→ Fires when single cell edited
→ Auto-generates tracking link for that row

generateAllLinks():
→ Loops through ALL rows in all 4 tabs
→ Generates links for all at once
→ Use after bulk paste

HOW TO USE AFTER BULK PASTE:
1. Paste all orders in sheet
2. Click YMC Tools menu at top
3. Click Generate All Links
4. All rows get tracking links

═══════════════════════════════════════════
SECTION 13 — KEEP ALIVE
═══════════════════════════════════════════

Internal : Scheduler pings /status every 10 min
External : cron-job.org pings /status every 5 min
(Render free tier sleeps after 15 min inactivity)

═══════════════════════════════════════════
SECTION 14 — BACKUP
═══════════════════════════════════════════

Git backup branch: backup-working-version
→ On GitHub: https://github.com/ymconnects/YMCtrackflow
→ To restore: git checkout backup-working-version

Desktop folder backup also kept locally.

TO RESTORE IF THINGS BREAK:
git checkout backup-working-version
git push origin HEAD --force

═══════════════════════════════════════════
SECTION 15 — FOLDER STRUCTURE
═══════════════════════════════════════════

YMCtrackflow/
├── backend/
│   ├── api.py          ← Flask endpoints + webhook
│   ├── main.py         ← process_all_tabs, retry logic
│   ├── sheets.py       ← Google Sheets read/write + cache
│   ├── whatsapp.py     ← send messages + auto reply
│   ├── scheduler.py    ← auto scheduler + keep alive
│   ├── auth.py         ← login, sessions, roles
│   ├── config.py       ← load env variables
│   ├── logger.py       ← log success/failure
│   ├── requirements.txt
│   ├── .env
│   └── campaigns/
│       ├── campaign_manager.py
│       ├── audience_filter.py
│       ├── bulk_sender.py
│       ├── campaign_scheduler.py
│       └── campaign_logger.py
│
└── frontend/
    └── src/
        ├── App.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Orders.jsx
        │   ├── Campaigns.jsx
        │   └── Settings.jsx
        ├── components/
        │   ├── OrdersTable.jsx
        │   ├── StatusBadge.jsx
        │   ├── StatCard.jsx
        │   ├── Sidebar.jsx
        │   └── ToastContainer.jsx
        ├── hooks/
        │   ├── useOrders.js
        │   └── useStatus.js
        └── utils/
            ├── api.js  ← BASE_URL = https://ymctrackflow.onrender.com
            └── formatters.js

═══════════════════════════════════════════
SECTION 16 — API ENDPOINTS
═══════════════════════════════════════════

POST /login
POST /logout
GET  /me
GET  /status
GET  /orders
POST /run-now
POST /retry-failed
POST /retry-single
POST /toggle-auto-message
POST /toggle-system
GET  /auto-message-status
POST /sync
GET  /logs
GET  /webhook  ← Meta verification
POST /webhook  ← Meta delivery updates + incoming messages
GET  /campaigns
POST /campaigns/create
GET  /campaigns/<id>/status
POST /campaigns/<id>/send
POST /campaigns/<id>/cancel
GET  /campaigns/<id>/report
POST /audience/estimate

═══════════════════════════════════════════
SECTION 17 — KEY LEARNINGS
═══════════════════════════════════════════

1. WEBHOOK TIMING IS CRITICAL
   Always write SENT before sending messages
   Webhook fires after → webhook wins → correct status

2. GOOGLE SHEETS RATE LIMITS
   Use batch updates not individual writes
   Cache orders in memory (10 min TTL)

3. SAME PHONE NUMBER IN MULTIPLE ROWS
   Webhook matches by phone → updates first match only
   Fix planned: Message ID (wamid) column — deferred
   Tracking ID is unique — can use as alternative key

4. DATE FORMAT IN SHEET
   Times like 5:52:36 (single digit hour) break JS Date parsing
   Fix: pad with leading zero → 05:52:36

5. FLASK SCHEDULER
   use_reloader=False to prevent double execution

6. REACT COMPONENT SCOPE
   Define sub-components outside parent function
   Else causes input focus loss

7. OTHERS TAB
   Has extra Courier Name column (Col C)
   All column indices shift by 1
   sheets.py _get_status_columns() handles this

8. TEMPLATE LANGUAGE CODE
   Must be en_US not en

9. CREDENTIALS SECURITY
   Never commit .env to GitHub
   GitHub scanner auto-revokes exposed Google keys

═══════════════════════════════════════════
SECTION 18 — COSTS
═══════════════════════════════════════════

Per tracking message : ₹0.125
Per campaign message : ₹0.88
Auto reply (24hr)    : FREE (within window)
Auto reply (after)   : ₹0.125
AiSensy saving       : ₹999/month
Yearly saving        : ₹11,988

═══════════════════════════════════════════
SECTION 19 — PENDING TASKS
═══════════════════════════════════════════

HIGH PRIORITY:
→ ymc_anjani, ymc_dtdc, ymc_maruti templates
  approval pending from Meta

MEDIUM PRIORITY:
→ Message ID (wamid) column in sheet
  Fixes same-phone-number webhook issue
  Add Col G (courier tabs) / Col H (Others)
  Save wamid when sending, match by wamid in webhook

→ Template management UI in dashboard
  So manager doesn't need to visit WhatsApp Manager

FUTURE / PHASE 8:
→ Campaign major update
→ Supabase database (replace Google Sheets)
→ User management UI
→ Two-step verification for WhatsApp number
  (needs boss personal Facebook account email verified first)
→ OBA (Official Business Account) — recheck after mid-June 2026

═══════════════════════════════════════════
SECTION 20 — RULES FOR EVERY CHAT
═══════════════════════════════════════════

→ Cave man mode: short, direct, one step at a time
→ py -3.11 for all Python commands
→ Compile test before every push: py -3.11 -m py_compile <file>
→ Push to GitHub after every file change
→ Git push: git push origin HEAD
→ Fix conflicts: git pull origin main --no-edit → git commit --no-edit
→ Fix functional issues before polish
→ Confirm at each step before moving on
→ Test locally before pushing when possible
→ Always backup before big changes: git branch backup-working-version

═══════════════════════════════════════════
STATUS   : LIVE ✅ WEBHOOK WORKING ✅
VERSION  : 9.0
REPO     : github.com/ymconnects/YMCtrackflow
RULE     : Push to GitHub after every file
🦴
═══════════════════════════════════════════