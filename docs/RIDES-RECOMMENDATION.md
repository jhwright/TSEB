# Rides recommendation for the TSEB scheduling app

Current decision record: https://github.com/jhwright/TSEB/issues/12

Use a member-editable rides document for immediate rehearsal-driver self-enrollment. If TSEB adopts the scheduling app and names a maintainer, add rides there and keep one authoritative list.

## Evidence

- The published front end and singer/schedule modules return HTTP 200.
- Singer profiles support availability, preferred days, zip codes, and notes. Sessions support venues, dates, singers, and notes.
- There is no dedicated driver, seat, pickup, passenger-signup, or rehearsal-event workflow in these modules or the schema.
- `js/auth.js` bypasses sign-in. `sql/004_anon_access.sql` adds anonymous read/write policies. Actual deployed policies must be checked before member data is used.
- The configured backend health endpoint did not resolve during the read-only check. This does not establish whether the project is paused, removed, or otherwise unavailable.

## If TSEB chooses the app

1. Name an organizational maintainer and restore normal backend service.
2. Restrict access to approved members and confirm the deployed data permissions.
3. Add rehearsal dates, driver offers with seat counts/general pickup areas, and passenger signup with coordinator correction.
4. Keep exact private addresses out of public views. Use manual coordination; automatic ride matching is deferred until a recurring need justifies it.
5. Keep the existing rides record until the chosen replacement is checked and adopted.

Visible failures should remain visible. Retain originals and corrections; the named coordinator repairs incorrect offers or assignments. No app activation, database change, schedule, or ride feature is authorized by this recommendation alone.
