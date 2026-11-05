# Workboard: who is working on what

Claude Code and Codex both work on this repo. This file is how they coordinate.
**Before editing anything:** `git pull`, read this file, and only touch folders that
are not claimed by someone else. Claim yours here, commit and push the claim
*before* starting. Remove your claim (and push) when you are done.

## Active claims

| Agent | Folders / files | Task | Since |
|---|---|---|---|
| _none_ | | | |

## Recently finished

| Agent | What | Date |
|---|---|---|
| Claude Code | Deployed supabase/functions/invite-user (v1, verify_jwt on). Rejects non-logged-in callers. Deployed via Supabase Management API. Open issue: deployed tara-voice has verify_jwt OFF (anyone can call it). | 2026-11-05 |
| Mendy + Claude Code | RLS migration 20261105000000 APPLIED to live Supabase. Verified: anon key now reads 0 rows from every table and cannot insert. | 2026-11-05 |
| Claude Code | Split code into one folder per feature (core/, shared/, features/<name>/). Removed dead duplicate openDisposeModal. Known broken pages (pre-existing): twilio, pricing. | 2026-11-05 |
| Claude Code | Row Level Security migration, invite + password reset fixes, test suite | 2026-11-05 |
