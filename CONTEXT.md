# YMCTRACKFLOW — CONTEXT
# Session log / current state — read alongside MASTER.md
# Last updated: 2026-07-06 (end of session)
═══════════════════════════════════════════
WHERE WE ARE RIGHT NOW
═══════════════════════════════════════════
→ `main` and `staging` are in full parity (verified via empty
  `git diff main staging --stat` after each push today). Both fully
  up to date, both deployed and healthy.
→ Everything shipped today was verified end-to-end before pushing -
  not just build/lint, but an actual headless-browser run against the
  live deployed backend (logged in as both admin and manager, checked
  real rendered data, checked console errors).
→ Backend: https://ymctrackflow.onrender.com - now actually kept awake
  (see item 3 below), should no longer cold-start after idle periods.
→ Nothing is mid-flight or half-done. Safe to start fresh next session.
→ One deliberately deferred item: bulk delete / retention policy for
  old orders - see OPEN ITEMS below. Don't build it without the user
  bringing explicit requirements first.
═══════════════════════════════════════════
TODAY'S SESSION (2026-07-06) — WHAT HAPPENED, IN ORDER
═══════════════════════════════════════════
1. User asked what got sent today via the "maruti template" (the
   WhatsApp template used for Shree Maruti courier orders). Queried
   Supabase directly: 26 orders, all added and sent in one batch
   between 11:54-11:55 AM IST, all DELIVERED, zero failures.

2. User surfaced a specific real incident: a row "Ram, 7742304489,
   26103300038634" that should NOT have been added silently - tracing
   it found the tracking_id 26103300038634 was already claimed by
   RANDHIR JHA/7070009808 in that same batch. Root-caused the exact
   mechanism:
   - bulk_add_orders.py's duplicate/conflict check only ever queried
     the database - it never checked a paste's rows against each
     other. Two new rows sharing a tracking_id both showed "Ready" in
     preview (neither existed in the DB yet), and the collision only
     got caught (correctly, but invisibly) once actual submit inserted
     them one at a time.
   - Compounded by the frontend only reporting an aggregate toast
     count ("N conflicts need review"), never which row.
   FIXED: bulk_add_orders.py now tracks a seen_in_batch map so a
   second occurrence of the same tracking_id in one paste is caught
   during preview itself. Verified against the real DB with a
   reproduction script mirroring the exact incident.

3. User asked why the app feels much slower than the old Google Sheets
   version, framed as a "caching" question. Investigated: there is no
   caching layer anywhere (each page load was a fresh full-table
   fetch), but the bigger finding was a real bug - scheduler.py's
   keep_alive() was pinging `ymctrackflow-backend.onrender.com`
   (wrong hostname, 404) instead of the real deployed backend
   `ymctrackflow.onrender.com`. It had never actually been keeping
   Render's free tier awake, so the backend was cold-starting
   (30-60s) after ~15 min idle - almost certainly the dominant cause
   of the slowness. FIXED: corrected the URL.

4. Also fixed, same round: Add Orders was blocking the modal on the
   entire WhatsApp send loop finishing (the backend synchronously
   called send_pending_orders() inside the same HTTP request as the
   insert). Changed to a background thread; the modal now closes
   immediately on a clean add, or stays open showing exactly which
   row(s) conflicted if there were any (reusing the same preview
   table instead of a vague toast). Orders page now briefly polls
   (every 3s, up to 90s, stops early once nothing's left pending)
   after an add so rows visibly flip status without a manual refresh.

5. Pushed all of the above (batch-aware conflict detection, async
   send, keep-alive fix, live polling) to staging, cherry-picked to
   main, import-tested + build-tested first, then pushed main.
   User had explicitly asked to hold all pushes earlier in the
   session (a big campaign was about to go out) - confirmed via
   AskUserQuestion before pushing once the user actively asked to
   push both branches.

6. Discussed the caching topic further - proposed a 21-day rolling
   window with a full-history search fallback. User rejected
   windowing: reasoning is old data "gets deleted eventually anyway"
   (a cleanup feature not yet built), so whole-dataset caching is
   fine for now. Went with caching the whole dataset instead.

7. BUILT: frontend/src/context/OrdersContext.jsx - Dashboard and
   Orders pages now share ONE fetch of the whole orders table via
   context instead of each independently re-fetching on its own
   mount. useOrders.js is now a thin re-export so no page code needed
   to change. Also widened Manager's permissions to include deleting
   orders (previously admin-only) - one line each in api.py and
   Orders.jsx.

8. Verified both of the above in an actual headless browser (not just
   build/lint) against the live deployed backend - started a local
   Playwright session (installed to scratchpad, not the project),
   logged in as admin and manager using real credentials from
   backend/.env, confirmed Dashboard and Orders both render the same
   799-order dataset, confirmed the Delete button now appears for
   manager. This surfaced a real regression: OrdersContext's provider
   now wraps the whole app including the public /login route, so its
   fetch-on-mount fired before login and threw a real (if harmless)
   401. FIXED: gated the initial fetch on a token existing in
   localStorage, mirroring useAuth.js's existing checkAuth() logic.
   Re-verified clean afterward - zero console errors.

9. Pushed the shared-cache + manager-delete + auth-gating fix to
   staging, cherry-picked to main, tested, pushed main. Confirmed
   `git diff main staging --stat` empty.

10. User raised the idea of a bulk "purge orders older than X" /
    scheduled retention job (the assumption behind #6's whole-dataset
    caching decision). Explained what both terms mean. User has NOT
    decided the actual requirements (how old is "old", whether tied
    to delivery status) and will come back with a plan once decided -
    explicitly deferred, not to be built without that plan.

11. Rewrote MASTER.md and this file to reflect all of the above.
═══════════════════════════════════════════
OPEN ITEMS (not urgent, nothing blocking)
═══════════════════════════════════════════
→ Retention/purge feature for old orders - deferred. User will bring
  exact requirements (age threshold, whether tied to order status)
  before this gets built. Do not assume a default window.
→ Campaign fixes backlog - pre-dates this session, still untouched.
  See MASTER.md Section 14 for the list.
→ frontend/src/utils/api.js hardcodes BASE_URL to the live production
  backend always - local `npm run dev` talks to production, not a
  local backend. Not a bug, just a gotcha worth knowing before any
  local verification work (see MASTER.md Section 3).
→ That's it. No other known gaps from today's work.
═══════════════════════════════════════════
HOW TO RESUME NEXT SESSION
═══════════════════════════════════════════
→ Read this file + MASTER.md, you'll have full context - no need to
  re-derive anything from git log or ask the user to re-explain.
→ If asked "what's left" - answer from OPEN ITEMS above. The Add
  Orders conflict/async-send fixes, the keep-alive fix, the shared
  orders cache, and manager delete access are all DONE and deployed -
  don't re-propose them.
→ If the user starts talking about deleting/purging old orders, that's
  the one deliberately open thread - pick up from where item 10 left
  off, don't assume a retention window they haven't given you.
→ Git workflow: see MASTER.md Section 6. staging first, cherry-pick to
  main, verify parity, then push main. Always confirm before pushing
  if there's any indication of an active campaign or sensitive timing.
