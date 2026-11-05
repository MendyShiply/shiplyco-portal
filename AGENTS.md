# Instructions for AI coding agents (Claude Code, Codex, etc.)

ShiplyCo portal: static site on GitHub Pages, Supabase backend. Read README.md first.

## Rules
- No build step. Plain `<script>` tags, everything global, load order set in index.html
  (`js/config.js` creates the Supabase client `sb` and must load first).
- Security lives in the database: `supabase/migrations/*.sql` (Row Level Security).
  Never rely on the `role` or `currentCustId` JS variables to protect data; they only
  decide what the UI shows. Any new table needs RLS enabled plus policies in a new
  migration file.
- Never put a secret key (service role, Groq, ElevenLabs, Anthropic) in browser code.
  Secrets go in Supabase edge functions (`supabase/functions/`) via `Deno.env`.
- Admin and customer views share code: hide admin-only UI with a role check, don't
  delete it.
- Prefer `data-*` attributes + `addEventListener` over inline `onclick="..."` strings
  with nested quotes (this caused most past breakages).
- Escape any user-entered text before putting it into innerHTML.

## Before every commit
    npm install          # first time only
    npx playwright install chromium   # first time only
    npm test             # must pass

`npm test` checks every JS file parses, then logs in as admin, employee and customer
against a fake Supabase and opens every page. Add a check to `tests/smoke.js` when you
fix a bug.
