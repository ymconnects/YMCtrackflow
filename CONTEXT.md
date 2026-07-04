# YMCTRACKFLOW — CONTEXT
# Session log / current state — read alongside MASTER.md
# Last updated: 2026-07-04 (end of session)
═══════════════════════════════════════════
WHERE WE ARE RIGHT NOW
═══════════════════════════════════════════
→ Sheets is fully retired. Nothing in the codebase can reach Google
  Sheets anymore - sheets.py and migrate_orders.py are deleted, config.py
  has no Sheets keys, requirements.txt has no gspread/google-auth.
→ `main` and `staging` are in full parity (verified via empty
  `git diff main staging --stat` multiple times this session). Both
  fully up to date, both deployed and healthy.
→ No known bugs. Everything shipped today was tested end-to-end before
  pushing (real API calls, real Supabase writes, then cleaned up any
  test artifacts on real customer rows).
→ Backend: https://ymctrackflow.onrender.com (confirmed 200 repeatedly
  throughout the session, most recently after the last push)
→ Nothing is mid-flight or half-done. Safe to start fresh next session.
═══════════════════════════════════════════
TODAY'S SESSION (2026-07-04) — WHAT HAPPENED, IN ORDER
═══════════════════════════════════════════
1. FINISHED THE SHEETS-TO-SUPABASE MIGRATION (Groups C, D, E - A and B
   were already done before today):
   - Group C: system_settings table + scheduler.py toggle functions
     moved off Sheets.
   - Found + fixed a live production bug while doing Group C: the
     webhook handler still called a Sheets function with zero error
     handling, which had started silently blocking Supabase status
     updates for ALL orders/campaigns (not just legacy ones) once the
     Sheets key got revoked. Fixed same commit.
   - Group D: deleted all dead Sheets/WhatsApp functions, removed the
     broken /sync endpoints, repurposed "Sync sheet" button into a
     working "Refresh" button.
   - Group E: deleted sheets.py + migrate_orders.py entirely, cleaned
     config.py and requirements.txt and .env.

2. CREDENTIAL LEAK, FOUND AND FULLY RESOLVED:
   - Found backend/credentials.json (a live Google service-account key)
     committed in git history on the PUBLIC repo.
   - User rotated the key in Google Cloud Console immediately.
   - Later in the session: fully scrubbed from git history using
     git-filter-repo, force-pushed to all 5 remote branches (including
     a `master` branch nobody had been actively using, which also had
     the leak). Verified zero matches for the file or key content
     anywhere afterward. Local repo reset to match.

3. DISCOVERED AND FIXED A REAL FRONTEND GAP:
   - While cherry-picking Group D, found `main`'s frontend was ~20
     commits behind `staging` - missing the Add Orders modal, pinned
     table columns, the CampaignDetail page, and more.
   - User confirmed Vercel needs `main` to be current (not just
     staging). Fixed via whole-directory `git checkout staging --
     frontend/` sync onto main. This is now the git workflow going
     forward (see MASTER.md Section 6) - frontend changes need main too,
     not just backend.

4. BUILT: manually_delivered flag UI.
   - Checkmark button on FAILED orders (admin/manager), one-way, no
     unset control anywhere. Shows "Delivered (Manual)" badge once set.

5. BUILT: Orders page enhancements batch.
   - New "Message Sent" column (IST, 12hr AM/PM).
   - View-details popup expanded: error code, error reason (computed
     live from a new error-code meaning map, not stored), WAMID.
   - Instant-send: POST /orders/bulk-add now sends immediately instead
     of waiting for the scheduler.
   - Default sort changed to Newest First.
   - One-time real-data fixes (confirmed with user first): the 94
     orders stuck at SENT (all sharing a fake backfill timestamp, no way
     to tell genuinely-pending from long-delivered) were bulk-converted
     to DELIVERED. message_sent_at backfilled for all 747 existing rows
     from last_updated/created_at as the best available proxy.

6. FOUND + FIXED A REAL BUG from live user testing:
   - User pasted an order via Add Orders; a stray quote character in
     the paste caused parseRows() to misalign fields (phone number
     landed in the tracking_id slot, a bare `"` landed in phone). The
     bad row (id 803) sent to an invalid phone, failed safely (no real
     customer contacted), but left garbage in the table. Deleted.
   - Fixed the parser: strips stray quote characters, falls back to
     splitting on 2+ spaces when there's no tab/comma.
   - Added a second safety layer since the user's manager (non-
     technical) also uses this feature: phone-number format validation
     in the preview, so any future glitch gets flagged "Invalid phone
     number" instead of silently showing "Ready".

7. BUILT: delete-order capability (admin only), since there was
   previously no way to remove a bad row without direct DB access -
   directly motivated by cleaning up the row from item 6.

8. WROTE/REWROTE MASTER.md AND CONTEXT.md (this file) to reflect all of
   the above, since MASTER.md was ~months stale (still described Sheets
   as "migrating", had an outdated folder structure and schema, and an
   outdated git workflow).
═══════════════════════════════════════════
OPEN ITEMS (not urgent, nothing blocking)
═══════════════════════════════════════════
→ Campaign fixes backlog - pre-dates this session, not touched today.
  See MASTER.md Section 14 for the list (error code capture gaps,
  send-pause-update cycle, opt-out handling, quality monitor).
→ Instant-send-on-add is synchronous (blocks the HTTP request until all
  newly-added orders finish sending). Fine today, could matter if
  someone pastes hundreds of rows in one go - revisit if that happens.
→ That's it. No other known gaps.
═══════════════════════════════════════════
HOW TO RESUME NEXT SESSION
═══════════════════════════════════════════
→ Read this file + MASTER.md, you'll have full context - no need to
  re-derive anything from git log or ask the user to re-explain.
→ If asked "what's left" - answer from the OPEN ITEMS section above,
  don't assume Sheets migration or credential work is still pending,
  both are fully closed.
→ Git workflow going forward: see MASTER.md Section 6. Always verify
  `git diff main staging --stat` is empty after cherry-picking, don't
  assume it worked.
