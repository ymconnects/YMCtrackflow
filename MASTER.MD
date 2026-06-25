# YMCTRACKFLOW — MASTER DOCUMENT
# Version 10.0 — SUPABASE + CAMPAIGN ROADMAP
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
          Campaigns send bulk offers to students

═══════════════════════════════════════════
SECTION 2 — TECH WE USE
═══════════════════════════════════════════

Backend  : Python 3.11 + Flask
Frontend : React 18 + Tailwind / inline styles
Database : Google Sheets (CURRENT) → Supabase (MIGRATING)
Hosting  : Render (backend, free tier)
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

GOOGLE SHEETS (current):
GOOGLE_SHEET_ID=
GOOGLE_CREDENTIALS_FILE=credentials.json

SUPABASE (to add in Phase 1):
SUPABASE_URL=
SUPABASE_KEY=

SHEET TAB NAMES:
SHEET_TAB_1=Shree Anjani Couriers
SHEET_TAB_2=DTDC Couriers
SHEET_TAB_3=Shree Maruti Couriers
SHEET_TAB_4=Others

SYSTEM:
FLASK_PORT=5000
FLASK_SECRET_KEY=

CRITICAL: META_WABA_ID ≠ META_PHONE_NUMBER_ID
Sending uses PHONE_NUMBER_ID. Templates use WABA_ID. Mixing them = wrong
templates load. (This bug already cost us once — fixed June 2026.)

═══════════════════════════════════════════
SECTION 6 — GOOGLE SHEET STRUCTURE (CURRENT)
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

ymc_anjani  (Utility) → {{1}}=Name {{2}}=TrackingID, Button awb={{1}}
ymc_dtdc    (Utility) → {{1}}=Name {{2}}=TrackingID, Button awb={{1}}
ymc_maruti  (Utility) → {{1}}=Name {{2}}=TrackingID, Button awb={{1}}
ymc_order_tracking (Utility) → {{1}}=Name {{2}}=Courier {{3}}=TrackingID
                               {{4}}=Link, no button (link in body)

DEEP LINKS (Apps Script auto-generates):
DTDC   : dtdc.com/track-your-shipment/?awb=ID
Anjani : shreeanjani.co.in/tracking?awb=ID
Maruti : shreemaruti.com/track-shipment/?awb=ID

TEMPLATE MANAGEMENT UI — ✅ DONE (June 2026):
→ Live fetch from Meta (handles pagination)
→ Search + tabs (All/Draft/Pending/Approved)
→ Table: Name, Category, Status, Type, Copy + Delete
→ Create form: 3-step (Setup → Edit → Submit)
→ Setup = category pick (Utility/Marketing); Copy skips Setup (pre-filled)
→ Edit = name/lang, variable format, header (text), media (Image/Video/
  Document/Location), body (required), footer, buttons (max 3), live preview
→ Submit = review + send to Meta
→ Files: pages/Templates.jsx + components/TemplateForm.jsx
→ Backend: whatsapp.py (get_all_templates, create_template, delete_template)
           api.py (/templates GET, /templates/create, /templates/delete)
           api.js (getTemplates, createTemplate, deleteTemplate)
→ NOTE: media upload at SEND time, not creation (declare type only)
→ Draft tab = UI ready, storage wired up later with Supabase

═══════════════════════════════════════════
SECTION 8 — WEBHOOK SYSTEM
═══════════════════════════════════════════

URL: https://ymctrackflow.onrender.com/webhook
TOKEN: ymctrackflow123

DOES:
1. Delivery status: sent→SENT delivered→DELIVERED read→DELIVERED failed→FAILED
2. Auto reply to incoming (within 24hr free window) — fixed business reply

META ERROR DATA (Phase 2 — capture this):
Errors live in: entry.changes.value.errors[]
            and entry.changes.value.messages.errors[]
Each has: code + details. Build logic on CODE, not subcode.

KEY ERROR CODES:
131026 = not on WhatsApp / old version  → permanent, skip
131047 = 24hr window passed             → send template
131048 = spam restriction on number     → QUALITY WARNING, slow down
131049 = ecosystem throttle             → QUALITY WARNING, pause
130403 = you blocked the user           → permanent, skip
131050 = user opted out of marketing    → permanent, suppress
131000/131016/130429 = temporary        → retry OK

META STATUS: Live ✅  Business Verified (May 29 2026) ✅
QUALITY RATING: HIGH ✅ (80% button click rate on tracking)

═══════════════════════════════════════════
SECTION 9 — SENDING ORDER (critical)
═══════════════════════════════════════════

1. Get pending orders
2. Mark ALL as SENT in batch FIRST (before sending)
3. Send one by one (0.5s delay)
4. API call fails → mark FAILED immediately
5. Webhook fires later → DELIVERED or FAILED
6. Webhook always writes last → webhook wins

WHY: write SENT first so webhook (which fires after) wins on final status.

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
  api.py        ← Flask endpoints + webhook
  main.py       ← process_all_tabs, retry logic
  sheets.py     ← Google Sheets read/write + cache
  whatsapp.py   ← send messages, auto reply, template mgmt
  scheduler.py  ← auto scheduler + keep alive
  auth.py       ← login, sessions, roles
  config.py     ← load env
  logger.py     ← logs
  supabase_db.py ← (Phase 1 — new)
  campaigns/    ← campaign_manager, audience_filter, bulk_sender,
                  campaign_scheduler, campaign_logger
frontend/src/
  App.jsx
  pages/        ← Login, Dashboard, Orders, Campaigns, Templates, Settings
  components/   ← OrdersTable, StatusBadge, StatCard, Sidebar,
                  ToastContainer, TemplateForm
  hooks/        ← useOrders, useStatus
  utils/        ← api.js, formatters.js

═══════════════════════════════════════════
SECTION 12 — THE ROADMAP (5 PHASES)
═══════════════════════════════════════════

──────────────────────────────────────────
PHASE 1 — SUPABASE FOUNDATION
──────────────────────────────────────────
Goal: move everything off Google Sheets onto a real database.
- Create Supabase project + tables (see Section 13)
- Add supabase_db.py, connect backend
- Migrate order read/write Sheets → Supabase
- Update webhook to write Supabase (fixes bulk rate-limit problem)
- New columns: status, error_code, error_reason, wamid
- Keep tracking working end-to-end
- DECISION MADE: merge 4 courier tabs → ONE orders table + courier column
- DECISION MADE: Google Sheets fully replaced (not kept as backup)

──────────────────────────────────────────
PHASE 2 — ERROR CAPTURE & SMART RETRY
──────────────────────────────────────────
Goal: make failures visible and actionable.
- Capture error code + reason at SEND time (whatsapp.py)
- Capture error code + reason in WEBHOOK (api.py)
- Store wamid when sending; match webhook by wamid (precise row match)
- Smart retry: skip permanent (131026,130403,131050), retry temporary
- Show failure reason in Orders page

──────────────────────────────────────────
PHASE 3 — CAMPAIGN SYSTEM (main milestone)
──────────────────────────────────────────
Goal: bulk offer messaging like AiSensy.
- Pick approved template
- Upload audience CSV (name, phone + extra columns)
- Map each variable {{n}} → a column OR a fixed value
- Bulk sender with pacing (spread sends, not all at once)
- Per-recipient status (sent/delivered/read/failed)
- Campaign analytics dashboard

──────────────────────────────────────────
PHASE 4 — CAMPAIGN SAFETY (protect HIGH rating)
──────────────────────────────────────────
Goal: don't let campaigns drag down quality rating.
- Opt-out / STOP handling + suppression list (never message opted-out)
- "Reply STOP to opt out" in marketing templates
- Quality rating monitor + alert on 131048/131049
- Frequency capping (track last-contacted, don't over-message)
- Quick-reply buttons to boost reply rate (2026 rule: ignored msgs hurt)

──────────────────────────────────────────
PHASE 5 — POLISH
──────────────────────────────────────────
- Customer care redirect button (wa.me/91XXXXXXXXXX link in dashboard)
- User management UI (add/remove users, currently hardcoded in auth.py)
- Final cleanup

DEFERRED (maybe never):
- Full chat board / team inbox → replaced by simple wa.me redirect button
- OBA (blue tick) → apply when ready, Meta decides on brand recognition
- Two-step verification → needs boss Facebook email verified first

═══════════════════════════════════════════
SECTION 13 — SUPABASE SCHEMA (draft — finalize in Phase 1 planning)
═══════════════════════════════════════════

orders
  id, customer_name, phone, courier, tracking_id, tracking_link,
  status (NO/SENT/DELIVERED/FAILED), error_code, error_reason,
  wamid, created_at, last_updated

campaigns
  id, name, template_name, status, audience_count,
  sent, delivered, failed, created_at, created_by

campaign_recipients
  id, campaign_id, name, phone, variables (json), status,
  error_code, error_reason, wamid, last_updated

users
  id, username, password_hash, role, created_at

suppression_list
  id, phone, reason (STOP / opted_out / 131050), created_at

logs
  id, type, message, created_at

settings
  key, value   (system_on, auto_message, etc.)

messages (for future chat board — table ready, UI deferred)
  id, phone, direction (in/out), body, wamid, created_at

NOTE: exact columns finalized when we plan Phase 1 in detail.

═══════════════════════════════════════════
SECTION 14 — KEY LEARNINGS
═══════════════════════════════════════════

1. WEBHOOK TIMING — write SENT before sending; webhook fires after → wins
2. GOOGLE SHEETS RATE LIMITS — 60 req/min. Bulk webhooks exceed it → some
   rows stuck at SENT. ROOT CAUSE of "30% stay SENT". Supabase fixes this.
3. WABA ID ≠ PHONE NUMBER ID — distinct creds, distinct purposes
4. DATE FORMAT — pad single-digit hours (5:52 → 05:52) for JS parsing
5. FLASK SCHEDULER — use_reloader=False
6. REACT COMPONENT SCOPE — define sub-components at module level (else
   input focus loss). TemplateForm is a separate file for this reason.
7. OTHERS TAB — extra Courier Name col, indices shift by 1
8. TEMPLATE LANGUAGE — en_US not en
9. CREDENTIALS — never commit .env; GitHub scanner auto-revokes Google keys
10. TEMPLATE FETCH — Meta paginates; loop paging.next to get all
11. MESSAGES STAYING AT SENT — usually delivered but receipts off, OR
    bulk rate-limit. NOT a webhook bug. Supabase migration resolves bulk case.
12. FAILED MESSAGES — generally NOT billed (only delivered billed) but
    confirm in WhatsApp Manager billing view
13. QUALITY 2026 — limits now per Business PORTFOLIO not per number; one bad
    campaign can drag whole portfolio. Ignored messages now hurt rating.

═══════════════════════════════════════════
SECTION 15 — COSTS
═══════════════════════════════════════════

Tracking message : ₹0.125   Campaign message : ₹0.88
Auto reply (24hr): FREE      AiSensy saving   : ₹999/mo (₹11,988/yr)
Failed messages  : generally NOT charged (confirm in WhatsApp Manager)
Message limit    : 2,000/day currently

═══════════════════════════════════════════
SECTION 16 — RULES FOR EVERY CHAT
═══════════════════════════════════════════

→ Cave man mode: short, direct, one step at a time, confirm each step
→ Explain before coding; no code without agreement
→ py -3.11 for all Python
→ Compile test before push: py -3.11 -m py_compile <file>
→ Push after every file change: git push origin HEAD
→ Fix conflicts: git pull origin main --no-edit → git commit --no-edit
→ Test locally before live when possible
→ Backup before big changes: git branch backup-working-version
→ Plan in chat (Opus) → build in Claude Code (Sonnet)
→ Start each Claude Code session: read MASTER.md + CONTEXT.md first

═══════════════════════════════════════════
STATUS  : LIVE ✅  TEMPLATE MGMT ✅  QUALITY HIGH ✅
NEXT    : Phase 1 — Supabase Foundation
VERSION : 10.0
🦴
═══════════════════════════════════════════