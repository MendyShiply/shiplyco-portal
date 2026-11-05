# ShiplyCo Portal — UX/UI Audit
**Date:** March 2026  
**Auditor:** Claude (Anthropic)  
**Scope:** Full portal — all roles, all 27 pages, navigation, modals, forms, data display  

---

## Overall Verdict

The portal is **functionally solid and visually coherent** for a warehouse management tool. The branding is consistent, the data density is appropriate for a desktop operations tool, and the role-based architecture is well thought out. The main issues fall into three categories: **navigation scale**, **no mobile support**, and **inconsistent internal patterns** that have accumulated across build sessions.

**Summary scores (1–10):**

| Area | Score | Notes |
|---|---|---|
| Visual consistency | 7/10 | Strong branding, but inline-style ratio is high |
| Navigation usability | 5/10 | 24 admin items, critical pages missing from sections |
| Form usability | 7/10 | Good placeholder coverage, modals work well |
| Feedback & states | 8/10 | Toast system is excellent, 76 uses |
| Information hierarchy | 7/10 | Stat cards overused, charts are basic |
| Accessibility | 2/10 | Zero ARIA attributes, 7px minimum font size |
| Mobile responsiveness | 1/10 | Zero media queries, fixed widths throughout |
| Empty states | 7/10 | 7 empty states exist, pattern is consistent |
| Destructive action safety | 6/10 | Only 3 confirm() dialogs for destructive actions |

---

## 🔴 Critical Issues (Fix These First)

### 1. New pages are invisible in the admin nav
**What's happening:** The `buildNav()` function groups nav items into sections (Overview, Finance, Operations, Inventory). When new pages were added — Reports, Leaderboard, My Tasks, All Orders, Pick Lists, SKU Master, Supplies, Shipping, Marketplaces, EDI, Cycle Counts, BOL, and Notifications — they were added to the nav item *list* but not to any *section group*. The nav renders by section, so any item not in a section silently disappears.

**Employee nav:** Shipping is in the nav list but not in any section — it will not appear for employees.

**Admin nav:** Reports, Leaderboard, My Tasks, All Orders, Pick Lists, SKU Master, Supplies, Shipping, Marketplaces, EDI, Cycle Counts, BOL, and Notifications are all missing from section definitions.

**Fix:** Add the missing IDs to the `sections` array inside `buildNav()`.

---

### 2. Zero media queries — the portal is completely unusable on mobile
**What's happening:** There are no `@media` breakpoints anywhere in the CSS. The nav is a fixed 208px sidebar. Tables have no horizontal scroll wrappers on mobile. The `.fg2`, `.fg3`, `.fg4` field grids do partially collapse (they have some responsive grid rules) but the overall layout does not.

**Impact:** A warehouse employee on a tablet or phone checking their tasks cannot use this portal at all. The sidebar would either overflow or collapse the content area.

**Fix priority:** Even if full mobile support isn't needed now, add at minimum:
- A breakpoint at ~900px that collapses the sidebar behind a hamburger
- A breakpoint at ~600px that stacks `.fg2`/`.fg3` to single column
- `overflow-x: auto` wrappers on all `<table>` elements

---

### 3. No ARIA attributes — screen reader inaccessible
**What's happening:** There are zero `aria-*` attributes in the entire portal. No `role="dialog"` on modals, no `aria-label` on icon-only buttons, no `aria-live` on the toast notification region, no `aria-current="page"` on the active nav item.

**Most impactful quick fixes:**
- Add `role="dialog"` and `aria-modal="true"` to modal divs
- Add `aria-label` to the print, edit, and icon-only action buttons
- Add `aria-live="polite"` to the toast container
- Add `aria-current="page"` to the active `.nv.on` nav item

---

## 🟠 Significant Issues (High Priority)

### 4. Admin nav has 24 items — cognitive overload
A sidebar with 24 items is too many to scan quickly. A warehouse manager under pressure should not have to read through 24 options to find what they need.

**Recommended restructure:**
- **Daily ops** (top): Today's Orders, My Tasks, Pick Lists, Inventory & Scan — these are used every day
- **Management** (middle): All Customers, Dashboard, Reports, Leaderboard
- **Catalog & Config** (lower): SKU Master, Supplies, Shipping, Marketplaces, EDI, Cycle Counts, BOL, Notifications
- **Finance** (bottom): Pricing, Billing, Invoices

Consider also: admin pages that employees never need (Customer Pricing, All Customers, Reports, Marketplaces) could be behind an "Admin" section that is visually distinct (different background color in the sidebar).

---

### 5. Font sizes go down to 7px — below readable threshold
The smallest font size in the portal is 7px. 9px appears frequently in labels, stat subtitles, and tag text. On a standard monitor, anything below 11px is straining for most people. On a laptop at arm's length, 9px text in a nav section label is nearly invisible.

**Findings by size:**
- 7px: Used in some tag/badge elements — unusable
- 8px: Appears in stat labels — borderline
- 9px: Used in nav section headers and some table headers — too small
- 10px–11px: Common in card labels — acceptable for supporting text only

**Fix:** Set a minimum of 11px for any rendered text. Nav section labels should be at least 10px. Body/table text should be 12–13px minimum.

---

### 6. Inline styles vs class ratio is 0.89 (nearly 1:1)
There are 1,004 inline `style=""` attributes and 1,122 `class=""` attributes — almost equal. This means most visual decisions are hardcoded into the HTML template strings rather than in CSS. 

**Why this matters:**
- If you want to change a color globally, you have to find and replace hundreds of inline style strings
- It makes future design changes extremely time-consuming
- It means the same visual pattern (e.g. a section header) is styled differently every time it appears

This is understandable given how the portal was built (JS template strings generating HTML), but it will become a maintenance problem as the portal grows. Ideally, recurring visual patterns should be converted to utility classes.

---

### 7. `confirm()` dialogs for destructive actions — only 3, but wrong pattern
There are only 3 uses of `confirm()` for destructive actions (disconnect marketplace, remove carrier account, remove SKU, remove BOL). There are many other destructive actions that have no confirmation at all — for example, deleting a cycle count or removing a BOL.

Beyond the coverage gap, `confirm()` is the wrong pattern. Browser-native confirm dialogs:
- Look jarring and out of place (don't match the portal's design)
- Cannot be styled
- Block the browser thread

**Better pattern:** Replace with a small inline confirmation that appears on the button itself — e.g. button text changes to "Are you sure?" with a red confirm and grey cancel. This is already partially done in some places (the act-btn pattern with two steps).

---

## 🟡 Moderate Issues (Polish Round)

### 8. Stat cards (59 of them) — overused pattern
The `<div class="stat">` card appears 59 times across the portal. Some pages have 4–5 stat cards even when the numbers they show aren't particularly meaningful at a glance. For example, the Twilio page shows no stats but the BOL page shows 4 even though BOLS starts empty.

When every page leads with stats, stats lose meaning. Reserve the stat card row for pages where the summary numbers are genuinely useful at a glance: Dashboard, Dispatch, Leaderboard, Reports, EDI, Inventory.

---

### 9. Tab switchers are inconsistently implemented
There are three separate tab systems in the portal (Shipping, EDI, Twilio) and they all use slightly different HTML/CSS patterns:
- Shipping tabs: `dtab` class with `on` state, stored in a flex row with border-radius:0
- EDI tabs: same `dtab` pattern but with different container styling
- Twilio tabs: same

The tabs themselves are consistent, but the *content rendered inside them* resets completely on tab switch — meaning anything a user typed in one tab is lost if they click another tab and come back. For example, if a user fills in the Rate Calculator in Shipping and then clicks to Carrier Accounts, their weight/dims are gone when they come back.

**Fix:** Store tab form state in JS variables on change, not just in DOM inputs.

---

### 10. Action buttons have three different visual systems
Looking at the buttons across the portal, there are three coexisting button systems:
- `.btn` and `.btn-red` — the main button style (correct, consistent)
- `.act-btn` with modifier classes (`.act-process`, etc.) — the inline table action style
- One-off `<button>` elements with raw inline styles — appear throughout newer pages

The newer pages (BOL, Cycle Counts, Reports, Twilio) more frequently use inline-styled buttons that don't match the `.act-btn` system. This makes the visual language feel inconsistent as you move deeper into the portal.

---

### 11. Charts in Reports are functional but primitive
The bar charts in the Reports page are pure CSS height percentages — no axes, no grid lines, no tooltips, no exact values shown on hover, no ability to click a bar to drill down. For an analytics page, this is the bare minimum.

The charts work and aren't broken — they just communicate very little beyond "November was high." A warehouse owner looking at these would immediately want to know: what made November high? Which customer drove it? Which order type?

**Recommended path when Supabase is live:** Integrate a lightweight chart library (Chart.js is already listed as available). The portal already imports it. Replace the CSS bars with proper Chart.js bar charts that show tooltips, hover states, and click-to-filter behavior.

---

### 12. Modal scroll behavior is inconsistent
Some modals have `max-height: 90vh; overflow-y: auto` (BOL, Count Sheet) and some do not. On a laptop with a small screen, a modal without height capping will go off-screen with no way to reach the save button.

The BOL modal is especially at risk — it is the longest modal in the portal (parties, addresses, carrier, multi-line freight table, additional fields, signature options) and on a 768px-height screen the bottom action buttons may be unreachable.

---

## 🟢 What's Working Well

### Navigation structure
The sidebar left-nav with section groupings is the right choice for this kind of tool. It scales better than a top nav for 15+ pages, it keeps context visible while working, and the `.nv.on` active state (red left border + red background) is clear and distinctive.

### Toast notification system
76 uses of `showToast()` across the portal — this is excellent feedback hygiene. Almost every action has a toast response, which makes the portal feel responsive even though it's all client-side. The toast pattern is consistent throughout.

### Branding consistency
The red (#e8241a) + black + Barlow Condensed combination is applied consistently everywhere — header, active nav, primary buttons, BOL print header, stat values, error tags. This is the strongest visual aspect of the portal.

### Role-based architecture
Customer seeing 8 pages, Employee seeing 15, Admin seeing 24 is a well-considered separation. Customers never see internal ops pages. Employees don't see financial configuration. The hierarchy makes sense.

### Empty states
7 pages have proper empty states with icons, explanatory copy, and a primary CTA button. This is good UX practice. The BOL, Cycle Counts, and Marketplace pages all handle the zero-state gracefully.

### Modal patterns
14 modals with consistent structure (header bar, body, sticky action footer with Cancel + Save) is a coherent pattern. The `.modal-bg` overlay + `.modal` inner div is used uniformly.

### Form field coverage
99 of 106 non-trivial inputs have placeholder text. Labels are on every input. The `.fg2`/`.fg3`/`.fg4` grid system keeps forms structured and readable.

---

## Summary: Recommended Fix Order

| Priority | Issue | Effort |
|---|---|---|
| 🔴 1 | Fix buildNav sections — new pages invisible | 30 mins |
| 🔴 2 | Add overflow-x:auto to all tables | 30 mins |
| 🔴 3 | Minimum 11px font size enforcement | 1 hour |
| 🟠 4 | Add Reports, BOL, Twilio, etc. to admin nav sections | 30 mins |
| 🟠 5 | Replace confirm() with inline confirmation buttons | 2 hours |
| 🟠 6 | Tab state persistence (store form values in JS vars) | 2 hours |
| 🟡 7 | Standardize button usage to btn/act-btn system | 2 hours |
| 🟡 8 | Add basic ARIA (role=dialog, aria-label on icon buttons) | 1 hour |
| 🟡 9 | Mobile sidebar collapse breakpoint | 3 hours |
| 🟢 10 | Upgrade Reports charts to Chart.js (post-Supabase) | 4 hours |
