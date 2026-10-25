# Rides recommendation for the TSEB scheduling app

Current decision record: https://github.com/jhwright/TSEB/issues/12

The [scheduling app](https://jhwright.github.io/TSEB/) is a working prototype with sample data. It needs polishing and testing and could support scheduling and drivers. Use a member-editable rides document for immediate driver self-enrollment. If TSEB adopts the app and names a maintainer, develop rides there and keep one authoritative list.

## Evidence

- The published front end and singer/schedule modules return HTTP 200.
- Singer profiles support availability, preferred days, zip codes, and notes. Sessions support venues, dates, singers, and notes.
- There is no dedicated driver, seat, pickup, passenger-signup, or rehearsal-event workflow in these modules or the schema.
- `js/auth.js` bypasses sign-in. `sql/004_anon_access.sql` adds anonymous read/write policies. Actual deployed policies must be checked before member data is used.
- Supabase project `vezlljkdmgibkbszlgvl` was restored at Jeff’s request. The dashboard reported restoration complete. The health endpoint returns HTTP 200; zero-row queries succeed against singers, institutions, and gigs (30, 51, and 10 sample records respectively). The published app loads facilities and the schedule view; Jeff also confirms it works. No records were edited or reseeded.
- Hosting is GitHub Pages for the interface and Supabase/Postgres for data. Restoration establishes basic operation, not readiness for member use.

## If TSEB chooses the app

1. Name an organizational maintainer; polish and test the prototype and its sample-data workflows.
2. Restrict access to approved members and confirm the deployed data permissions.
3. Add rehearsal dates, driver offers with seat counts/general pickup areas, and passenger signup with coordinator correction.
4. Keep exact private addresses out of public views. Use manual coordination; automatic ride matching is deferred until a recurring need justifies it.
5. Keep the existing rides record until the chosen replacement is checked and adopted.

Visible failures should remain visible. Retain originals and corrections; the named coordinator repairs incorrect offers or assignments. The separately authorized backend restoration is complete. No ride features, new schedules, data edits, or permission changes were made. Further development and adoption require TSEB’s decision.
