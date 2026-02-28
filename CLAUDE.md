# TSEB Bedside Singing Manager

## What This Is

A mobile-first web app for TSEB (Threshold Singers East Bay), a volunteer bedside singing organization. Replaces a spreadsheet that tracked outreach to care facilities, active singing venues, and volunteer scheduling.

## Architecture

**Static front-end + Supabase backend. No build step, no framework, no bundler.**

- `index.html` — Single-page app, all CSS inline in `<style>`, vanilla JS
- `js/config.js` — Supabase URL + anon key (gitignored, not committed)
- `js/app.js` — All Supabase client logic: auth, CRUD, dynamic DOM rendering
- `sql/001_schema.sql` — Postgres schema (6 tables, RLS policies, indexes, triggers)
- `sql/002_seed_data.sql` — Migrated data from original spreadsheet
- `tseb-app.html` — Legacy static mockup, kept for reference only

## Key Design Decisions

- **No build tools** — Volunteers need to maintain this. Supabase CDN loaded via script tag.
- **Mobile-first CSS** — Base styles target phones. `@media(min-width:640px)` for tablet, `1024px` for desktop.
- **Volunteer trust model** — RLS allows all authenticated users full CRUD. No per-user permissions.
- **Magic link auth** — Volunteers enter their email and click a link to log in. No passwords.
- **First names only** for singers — Privacy preference of the organization.

## Database Tables

- `singers` — Volunteer roster (name, role, availability)
- `institutions` — Care facilities (hospitals, hospices, SNFs, etc.)
- `contacts` — People at institutions (name, title, phone, email)
- `activities` — Outreach activity log (calls, emails, visits)
- `gigs` — Scheduled singing sessions
- `gig_singers` — Which singers are assigned to which gigs (with anchor flag)

## Institution Status

Single `status` field (no separate pipeline_stage). Institutions flow through: `initial_contact` → `in_conversation` → `site_visit` → `active`

Side tracks: `on_hold`, `previous`, `inactive`

## Conventions

- All IDs are UUIDs
- Dates stored as `date` type (not timestamptz) for gig_date, activity_date, next_step_due
- Times stored as `time` type for gig_time
- Seed data uses deterministic UUIDs: singers `a0000001-...`, institutions `b0000001-...`
- HTML uses `data-singer-list` and `data-institution-list` attributes on `<select>` elements for dynamic population
- Form submissions use `FormData` via `name` attributes — every input must have a `name`
- Dynamic content rendered via `innerHTML` into container divs with specific IDs (e.g., `#dash-stats`, `#inst-list`, `#pipe-initial`)

## Common Tasks

### Add a new form field

1. Add the `<input>`/`<select>` with a `name` attribute to the modal in `index.html`
2. Read it via `fd.get('name')` in the corresponding `submit*()` function in `app.js`
3. If it maps to a new column, add the column in a new SQL migration file

### Add a new status value
1. Update the `CHECK` constraint on `institutions.status` in schema (new migration file)
2. Add option to status `<select>` dropdowns in both add and edit institution modals in `index.html`
3. If it's a pipeline stage, add a `<div class="pipeline-col">` with matching `id` in `index.html` and add the stage key to the `stages` object in `loadOutreach()` in `app.js`
4. Add the badge mapping in `statusBadge()` in `app.js`

### Restrict access to specific volunteers
Modify the RLS policies in `001_schema.sql` to check `auth.jwt() ->> 'email'` against a whitelist instead of just `auth.role() = 'authenticated'`.

## Do NOT

- Add a build step or bundler — this must stay zero-config
- Use localStorage — Supabase handles all persistence
- Store last names of singers — organizational policy
- Commit `js/config.js` with real credentials
