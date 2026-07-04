# YMCTRACKFLOW — MASTER DOCUMENT
# Version 12.0 — SHEETS FULLY RETIRED, SUPABASE-ONLY
# Paste this + CONTEXT.md at start of every coding chat
═══════════════════════════════════════════
SECTION 1 — WHAT WE BUILDING
═══════════════════════════════════════════
Name    : YMCTrackFlow
What    : WhatsApp order tracking system
          + bulk campaign messaging
Who     : YMC (Yashvant Mangal Classes)
How     : Manager/Admin pastes orders → system sends WhatsApp
          instantly (no delay, no rate limit)
          Team controls from dashboard
          Webhook updates real delivery status
          Campaigns send bulk messages to students
═══════════════════════════════════════════
SECTION 2 — TECH WE USE
═══════════════════════════════════════════
Backend  : Python 3.11 + Flask
Frontend : React 18 + inline styles
Database : Supabase Mumbai — ONLY database. Google Sheets fully
           retired 2026-07-04 (sheets.py + migrate_orders.py deleted,
           service account key rotated then purged from git history).
Hosting  : Render (backend, free tier 512MB)
           Vercel (frontend, free) — deploys from `main` branch
WhatsApp : Meta Cloud API (direct, no middleman)
Editor   : VS Code
Saving   : GitHub (github.com/ymconnects/YMCtrackflow — PUBLIC repo)
TWO-TOOL WORKFLOW:
→ claude.ai chat (Opus)  = ARCHITECT — plan, design, decide, write briefs
→ Claude Code (Sonnet)   = BUILDER  — read files, write code, test, push
Rule: plan here → paste brief into Claude Code → it builds step by step
═══════════════════════════════════════════
SECTION 3 — LIVE URLS
═══════════════════════════════════════════
Backend  : https://ymctrackflow.onrender.com
Frontend : https://ymctrackflow.vercel.app
GitHub   : https://github.com/ymconnects/YMCtrackflow (public)
LOCAL DEV:
Backend  : cd D:\YMCtrackflow\backend → python api.py
Frontend : cd D:\YMCtrackflow\frontend → npm run dev
Backend  : http://localhost:5000
Frontend : http://localhost:5173
═══════════════════════════════════════════
SECTION 4 — LOGIN CREDENTIALS
═══════════════════════════════════════════
Stored in Render env vars (ADMIN_USERNAME/PASSWORD etc). Four roles:
ADMIN      → full access, settings, campaigns, templates, delete orders
MANAGER    → orders only: send/retry/mark-delivered, no delete, no settings
CAMPAIGNER → campaigns + templates only
VIEWER     → read only, everywhere
═══════════════════════════════════════════
SECTION 5 — SECRET KEYS (.env, gitignored, never commit)
═══════════════════════════════════════════
META:
META_ACCESS_TOKEN=
META_PHONE_NUMBER_ID=   ← phone number ID (for SENDING)
META_WABA_ID=           ← WABA ID (for TEMPLATES) - DIFFERENT!
TEMPLATES:
META_TEMPLATE_ANJANI=ymc_anjani
META_TEMPLATE_DTDC=ymc_dtdc
META_TEMPLATE_MARUTI=ymc_maruti
META_TEMPLATE_OTHERS=ymc_order_tracking
WEBHOOK:
WEBHOOK_VERIFY_TOKEN=
SUPABASE (only database - no Sheets vars exist anymore):
SUPABASE_URL=https://hfrjtjujnjozvyfzwjty.supabase.co
SUPABASE_KEY=  ← service_role key (secret)
SYSTEM:
FLASK_PORT=5000
FLASK_SECRET_KEY=
CRITICAL: META_WABA_ID ≠ META_PHONE_NUMBER_ID
Sending uses PHONE_NUMBER_ID. Templates use WABA_ID. Mixing them = wrong
templates load. (This bug already cost us once — fixed June 2026.)
SECURITY INCIDENT (2026-07-04, resolved): an old credentials.json (Google
service-account key) was found committed in git history on this PUBLIC
repo. Key was revoked in Google Cloud Console, then the file was scrubbed
from history entirely via git-filter-repo + force-push across all 5
remote branches (main/staging/master/backup-june25/backup-working-version).
Commit hashes before 2026-07-04 no longer match anything - expected.
═══════════════════════════════════════════
SECTION 6 — GIT WORKFLOW (changed 2026-07-04)
═══════════════════════════════════════════
→ Work happens on `staging` branch first, always.
→ Backend changes (anything Render serves) ALSO need cherry-picking to
  `main`, since Render only deploys from `main`.
→ Frontend changes ALSO need `main` — Vercel deploys from `main`, not
  staging. (This was a real gap once: main's frontend fell ~20 commits
  behind staging with nobody noticing. Fixed by a whole-directory
  `git checkout staging -- frontend/` sync. Don't assume frontend-only
  changes can skip main.)
→ Standard flow per change: commit on staging → push → checkout main →
  cherry-pick → compile-test (actual `python -c "import <module>"`, not
  just py_compile — import errors only surface at runtime) → build-test
  frontend (`npm run build`) → push main → checkout back to staging.
→ Periodically sanity check `git diff main staging --stat` is empty to
  catch drift early.
→ Never force-push main/staging without explicit instruction. The one
  exception so far was the full history rewrite above, done once,
  deliberately, with confirmation.
═══════════════════════════════════════════
SECTION 7 — WHATSAPP TEMPLATES (ALL APPROVED)
═══════════════════════════════════════════
DAILY LIMIT: 10,000/day
QUALITY RATING: HIGH

TRACKING TEMPLATES (Utility):
ymc_anjani  → {{1}}=Name {{2}}=TrackingID, Button awb={{1}}
ymc_dtdc    → {{1}}=Name {{2}}=TrackingID, Button awb={{1}}
ymc_maruti  → {{1}}=Name {{2}}=TrackingID, Button awb={{1}}
ymc_order_tracking → {{1}}=Name {{2}}=Courier {{3}}=TrackingID {{4}}=Link

CAMPAIGN TEMPLATES (Utility):
ymc_ca_final_batch  → {{1}}=Student Name (CA Final IDT batch info + Telegram)
ymc_cma_final_batch → {{1}}=Student Name (CMA Final IDT batch info + Telegram)

DEEP LINKS (tracking_links.py, generated on insert, static URL - NOT a
live courier API call, just a link to the courier's own tracking page):
DTDC   : dtdc.com/track-your-shipment/?awb=ID
Anjani : shreeanjani.co.in/tracking?awb=ID
Maruti : shreemaruti.com/track-shipment/?awb=ID
Others + "India Post" courier_name → indiapost.gov.in (static, no ID)
═══════════════════════════════════════════
SECTION 8 — WEBHOOK SYSTEM
═══════════════════════════════════════════
URL: https://ymctrackflow.onrender.com/webhook
DOES:
1. Tracking: sent→SENT delivered→DELIVERED read→DELIVERED failed→FAILED
   (writes straight to Supabase `orders` by wamid - Sheets double-write
   removed 2026-07-04, was silently blocking updates after the Sheets key
   was revoked)
2. Campaigns: webhook goes to queue → processed every 10s (not immediate)
3. Auto reply to incoming (within 24hr free window, checked via Supabase)

WEBHOOK QUEUE SYSTEM (both orders + campaigns share this queue now):
- Meta fires many webhooks at once after bulk send → would crash Render
- Solution: webhook adds to queue (Python queue.Queue)
- Background thread (process_webhook_queue) processes every 10 seconds
- Webhook returns 200 to Meta instantly → no flood → no crash

STATUS RANK SYSTEM (prevents backward overwrites):
NO=0  SENT=1  FAILED=2  DELIVERED=3
Only update if new rank > current rank → DELIVERED can never flip back

KEY ERROR CODES (mapped to readable text in whatsapp.py
ERROR_CODE_MEANINGS, computed on the fly - error_reason column in
Supabase is NOT written, exists but unused):
131026 = not on WhatsApp                → permanent, skip
131047 = 24hr window passed             → send template
131048 = spam restriction               → QUALITY WARNING, slow down
131049 = ecosystem throttle             → QUALITY WARNING, pause
130403 = you blocked the user           → permanent, skip
131050 = user opted out of marketing    → permanent, suppress
131009 = invalid template parameter
132000 = wrong variable count           → fix variables
132001 = template not approved          → check template
131021 = recipient == sender
131052 = media download error
133010 = business account not registered for Cloud API
190    = access token invalid/expired
═══════════════════════════════════════════
SECTION 9 — SENDING ORDER (critical)
═══════════════════════════════════════════
TRACKING (orders/bulk_sender.py send_pending_orders):
1. Fetch 5 pending orders where status=NO (mini-batch)
2. Send one by one (1s delay)
3. On success → status=SENT, message_sent_at=now, wamid stored
4. On failure → status=FAILED, error_code stored
5. Fetch next 5 → repeat until no more NO status
6. Webhook fires later → DELIVERED (status-rank guard: webhook always
   wins over a stale SENT, but can never downgrade DELIVERED)

TRIGGERS for send_pending_orders (three ways, all live):
- Scheduler: every CHECK_INTERVAL_MINUTES if Auto MSG toggle is ON
- Manual: "Run now" button → POST /run-now (admin/manager)
- Instant: POST /orders/bulk-add now triggers a send immediately after
  a non-dry-run insert (added 2026-07-04) - no more waiting for the
  scheduler tick, since there's no rate-limit constraint anymore. This
  blocks the HTTP response until done (same pattern as /run-now) - fine
  for normal batches, could get slow on a very large paste.

CAMPAIGNS (campaigns/bulk_sender.py):
1. Fetch 5 recipients where status=NO (mini-batch)
2. Send one by one (1s delay)
3. Write SENT/FAILED per recipient + store wamid
4. Fetch next 5 → repeat until no more NO status
5. Mark campaign DONE
6. If crash → mark PAUSED → user clicks Resume → picks up from NO rows
═══════════════════════════════════════════
SECTION 10 — USER ROLES
═══════════════════════════════════════════
ADMIN      → full access: settings, campaigns, templates, delete orders
MANAGER    → orders only: send/retry/mark-delivered, no delete/settings
CAMPAIGNER → campaigns + templates only
VIEWER     → read only, everywhere
═══════════════════════════════════════════
SECTION 11 — FOLDER STRUCTURE (accurate as of 2026-07-04)
═══════════════════════════════════════════
backend/
  api.py                    ← Flask endpoints + webhook + campaign endpoints
                               (main.py never existed as a separate file
                               despite older docs implying it did)
  auth.py                   ← login, sessions, roles
  config.py                 ← load env (no Sheets keys anymore)
  logger.py                 ← logs
  scheduler.py              ← auto scheduler + keep alive + system
                               on/off + auto-message toggle (Supabase-
                               backed via system_settings table)
  supabase_db.py            ← Supabase client (SUPABASE_URL + SUPABASE_KEY)
  whatsapp.py                ← send_order_template_message, template mgmt,
                               ERROR_CODE_MEANINGS map, phone helpers
  tracking_links.py         ← generate_tracking_link (static courier URLs)
  bulk_add_orders.py        ← paste-to-dashboard insert + dry-run preview
                               + duplicate/conflict detection by tracking_id
  requirements.txt          ← no gspread/google-auth anymore
  orders/
    order_view.py           ← get_all_orders (Supabase → legacy frontend
                               shape), was_message_sent_within_24hrs
    bulk_sender.py           ← send_pending_orders, update_order_status
  campaigns/
    campaign_manager.py     ← create/get/update campaigns in Supabase
    audience_filter.py      ← parse CSV (flexible column detection)
    bulk_sender.py          ← mini-batch sender (5 at a time)
    campaign_scheduler.py   ← deferred, not built
    campaign_logger.py      ← deferred, not built
  sheets.py, migrate_orders.py  ← DELETED 2026-07-04, do not recreate
frontend/src/
  App.jsx
  pages/       ← Login, Dashboard, Orders, Campaigns, CampaignCreate,
                 CampaignDetail, CampaignReport, Templates, Logs, Settings
  components/  ← OrdersTable, AddOrdersModal, StatusBadge, StatCard,
                 Sidebar, TopBar, ToastContainer, Toast, TemplateForm,
                 AudienceFilter, CampaignCard, CostEstimator, LogsTable,
                 ProtectedRoute
  hooks/       ← useOrders, useStatus, useAuth, useCampaigns, useLogs
  utils/       ← api.js, formatters.js, trackingLinks.js
═══════════════════════════════════════════
SECTION 12 — SUPABASE SCHEMA (LIVE, verified 2026-07-04)
═══════════════════════════════════════════
Supabase project: Mumbai region, ref hfrjtjujnjozvyfzwjty
NOTE: projects after May 30 2026 need explicit GRANT permissions on tables

orders
  id, customer_name, phone, courier (anjani/dtdc/maruti/others),
  courier_name (others only), tracking_id, tracking_link,
  status (NO/SENT/DELIVERED/FAILED), status_rank (0-3),
  error_code, error_reason (column exists, NEVER written - reason is
  computed on the fly from error_code instead), wamid,
  created_at, last_updated, message_sent_at (added 2026-07-04, set on
  first transition to SENT), manually_delivered (bool, one-way flag,
  no unset control anywhere by design)

system_settings (added 2026-07-04)
  id, system_on (bool), auto_message (bool), updated_at
  Single-row table (id=1). Replaced the old Sheets "Settings" tab.

table_column_settings
  id, page_name, column_order (jsonb array), pinned_columns (jsonb
  array, max 4), updated_at. Powers Orders table drag-reorder/pin.

contact_books
  id, name, total (contact count), created_at

contacts
  id, book_id (FK→contact_books CASCADE), name, phone,
  extra_data (jsonb), created_at

campaigns
  id, name, template_name, book_id (FK→contact_books),
  status (DRAFT/SENDING/DONE/FAILED/PAUSED), total, sent, failed,
  created_at

campaign_recipients
  id, campaign_id (FK→campaigns CASCADE), name, phone,
  variables (jsonb ordered list, e.g. ["Ramesh","9876543210"]),
  status (NO/SENT/DELIVERED/FAILED), status_rank (0-3),
  error_code, wamid, last_updated
═══════════════════════════════════════════
SECTION 13 — ORDERS PAGE FEATURES (current, 2026-07-04)
═══════════════════════════════════════════
ADD ORDERS (paste-to-dashboard):
- Pick courier tab → paste rows (tab, comma, or plain-space separated -
  parser handles all three, strips stray quote characters from bad
  copy-paste sources)
- Preview shows Ready / Duplicate / Conflict / Missing fields / Invalid
  phone number per row before submitting - phone must be 10 digits or
  91+10 digits, anything else is flagged, never silently inserted
- On submit: inserts to Supabase, THEN immediately triggers a send
  (no waiting for scheduler)

ORDERS TABLE:
- Columns: Order ID, Customer, Phone, Courier, Tracking ID, Tracking
  Link, Msg Status, Message Sent (IST, 12hr AM/PM) - drag-reorder,
  pin up to 4 columns, persisted per-user via table_column_settings
- Default sort: Newest First (by last message activity). Dropdown also
  has Pending First / Oldest First.
- Action buttons per row: Send (status=NO), Retry (status=FAILED),
  Mark manually delivered (FAILED only, admin/manager, one-way -
  shows "Delivered (Manual)" badge afterward, no way to undo), View
  details, Delete (admin only, permanent, confirms first)
- View details popup: Order ID, Customer, Phone, Courier, Tracking ID,
  Message Sent, Last Updated, Error Code, Error Reason, WAMID

TOP BUTTONS: Add Orders, Refresh (re-fetches from Supabase - this used
to be "Sync sheet" hitting a Sheets-backed /sync endpoint, that
endpoint no longer exists), Retry failed (bulk), Run now (bulk send
all pending)
═══════════════════════════════════════════
SECTION 14 — KNOWN OPEN ITEMS (not urgent)
═══════════════════════════════════════════
- Campaign fixes backlog (pre-dates the Sheets migration, not revisited
  recently): error codes not always saving to campaign_recipients;
  send→pause→update cycle (Malik's design) not implemented; opt-out /
  STOP handling + suppression list not built; quality rating monitor
  not built; frequency capping not built.
- Instant-send-on-add (Section 9) is synchronous and could get slow on
  a very large single paste (tens+ of rows) - not a problem at current
  volumes, revisit if bulk-add batches grow much larger.
═══════════════════════════════════════════
SECTION 15 — KEY LEARNINGS
═══════════════════════════════════════════
1. WEBHOOK TIMING — write SENT before sending; webhook fires after → wins
2. WABA ID ≠ PHONE NUMBER ID — distinct creds, distinct purposes
3. DATE FORMAT — pad single-digit hours for JS parsing
4. FLASK SCHEDULER — use_reloader=False
5. REACT COMPONENT SCOPE — define sub-components at module level
6. OTHERS TAB (legacy Sheets concept) — extra Courier Name col, no
   longer relevant now that Sheets is gone, courier_name column covers it
7. TEMPLATE LANGUAGE — en_US not en
8. CREDENTIALS — never commit .env or credentials.json (learned the
   hard way 2026-07-04 - see Section 5 security incident)
9. TEMPLATE FETCH — Meta paginates; loop paging.next to get all
10. SUPABASE GRANTS — projects after May 30 2026 need explicit GRANT
11. WEBHOOK FLOOD — Meta fires many webhooks at once after bulk send
    FIX: queue system (webhook adds to queue → processed every 10s)
12. MINI-BATCH SENDING — fetch 5 at a time (status=NO) → prevents
    memory overload on Render's free tier
13. STATUS RANK — NO=0 SENT=1 FAILED=2 DELIVERED=3 — only update if
    higher rank
14. VARIABLES — campaign_recipients stores ordered list not dict
15. CSV FLEXIBILITY — audience_filter.py auto-detects column names,
    strips BOM, handles any format
16. GIT HISTORY — deleting a file in a later commit does NOT remove it
    from history; a real secret leak needs git-filter-repo + force-push,
    and check ALL remote branches, not just the ones you normally push to
    (a forgotten `master` branch on this repo still had the old
    credential until specifically checked)
17. IMPORT ERRORS — py_compile does NOT catch missing-module errors at
    cherry-pick time; always do an actual `python -c "import X"` on
    every touched/imported module before pushing to main
18. FRONTEND DRIFT — main and staging frontends can silently diverge by
    dozens of commits if only backend changes get cherry-picked
    religiously; periodically diff the whole tree, not just files you
    remember touching
═══════════════════════════════════════════
SECTION 16 — COSTS
═══════════════════════════════════════════
Tracking message : ₹0.125   Campaign message : ₹0.125 (Utility category)
Auto reply (24hr): FREE
Failed messages  : generally NOT charged
Message limit    : 10,000/day
═══════════════════════════════════════════
SECTION 17 — RULES FOR EVERY CHAT
═══════════════════════════════════════════
→ Read MASTER.md + CONTEXT.md first, every session
→ Cave man mode by default: short, direct, one step at a time, explain
  before coding, confirm before destructive/irreversible actions
→ Compile test before push: python -m py_compile <file>, AND an actual
  `python -c "import <module>"` for anything touched/imported (py_compile
  alone misses import-time errors)
→ Git workflow: see Section 6. staging first, cherry-pick backend AND
  frontend changes to main, verify parity, then push main
→ Every Supabase write on Render needs retry (3 attempts, 1s gap) —
  connection drops happen
→ Never make GitHub repo public with credentials in it (again)
→ Sheets is gone. Don't reintroduce a Sheets call anywhere without
  explicit confirmation first.
═══════════════════════════════════════════
STATUS  : LIVE ✅  SHEETS FULLY RETIRED ✅  SUPABASE-ONLY ✅
NEXT    : see CONTEXT.md for current session state and open threads
VERSION : 12.0
🦴
═══════════════════════════════════════════
