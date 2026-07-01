# YMCTRACKFLOW — MASTER DOCUMENT
# Version 11.0 — CAMPAIGN SYSTEM LIVE
# Paste this + CONTEXT.md at start of every coding chat
═══════════════════════════════════════════
SECTION 1 — WHAT WE BUILDING
═══════════════════════════════════════════
Name    : YMCTrackFlow
What    : WhatsApp order tracking system
          + bulk campaign messaging
Who     : YMC (Yashvant Mangal Classes)
How     : Manager pastes orders → system sends WhatsApp auto
          Team controls from dashboard
          Webhook updates real delivery status
          Campaigns send bulk messages to students
═══════════════════════════════════════════
SECTION 2 — TECH WE USE
═══════════════════════════════════════════
Backend  : Python 3.11 + Flask
Frontend : React 18 + Tailwind / inline styles
Database : Supabase Mumbai (PRIMARY) + Google Sheets (tracking only, migrating)
Hosting  : Render (backend, free tier 512MB)
           Vercel (frontend, free)
WhatsApp : Meta Cloud API (direct, no middleman)
Editor   : VS Code
Saving   : GitHub
TWO-TOOL WORKFLOW:
→ claude.ai chat (Opus)  = ARCHITECT — plan, design, decide, write briefs
→ Claude Code (Sonnet)   = BUILDER  — read files, write code, test, push
Rule: plan here → paste brief into Claude Code → it builds step by step
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
admin/admin123        → full access
manager1/mgr123       → orders only
campaign1/camp123     → campaigns + templates only
viewer1/view123       → read only
═══════════════════════════════════════════
SECTION 5 — SECRET KEYS (.env)
═══════════════════════════════════════════
META:
META_ACCESS_TOKEN=
META_PHONE_NUMBER_ID=1569335317942266   ← phone number ID (for SENDING)
META_WABA_ID=2813814805677902           ← WABA ID (for TEMPLATES) - DIFFERENT!
TEMPLATES:
META_TEMPLATE_ANJANI=ymc_anjani
META_TEMPLATE_DTDC=ymc_dtdc
META_TEMPLATE_MARUTI=ymc_maruti
META_TEMPLATE_OTHERS=ymc_order_tracking
WEBHOOK:
WEBHOOK_VERIFY_TOKEN=ymctrackflow123
GOOGLE SHEETS (tracking only — migrating):
GOOGLE_SHEET_ID=
GOOGLE_CREDENTIALS_FILE=credentials.json
SUPABASE:
SUPABASE_URL=https://hfrjtjujnjozvyfzwjty.supabase.co
SUPABASE_KEY=  ← service_role key (secret)
SYSTEM:
FLASK_PORT=5000
FLASK_SECRET_KEY=
CRITICAL: META_WABA_ID ≠ META_PHONE_NUMBER_ID
Sending uses PHONE_NUMBER_ID. Templates use WABA_ID. Mixing them = wrong
templates load. (This bug already cost us once — fixed June 2026.)
═══════════════════════════════════════════
SECTION 6 — GOOGLE SHEET STRUCTURE (CURRENT — MIGRATING)
═══════════════════════════════════════════
ONE MASTER FILE — FIVE TABS
COURIER TABS (Anjani / DTDC / Maruti):
A=Name  B=Phone  C=Tracking ID  D=Tracking Link  E=Message Sent  F=Last Updated
OTHERS TAB (extra Courier Name column):
A=Name  B=Phone  C=Courier Name  D=Tracking ID  E=Tracking Link
F=Message Sent  G=Last Updated
SETTINGS TAB:
Row2 ColA=system_on (TRUE/FALSE)  ColB=auto_message (TRUE/FALSE)
STATUS VALUES:
NO=pending  SENT=accepted by Meta  DELIVERED=reached phone  FAILED=failed
═══════════════════════════════════════════
SECTION 7 — WHATSAPP TEMPLATES (ALL APPROVED)
═══════════════════════════════════════════
PHONE: +91 63500 44328   WABA: 2813814805677902
DAILY LIMIT: 10,000/day (upgraded from 2000 after successful sends June 2026)
QUALITY RATING: HIGH ✅

TRACKING TEMPLATES (Utility):
ymc_anjani  → {{1}}=Name {{2}}=TrackingID, Button awb={{1}}
ymc_dtdc    → {{1}}=Name {{2}}=TrackingID, Button awb={{1}}
ymc_maruti  → {{1}}=Name {{2}}=TrackingID, Button awb={{1}}
ymc_order_tracking → {{1}}=Name {{2}}=Courier {{3}}=TrackingID {{4}}=Link

CAMPAIGN TEMPLATES (Utility — approved June 2026):
ymc_ca_final_batch  → {{1}}=Student Name (CA Final IDT batch info + Telegram)
ymc_cma_final_batch → {{1}}=Student Name (CMA Final IDT batch info + Telegram)

DEEP LINKS:
DTDC   : dtdc.com/track-your-shipment/?awb=ID
Anjani : shreeanjani.co.in/tracking?awb=ID
Maruti : shreemaruti.com/track-shipment/?awb=ID
═══════════════════════════════════════════
SECTION 8 — WEBHOOK SYSTEM
═══════════════════════════════════════════
URL: https://ymctrackflow.onrender.com/webhook
TOKEN: ymctrackflow123
DOES:
1. Tracking: sent→SENT delivered→DELIVERED read→DELIVERED failed→FAILED
2. Campaigns: webhook goes to queue → processed every 10s (not immediate)
3. Auto reply to incoming (within 24hr free window)

WEBHOOK QUEUE SYSTEM (campaigns only):
- Meta fires many webhooks at once after bulk send → would crash Render
- Solution: webhook adds to campaign_webhook_queue (Python queue.Queue)
- Background thread processes queue every 10 seconds
- Webhook returns 200 to Meta instantly → no flood → no crash

STATUS RANK SYSTEM (prevents backward overwrites):
NO=0  SENT=1  FAILED=2  DELIVERED=3
Only update if new rank > current rank → DELIVERED can never flip to SENT/FAILED

META ERROR DATA:
Errors live in: entry.changes.value.errors[]
            and entry.changes.value.messages.errors[]
KEY ERROR CODES:
131026 = not on WhatsApp / old version  → permanent, skip
131047 = 24hr window passed             → send template
131048 = spam restriction               → QUALITY WARNING, slow down
131049 = ecosystem throttle             → QUALITY WARNING, pause
130403 = you blocked the user           → permanent, skip
131050 = user opted out of marketing    → permanent, suppress
131000/131016/130429 = temporary        → retry OK
131056 = too many messages same number  → retry later
132001 = template not approved          → check template
132000 = wrong variable count           → fix variables
═══════════════════════════════════════════
SECTION 9 — SENDING ORDER (critical)
═══════════════════════════════════════════
TRACKING:
1. Get pending orders
2. Mark ALL as SENT in batch FIRST (before sending)
3. Send one by one (0.5s delay)
4. API call fails → mark FAILED immediately
5. Webhook fires later → DELIVERED or FAILED
6. Webhook always writes last → webhook wins

CAMPAIGNS:
1. Fetch 5 recipients where status=NO (mini-batch)
2. Send one by one (1s delay)
3. Write SENT/FAILED per recipient + store wamid
4. Fetch next 5 → repeat until no more NO status
5. Mark campaign DONE
6. If crash → mark PAUSED → user clicks Resume → picks up from NO rows
═══════════════════════════════════════════
SECTION 10 — USER ROLES
═══════════════════════════════════════════
ADMIN      → full access, settings, campaigns, templates
MANAGER    → orders only, send/retry, no settings
CAMPAIGNER → campaigns + templates only
VIEWER     → read only
═══════════════════════════════════════════
SECTION 11 — FOLDER STRUCTURE
═══════════════════════════════════════════
backend/
  api.py              ← Flask endpoints + webhook + campaign endpoints
  main.py             ← process_all_tabs, retry logic
  sheets.py           ← Google Sheets read/write + cache (tracking only)
  whatsapp.py         ← send messages, auto reply, template mgmt,
                         send_template_message (for campaigns)
  scheduler.py        ← auto scheduler + keep alive
  auth.py             ← login, sessions, roles
  config.py           ← load env
  logger.py           ← logs
  supabase_db.py      ← Supabase client (SUPABASE_URL + SUPABASE_KEY)
  requirements.txt    ← includes supabase==2.31.0
  campaigns/
    campaign_manager.py  ← create/get/update campaigns in Supabase
    audience_filter.py   ← parse CSV (flexible column detection) + save contact book
    bulk_sender.py       ← mini-batch sender (5 at a time) + crash recovery
    campaign_scheduler.py ← deferred
    campaign_logger.py   ← deferred
frontend/src/
  App.jsx
  pages/        ← Login, Dashboard, Orders, Campaigns, Templates, Settings
  components/   ← OrdersTable, StatusBadge, StatCard, Sidebar,
                  ToastContainer, TemplateForm
  hooks/        ← useOrders, useStatus
  utils/        ← api.js, formatters.js
═══════════════════════════════════════════
SECTION 12 — SUPABASE SCHEMA (LIVE)
═══════════════════════════════════════════
Supabase project: Mumbai region
Project ref: hfrjtjujnjozvyfzwjty
NOTE: Projects after May 30 2026 need explicit GRANT permissions on all tables

TABLES:
orders
  id (BIGSERIAL PK), customer_name, phone, courier (anjani/dtdc/maruti/others),
  courier_name (others only), tracking_id, tracking_link, status (NO/SENT/DELIVERED/FAILED),
  status_rank (0-3), error_code, error_reason, wamid, created_at, last_updated
  INDEX: idx_orders_wamid, idx_orders_status

contact_books
  id (BIGSERIAL PK), name, total (contact count), created_at

contacts
  id (BIGSERIAL PK), book_id (FK→contact_books CASCADE), name, phone,
  extra_data (JSONB), created_at
  INDEX: idx_contacts_book_id

campaigns
  id (BIGSERIAL PK), name, template_name, book_id (FK→contact_books),
  status (DRAFT/SENDING/DONE/FAILED/PAUSED), total, sent, failed, created_at
  NOTE: PAUSED added via ALTER TABLE after initial creation

campaign_recipients
  id (BIGSERIAL PK), campaign_id (FK→campaigns CASCADE), name, phone,
  variables (JSONB — actual values in order e.g. ["Ramesh", "9876543210"]),
  status (NO/SENT/DELIVERED/FAILED), status_rank (0-3),
  error_code, wamid, last_updated
  INDEX: idx_recipients_campaign_id, idx_recipients_wamid, idx_recipients_status
═══════════════════════════════════════════
SECTION 13 — CAMPAIGN SYSTEM (BUILT — June 2026)
═══════════════════════════════════════════
CONTACT BOOK FLOW:
1. Upload CSV (any column names — auto-detects name/phone columns)
2. System saves as contact book in Supabase
3. View saved books + contacts in Campaign History page
4. Delete books when no longer needed

CSV COLUMN DETECTION (audience_filter.py):
- Name: any header containing "name" (excludes "username", "filename")
- Phone: priority → "phone"/"mobile" first, then "contact number"/"whatsapp"
- BOM character stripped, empty rows skipped, trailing columns ignored
- All other columns → stored as extra_data (JSONB)

CAMPAIGN SEND FLOW:
1. Pick contact book → enter campaign name → pick approved template
2. Variable mapping: {{1}}→column, {{2}}→column (maps to actual values per recipient)
3. Click Create & Send
4. Backend creates campaign + inserts all recipients with pre-resolved variables
5. Background thread sends in mini-batches of 5 (1s delay each)
6. UI polls /campaigns/status/<id> every 3 seconds → shows live count
7. If crash → PAUSED → Resume button appears → picks up from status=NO rows
8. On DONE → shows recipient table with All/Sent/Failed tabs

CAMPAIGN UI FEATURES:
- Campaign History card (top of page): all campaigns, View/Resume/Delete per row
- Contact Books card: list of saved books with View/Delete
- Per-recipient results table after send
- Filter: All / Sent / Failed
- Download Failed CSV button
- Human-readable error labels (131026="Not on WhatsApp" etc.)
- Status badges: DRAFT=grey, SENDING=blue, DONE=green, PAUSED=orange, FAILED=red
- Resume button: green, appears only on PAUSED campaigns
═══════════════════════════════════════════
SECTION 14 — THE ROADMAP (5 PHASES)
═══════════════════════════════════════════
✅ Template Management        — DONE
✅ PHASE 3 — Campaign System  — DONE (built before Phase 1 due to urgency)
▶️ CAMPAIGN FIXES (next)      ← WE ARE HERE
   PHASE 1 — Supabase Tracking Foundation
   PHASE 2 — Error Capture & Smart Retry
   PHASE 4 — Campaign Safety (opt-out, quality monitor)
   PHASE 5 — Polish

CAMPAIGN FIXES REMAINING:
1. Sheets scheduler kills campaign sends
   FIX: In main.py process_all_tabs → check if campaign SENDING → skip
   CODE:
     result = supabase.table("campaigns").select("id").eq("status","SENDING").limit(1).execute()
     if result.data: return

2. Error codes not saving to campaign_recipients
   → 181 failed messages with no error shown in UI
   → Need to investigate bulk_sender.py error capture

3. Retry button for FAILED recipients
   → Skip permanent (131026, 130403, 131050)
   → Retry temporary (131000, 130429, 131016)

4. Send → Pause → Update cycle (Malik's design)
   Instead of continuous send competing with webhooks:
   Send 70-100 → pause 15s (let webhooks settle) → send next 70-100
   Improves accuracy, reduces memory pressure

──────────────────────────────────────────
PHASE 1 — SUPABASE TRACKING FOUNDATION
──────────────────────────────────────────
Goal: move tracking off Google Sheets onto Supabase
- orders table already created ✅
- Build paste-to-dashboard UI (manager picks courier, pastes rows)
- Backend reads Sheets → writes to Supabase (one API call)
- Switch sender to read from Supabase
- Switch webhook to write to Supabase (match by wamid)
- Switch dashboard to read from Supabase
- Drop Sheets fully
──────────────────────────────────────────
PHASE 2 — ERROR CAPTURE & SMART RETRY
──────────────────────────────────────────
- Capture error code + reason at SEND time
- Capture error code in WEBHOOK
- Smart retry: skip permanent, retry temporary
- Show failure reason in Orders page
──────────────────────────────────────────
PHASE 4 — CAMPAIGN SAFETY
──────────────────────────────────────────
- Opt-out / STOP handling + suppression list
- Quality rating monitor (alert on 131048/131049)
- Frequency capping
──────────────────────────────────────────
PHASE 5 — POLISH
──────────────────────────────────────────
- Customer care redirect (wa.me link)
- User management UI
- Final cleanup
═══════════════════════════════════════════
SECTION 15 — KEY LEARNINGS
═══════════════════════════════════════════
1. WEBHOOK TIMING — write SENT before sending; webhook fires after → wins
2. GOOGLE SHEETS RATE LIMITS — 60 req/min. Root cause of "30% stay SENT"
3. WABA ID ≠ PHONE NUMBER ID — distinct creds, distinct purposes
4. DATE FORMAT — pad single-digit hours (5:52 → 05:52) for JS parsing
5. FLASK SCHEDULER — use_reloader=False
6. REACT COMPONENT SCOPE — define sub-components at module level
7. OTHERS TAB — extra Courier Name col, indices shift by 1
8. TEMPLATE LANGUAGE — en_US not en
9. CREDENTIALS — never commit .env
10. TEMPLATE FETCH — Meta paginates; loop paging.next to get all
11. SUPABASE GRANTS — projects after May 30 2026 need explicit GRANT on all tables
12. RENDER FREE TIER 512MB — Sheets scheduler + campaign send compete → campaign dies
    FIX: skip Sheets when campaign SENDING
13. WEBHOOK FLOOD — Meta fires 153 webhooks at once after bulk send
    FIX: queue system (webhook adds to queue → processed every 10s)
14. MINI-BATCH SENDING — fetch 5 at a time (status=NO) → prevents memory overload
15. FRESH SUPABASE CLIENT per send — shared client drops connections in threads
16. STATUS RANK — NO=0 SENT=1 FAILED=2 DELIVERED=3 — only update if higher rank
17. DAILY LIMIT — upgraded to 10,000/day after successful sends (June 2026)
18. QUALITY 2026 — limits per Business PORTFOLIO not per number
19. VARIABLES — stored as ordered list ["Ramesh", "9876543210"] not dict
    bulk_sender passes list directly to send_template_message as body params
20. CSV FLEXIBILITY — system auto-detects column names, strips BOM, handles any format
═══════════════════════════════════════════
SECTION 16 — COSTS
═══════════════════════════════════════════
Tracking message : ₹0.125   Campaign message : ₹0.125 (Utility category)
Auto reply (24hr): FREE      AiSensy saving   : ₹999/mo (₹11,988/yr)
Failed messages  : generally NOT charged
Message limit    : 10,000/day (upgraded June 2026)
═══════════════════════════════════════════
SECTION 17 — RULES FOR EVERY CHAT
═══════════════════════════════════════════
→ Cave man mode: short, direct, one step at a time, confirm each step
→ Explain before coding; no code without agreement
→ py -3.11 for all Python
→ Compile test before push: py -3.11 -m py_compile <file>
→ Push to main branch: git push origin HEAD (Render watches main not master)
→ Fix conflicts: git pull origin main --no-edit → git commit --no-edit → push
→ Test locally before live when possible
→ Backup before big changes: git branch backup-working-version
→ Plan in chat (Opus) → build in Claude Code (Sonnet)
→ Start each Claude Code session: read MASTER.md + CONTEXT.md first
→ Every Supabase write on Render needs retry (3 attempts, 1s gap) — connection drops
→ Never make GitHub repo public with credentials
═══════════════════════════════════════════
STATUS  : LIVE ✅  CAMPAIGNS LIVE ✅  QUALITY HIGH ✅  10K LIMIT ✅
NEXT    : Campaign fixes → Phase 1 Tracking Migration
VERSION : 11.0
🦴
═══════════════════════════════════════════