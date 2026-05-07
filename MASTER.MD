# YMCTRACKFLOW — MASTER DOCUMENT
# Version 3.0 — FINAL CLEAN VERSION
# Paste this at start of every coding chat

═══════════════════════════════════════════
SECTION 1 — WHAT WE BUILDING
═══════════════════════════════════════════

Name    : YMCTrackFlow
What    : WhatsApp order tracking system
          + bulk campaign messaging
Who     : Small business team uses it
How     : Paste orders in Google Sheet
          System sends WhatsApp auto
          Team controls from dashboard

═══════════════════════════════════════════
SECTION 2 — TECH WE USE
═══════════════════════════════════════════

Backend  : Python 3.11 + Flask
Frontend : React 18 + Tailwind CSS
Database : Google Sheets
Hosting  : Render (free)
WhatsApp : Meta Cloud API (direct)
Editor   : VS Code
Saving   : GitHub

NO MIDDLEMEN:
→ No AiSensy
→ No Pabbly
→ No Zapier
→ Direct Meta API only
→ No Claude API in project

═══════════════════════════════════════════
SECTION 3 — WHAT USER ALREADY HAS
═══════════════════════════════════════════
→ AiSensy account (cancel after build)
→ GitHub account (ready)
→ VS Code (installed)
→ Render account (free)

STILL NEED:
→ Meta Business account (Dought full still needs to check)
→ WhatsApp number (will own it)
→ Meta credentials (get when needed)
→ Google service account JSON
→ Approved templates per courier

═══════════════════════════════════════════
SECTION 4 — SECRET KEYS (.env file)
═══════════════════════════════════════════

META:
META_ACCESS_TOKEN=
META_PHONE_NUMBER_ID=
META_WABA_ID=

TEMPLATES ONE PER COURIER:
META_TEMPLATE_ANJANI=anjani_shipping
META_TEMPLATE_DTDC=dtdc_shipping
META_TEMPLATE_DELHIVERY=delhivery_shipping
META_TEMPLATE_OTHERS=general_shipping

GOOGLE SHEETS:
GOOGLE_SHEET_ID=
GOOGLE_CREDENTIALS_FILE=credentials.json

SHEET TAB NAMES:
SHEET_TAB_1=Anjani
SHEET_TAB_2=DTDC
SHEET_TAB_3=Delhivery
SHEET_TAB_4=Others

SYSTEM:
CHECK_INTERVAL_MINUTES=10
RETRY_INTERVAL_HOURS=2
BATCH_SIZE=80
FLASK_PORT=5000
FLASK_SECRET_KEY=

═══════════════════════════════════════════
SECTION 5 — GOOGLE SHEET STRUCTURE
═══════════════════════════════════════════

ONE MASTER FILE
FOUR TABS INSIDE

ALL TABS SAME COLUMNS:
Col A → Customer Name
Col B → Phone (91XXXXXXXXXX)
Col C → Status
Col D → Tracking Link
Col E → Message Sent (YES/NO/FAILED)
Col F → Last Updated

TAB 1 → Anjani
TAB 2 → DTDC
TAB 3 → Delhivery
TAB 4 → Others

CONTACTS SHEET (for campaigns):
Col A → Phone (91XXXXXXXXXX)
Col B → Last Order Date
Col C → City
Col D → Tags
Col E → Opted In (YES/NO)
COL F → 

CAMPAIGNS SHEET (log):
Col A → Campaign ID
Col B → Campaign Name
Col C → Template Used
Col D → Audience Count
Col E → Sent Count
Col F → Failed Count
Col G → Status
Col H → Created At
Col I → Sent At

═══════════════════════════════════════════
SECTION 6 — WHATSAPP TEMPLATES
═══════════════════════════════════════════

ONE TEMPLATE PER COURIER
ALL PRE APPROVED ON META

ANJANI (anjani_shipping):
"Hello {{name}}, your order {{order_id}}
shipped via Anjani Courier.
Track here: {{tracking_link}} 🚚
Thank you for shopping with us!"

DTDC (dtdc_shipping):
"Hello {{name}}, your order {{order_id}}
shipped via DTDC.
Track here: {{tracking_link}} 🚚
Thank you for shopping with us!"

DELHIVERY (delhivery_shipping):
"Hello {{name}}, your order {{order_id}}
shipped via Delhivery.
Track here: {{tracking_link}} 🚚
Thank you for shopping with us!"

OTHERS (general_shipping):
"Hello {{name}}, your order {{order_id}}
has been shipped.
Track here: {{tracking_link}} 🚚
Thank you for shopping with us!"

VARIABLES SAME FOR ALL:
{{name}}          → Col B
{{order_id}}      → Col A
{{tracking_link}} → Col E

CAMPAIGN TEMPLATES:
→ Created per campaign
→ Marketing category
→ Submit to Meta separately

═══════════════════════════════════════════
SECTION 7 — FOLDER STRUCTURE
═══════════════════════════════════════════

trackflow/
│
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── sheets.py
│   ├── whatsapp.py
│   ├── scheduler.py
│   ├── logger.py
│   ├── api.py
│   ├── campaigns/
│   │   ├── campaign_manager.py
│   │   ├── audience_filter.py
│   │   ├── bulk_sender.py
│   │   ├── campaign_scheduler.py
│   │   └── campaign_logger.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Campaigns.jsx
│   │   │   ├── CampaignCreate.jsx
│   │   │   ├── CampaignReport.jsx
│   │   │   ├── Templates.jsx
│   │   │   ├── Logs.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TopBar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── OrdersTable.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── LogsTable.jsx
│   │   │   ├── CampaignCard.jsx
│   │   │   ├── AudienceFilter.jsx
│   │   │   ├── CostEstimator.jsx
│   │   │   └── Toast.jsx
│   │   ├── hooks/
│   │   │   ├── useOrders.js
│   │   │   ├── useLogs.js
│   │   │   ├── useStatus.js
│   │   │   └── useCampaigns.js
│   │   └── utils/
│   │       ├── api.js
│   │       └── formatters.js
│   └── package.json
│
└── README.md

═══════════════════════════════════════════
SECTION 8 — ALL FUNCTIONS
═══════════════════════════════════════════

── config.py ──
load_config()
validate_config()

── sheets.py ──
connect_google_sheets()
read_all_tabs()
get_pending_orders_from_tab(tab_name)
get_all_pending_orders()
mark_as_sent(tab_name, row_number)
mark_as_failed(tab_name, row_number)
get_failed_orders()
get_all_contacts()

── whatsapp.py ──
send_whatsapp_message(phone, order_id,
  name, tracking_link, courier_name)
get_template_for_courier(courier_name)
format_phone_number(phone)
validate_phone_number(phone)
send_template_message(phone,
  template_name, variables)

── scheduler.py ──
start_scheduler()
stop_scheduler()
keep_alive()

── logger.py ──
log_success(order_id, phone,
  name, courier)
log_failure(order_id, phone,
  name, courier, error)
log_system_start()
log_summary()

── main.py ──
process_all_tabs()
process_single_tab(tab_name)
should_send_message(order)
retry_failed_orders()
notify_admin_on_failure(error)
notify_daily_summary()

── campaigns/campaign_manager.py ──
create_campaign(name, template,
  audience)
get_all_campaigns()
get_campaign_status(campaign_id)
update_campaign_status(campaign_id,
  status)
delete_campaign(campaign_id)

── campaigns/audience_filter.py ──
get_all_customers()
filter_by_date_range(start, end)
filter_by_status(status)
filter_by_city(city)
filter_by_tags(tags)
filter_opted_in_only()
estimate_audience_count(filters)

── campaigns/bulk_sender.py ──
send_campaign(campaign_id)
send_batch(contacts, template,
  variables)
send_bulk_parallel(contacts, template)
track_progress(campaign_id)
calculate_cost(audience_count,
  template_type)

── campaigns/campaign_scheduler.py ──
schedule_campaign(campaign_id,
  datetime)
cancel_scheduled_campaign(campaign_id)
get_scheduled_campaigns()
run_scheduled_campaigns()

── campaigns/campaign_logger.py ──
log_campaign_start(campaign_id)
log_campaign_result(campaign_id,
  sent, failed)
log_campaign_complete(campaign_id)

── api.py ──
POST /run-now
GET  /status
GET  /orders
GET  /logs
POST /retry-failed
POST /toggle-system
POST /update-settings
GET  /campaigns
POST /campaigns/create
GET  /campaigns/:id/status
POST /campaigns/:id/send
POST /campaigns/:id/cancel
GET  /campaigns/:id/report
GET  /audience/estimate

═══════════════════════════════════════════
SECTION 9 — DASHBOARD PAGES
═══════════════════════════════════════════

Dashboard.jsx
→ System on/off status
→ Stats: orders, sent, pending, failed
→ Recent orders table
→ 7 day chart
→ Run Now button

Orders.jsx
→ All orders from all tabs
→ Search by name or order ID
→ Filter by status or courier
→ Send Now per row
→ Pagination

Campaigns.jsx
→ Active campaigns
→ Past campaigns
→ New Campaign button

CampaignCreate.jsx
→ Campaign name
→ Template picker
→ Audience filter
→ Message preview
→ Cost estimator
→ Send now or schedule

CampaignReport.jsx
→ Sent/Delivered/Read/Failed
→ Delivery rate
→ Per contact table

Templates.jsx
→ All 4 courier templates shown
→ Each with WhatsApp preview
→ Approval status shown

Logs.jsx
→ Every message sent
→ Filter by status
→ Export button

Settings.jsx
→ Meta credentials (masked)
→ Google Sheet config
→ Courier tab names
→ Template names per courier
→ Check interval
→ System on/off toggle

═══════════════════════════════════════════
SECTION 10 — META API
═══════════════════════════════════════════

Base URL:
https://graph.facebook.com/v18.0/

Endpoint:
POST /{phone_number_id}/messages

Rate limit      : 80 messages/second
Batch size      : 80
Method          : Parallel for bulk

Costs:
Tracking msg    : ₹0.125 each
Campaign msg    : ₹0.88 each

═══════════════════════════════════════════
SECTION 11 — HOSTING
═══════════════════════════════════════════

Platform        : Railway (railway.app)
Services        : trackflow-backend
                  trackflow-frontend
Keep alive      : UptimeRobot (free)

Other project   : Student Extractor
Platform        : Render (separate)
DO NOT MIX      : Two projects apart

═══════════════════════════════════════════
SECTION 12 — BUILD PROGRESS
═══════════════════════════════════════════

PHASE 1 — BACKEND CORE
[ ] config.py
[ ] sheets.py
[ ] whatsapp.py
[ ] main.py
[ ] TEST: one real message sends ✅

PHASE 2 — RELIABILITY
[ ] scheduler.py
[ ] logger.py
[ ] retry logic in main.py
[ ] keep_alive()
[ ] TEST: runs 24/7 no errors ✅

PHASE 3 — FLASK API
[ ] api.py all endpoints
[ ] TEST: all endpoints work ✅

PHASE 4 — CAMPAIGNS
[ ] campaign_manager.py
[ ] audience_filter.py
[ ] bulk_sender.py
[ ] campaign_scheduler.py
[ ] campaign_logger.py
[ ] TEST: bulk send works ✅

PHASE 5 — REACT FRONTEND
[ ] Project setup + routing
[ ] Sidebar.jsx + TopBar.jsx
[ ] Dashboard.jsx
[ ] Orders.jsx
[ ] Campaigns.jsx
[ ] CampaignCreate.jsx
[ ] CampaignReport.jsx
[ ] Templates.jsx
[ ] Logs.jsx
[ ] Settings.jsx
[ ] All hooks
[ ] api.js connected to Flask
[ ] TEST: real data shows ✅

PHASE 6 — DEPLOY
[ ] Push all to GitHub
[ ] Deploy backend Railway
[ ] Deploy frontend Railway
[ ] Set env variables
[ ] Full live test
[ ] Cancel AiSensy ✅

═══════════════════════════════════════════
SECTION 13 — COSTS
═══════════════════════════════════════════

Monthly         : ₹0
Per track msg   : ₹0.125
Per campaign msg: ₹0.88
AiSensy saving  : ₹999/month
Yearly saving   : ₹11,988

═══════════════════════════════════════════
SECTION 14 — HOW TO USE THIS DOC
═══════════════════════════════════════════

EVERY NEW CHAT:
→ Paste this full document
→ Say which phase
→ Say which file
→ Say "teach me" not "write me"
→ Learn while building

AFTER EACH FILE:
→ Tick checkbox above
→ Push to GitHub
→ Update this doc

GITHUB FILE:
→ MASTER.md in repo root
→ Always keep updated
→ This is your save file

LEARNING RULES:
→ Type code yourself
→ Never just copy paste
→ Ask why for everything
→ Understand before moving on

═══════════════════════════════════════════
STATUS   : PLANNING DONE ✅
NEXT     : New chat → config.py
RULE     : Push to GitHub after every file
🦴
═══════════════════════════════════════════
