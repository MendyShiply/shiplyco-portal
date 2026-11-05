# Instructions for AI coding agents (Claude Code, Codex, etc.)

ShiplyCo portal: static site on GitHub Pages, Supabase backend. Two agents (Claude Code
and Codex) work on this repo, so the coordination rules below are mandatory.

## 1. Coordinate through WORKBOARD.md (every task, no exceptions)
1. `git pull` first.
2. Read `WORKBOARD.md`. Never edit a folder or file someone else has claimed.
3. Add a row claiming the exact folders you will touch, then commit and push the claim
   **before** you start (`git commit -m "Claim features/orders"` + `git push`).
4. Do the work. Run `npm test`. Commit and push.
5. Remove your row, add a line under "Recently finished", commit and push.
If `git push` is rejected, someone else pushed: `git pull --rebase`, re-read the
workboard, and stop if your folders are now claimed by the other agent.
Keep claims small: one feature folder is ideal. `core/`, `shared/`, `index.html`,
`styles/` and `supabase/` affect everything, so claim them only when you must.

## 2. One folder per feature
```
core/config.js            Supabase client (sb), rates, NAV menu per role
core/auth.js              login, set-password screen, nav builder, page router (showPage)
shared/inventory-grid.js  inventory table component used by several features
features/<name>/<name>.js all code for one feature
features/<name>/README.md which pages, roles and tables the feature uses
styles/main.css           shared styles
supabase/migrations/      database security (RLS) — SQL, run in Supabase
supabase/functions/       server-side code (invite-user, ...)
```
* A change to one feature should only touch `features/<name>/`. If you need something
  from another feature, call its function; don't copy it.
* New feature: create `features/<name>/<name>.js` + `README.md`, add one `<script>` tag in
  `index.html` (after core/shared), add the page to `fns` in `core/auth.js` and to `NAV`
  in `core/config.js`.
* No build step: plain `<script>` tags, all functions global. **Never define the same
  function name in two files**; the later file silently wins and edits to the other copy
  do nothing.

## 3. Security
* Data is protected by Row Level Security in `supabase/migrations/`. The `role` and
  `currentCustId` JS variables only control what the UI shows. Any new table needs RLS
  enabled and policies in a new migration file.
* Never put a secret key (service role, Groq, ElevenLabs, Twilio) in browser code.
  Secrets live in Supabase edge functions via `Deno.env`.
* Escape user-entered text before putting it in innerHTML.
* Admin and customer views share code: hide admin-only UI with a role check, don't delete it.
* Prefer `data-*` attributes + `addEventListener` over inline `onclick="..."` strings.

## 4. Before every commit
    npm install && npx playwright install chromium   # first time only
    npm test                                          # must pass

`npm test` checks every JS file parses, then logs in as admin, employee and customer
against a fake Supabase and opens every page. Add a check to `tests/smoke.js` when you
fix a bug. Pages in `KNOWN_BROKEN` in `tests/smoke.js` are pre-existing bugs to fix.
