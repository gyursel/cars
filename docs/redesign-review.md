# APEX redesign — review and deployment notes

Branch: `redesign/apex-cinematic`. Do not merge/deploy to production until the checks below pass.

## Architecture and actual changes

The original application is a Next.js Pages Router app, predominantly `pages/index.js`. Firestore `lot/daily` remains the published collection; `cars` remains the reusable admin catalog; Supabase `vehicles` remains media storage. Existing data was not reset or migrated. No live database writes or uploads were performed during development.

- Replaced the baked-in PM SELECT hero and gold cards with responsive APEX editorial presentation, real inventory imagery, red actions, serif headlines, mobile navigation and shared design tokens.
- Added search, category/fuel/gearbox/price/year/mileage filters and sorting, honest error/empty states, loading placeholders, and no fabricated fallback inventory or zero-price claims.
- Added vehicle tabs, thumbnail selection, swipe navigation and keyboard-accessible modal gallery. Reduced motion is respected.
- Preserved existing car/category editing, reusable catalog, photo uploads, cover selection, gallery and password editing. Added visibility/featured flags, image reordering, draft preview, unsaved-change warning, sticky save feedback and server validation.
- Catalog + collection writes now use a single atomic Firestore batch. Unknown existing fields are retained. Hiding a car is presentation-only; it is not private storage.
- Removed public client password lookup and insecure default password/session signing key. Login uses HttpOnly cookies. New server-only Firebase Admin SDK preserves Firestore's role while permitting restrictive database rules. Upload signing uses a server-only Supabase role key.
- Legacy `settings/branding` remains a fallback; new image/logo choices are saved with the existing lot. Removed the DOM mutation observer from the app.

## Required server configuration (never NEXT_PUBLIC)

- `SESSION_SECRET`: random secret, at least 32 characters.
- `ADMIN_PASSWORD`: initial login password. Legacy plaintext passwords are intentionally not accepted; after the first password change, the stored scrypt hash is used instead.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: service account JSON for the existing `cars-d0f1d` project, with Firestore read/write access.
- `SUPABASE_SERVICE_ROLE_KEY`: existing Supabase project's server role key, used only to issue signed upload tokens.
- Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` unchanged.

The added Firebase Admin dependency is required to stop privileged writes depending on anonymous browser permissions. No backend replacement is involved.

## Security rollout gate

Actual Firestore rules and Supabase policies are not tracked in this repository and were not changed. A cookie on this app cannot protect direct requests to an openly writable database. Before launch, review/apply restrictive policies in a staging environment, then coordinate production rollout:

1. Deny browser reads/writes to `settings/admin`; deny anonymous writes to `lot`, `cars` and branding. Preserve intended public reads of collection/branding. Admin SDK bypasses rules using the scoped service account.
2. Deny anonymous direct Storage uploads/updates/deletes to `vehicles`; preserve public image reads. Signed upload tokens are issued after session validation. Enforce allowed MIME types and 20 MB maximum in the bucket itself (request metadata is not proof of actual file type/size).
3. Review legacy statistics/subscription rules separately so existing metrics/notifications remain functional. Unrelated legacy notification/import endpoints are not represented as hardened by this redesign.
4. Remove legacy plaintext `settings/admin.password` during an authenticated password change. Rotate `SESSION_SECRET` when revoking all sessions. Password changes currently do not revoke already issued sessions.
5. Login throttling is per process, not a distributed rate limiter. Add platform-level rate limiting before production.

No policies, secrets, passwords or live records were changed as part of this branch.

## Verification

`npm run build` passed with all 11 API/page routes compiled. `node --test tests/auth.test.mjs` passed (session validation, tamper rejection, expiry, HttpOnly/SameSite flags). `git diff --check` passed. Local HTTP smoke requests also could not reach the server despite its Ready log, so runtime API status checks are unverified. Browser previews in this environment cannot reach the development container (`ERR_CONNECTION_REFUSED`), so screenshots and viewport testing are outstanding. Live admin write/upload tests require configured staging credentials and have not been claimed as passing.

Review at 375, 390, 430, 768 and desktop widths. Confirm no overflow; keyboard focus, tabs and Escape lightbox behavior; filter/sort results; card → details → back; image fallback/error handling; actual Cyrillic fonts; and reduced motion. In staging verify login, create/edit/delete, cover/reorder, visibility, preview, upload failures, save failures, password change and logout. Verify reload persistence and that denied anonymous backend writes really fail.

Run `npm ci`, `npm run build`, `npm start`. Admin entry: `/#admin` or the administration link. Use a Vercel preview for review. Production remains unchanged until separately reviewed and approved.
