# PMSELECT CARS — Emergent visual and motion parity

## Scope / safeguards
- Work only on feat/emergent-motion-match, based on PR #7 head 5bb69b9.
- No main merge, production release, database writes, or admin data changes.
- Commit and push after each logical change. Keep this draft until visual checks pass.

## Completed
- Read PR #7 and existing navigation/gallery implementation.
- Inspected attached 70-second video: it alternates reference and current site; identify by address bar.
- Opened Emergent and PR #7 preview in browser; initial mobile comparison.
- Received and inspected original PM Select Automotive logo screenshot.

## Findings
- Reference uses serif display headings; current override forces Manrope everywhere.
- Reference spotlight has more top breathing room, 1.65 image ratio, clipped two-line description.
- Reference has a moving text ribbon, not merely a thin traveling border.
- Current navigation changes content immediately then flashes a 28% veil; needs coordinated exit/entry.
- Preserve original data and authentic logo; do not fabricate reference ratings or replace vehicle data.

## Remaining
- Inspect reference navigation, filtering, details, and animation timings.
- Implement matched typography, composition, motion and original logo.
- Build, functional tests, mobile browser checks and sequential evidence frames.
- Update draft with preview and verified limitations.

## Last successful commit
- Starting point: 5bb69b999aa9ba89f73339c1570117ca4455eabb (PR #7).
- This checkpoint commit is recorded in git history (avoid self-referential SHA).

## Tests
- npm ci successful; no implementation tests run yet.

## Next concrete step
Inspect reference computed styles and interactions, then implement coordinated navigation transition and moving ribbon.

## Implementation checkpoint
- Original supplied logo bundled without redraw; whitespace clipped in CSS.
- Reference Playfair Display / Plus Jakarta Sans bundled locally.
- Separate search/favourites/contact screens preserve existing controls and data.
- Cancellable 150ms exit / 500ms veil, 36s marquee, image/card/panel motion.
- npm run build PASS (Next 16.2.9).
- Last remotely successful commit: 0ba6b50834eb67ed0010e1a5e751050664710f3b.
- Git CLI push lacks credentials; checkpoints use authenticated GitHub commit/ref API.
- Draft PR: https://github.com/gyursel/cars/pull/8
- Vercel connector returns 403 for gyursels-projects; CLI unavailable. Use Git integration preview, do not alter permissions.
- Next: mobile preview visual/functional test, refine observed discrepancies.

## Mobile inspection / second checkpoint
- Confirmed original logo and Playfair font render in the deployed preview at 390×844.
- Confirmed 16 real vehicles render and search produces the expected empty state.
- Found fixed nav outside viewport (top 2407px) because the previous screen transform animation retained an identity matrix. Removed ancestor transform animation; use opacity only.
- Reference detail has full-width imagery and overlay controls; matched layout while keeping gallery, tabs and phone actions.
- Display-only vehicle title cleanup removes imported finance/listing suffix; full original title remains in tooltip/accessibility/admin. No data writes.
- Reference fallback spotlight uses BMW M5 when no explicit featured record exists; explicit admin featured selection still takes precedence.
- Last remote implementation commit: f051308e3b8eb2072c0aa97cebdefe159eb63411.
- Four auth/source-fetch unit tests PASS. Build PASS before second checkpoint.
- Next: verify corrected nav, gallery, filters, favourites, contact and admin login; save evidence.

## Verified preview 58f8b71 (390×844)
- Fixed navigation now at y772–832 (previously y2407 outside viewport); horizontal overflow 0.
- Correct original logo, reference fonts and BMW M5 fallback spotlight visible.
- Search "BMW M5" yields one matching vehicle; nonmatching search empty state works; clear restores all 16 vehicles.
- Pending fix preserves return-scroll on detail close and isolates favourites from unrelated search/category filters.
- Updated existing browser regression expectations for screen navigation and visible fixed nav. Browser suite not yet executed in this environment; manual connected-browser checks ongoing.
- Browser testing found inactive Home lost its accessible name when its label was hidden; added permanent aria-label.
- Preserved extra sorting/filter capabilities inside the collapsible filters to match the compact reference search.
- Existing upstream image failures now render a clear fallback rather than overflowing broken-image alt text.
- Gallery next image, spec tab, fullscreen open/close and return to favourites verified in browser.
- Shared transition provider added above screens so the fade survives opening/closing vehicle detail instead of disappearing with the old screen.

## Continuation — 2026-10-19, from 21dcfa0
- Read this log, AGENTS.md, PR #8 (still draft, base fix/pmselect-logo-asset), and the six latest branch commits. Continued the existing implementation.
- Opened the Emergent reference and exercised intro → collection → search → home. Measured the public shell at 428px, heading font at Playfair Display 700 30px/37.5px, card title at Playfair Display 600 15px/20.625px, and marquee at 36s linear. Existing typography/marquee match these measurements.
- Corrected public shell/detail/loading width from 480px to 428px; fixed navigation, detail actions and menu now fit the same shell. Admin styles/data unchanged.
- Corrected filter scope: Home uses category only; Search uses query and advanced filters across the full collection; Favourites uses saved IDs independently. Search values are retained when navigating away. Extracted pure display selection and added regression coverage, including combined filters and missing values.
- Extended the existing browser regression for saved-car isolation and removal while retaining the unsuccessful search. Browser launcher now supports an explicit executable, system Chromium, or standard Playwright installation.
- Validation: npm ci PASS; npm test PASS (6 tests); npm run build PASS; git diff --check PASS.
- Browser suite NOT verified: original runner failed because /usr/bin/chromium is absent. Playwright browser download returned invalid/truncated archives; system browser installation is unavailable here. No UI pass is inferred from unit/build results.
- Real Preview NOT verified in this continuation: PR bot reports both projects Ready, but cars-6lij branch Preview redirects this browser to Vercel login. Vercel API and authenticated web fetch both return 403 for team gyursels-projects (team_ru46461D9ucBRXJ3QZKK0qRB). No Vercel CLI is installed. Protection/permissions were not altered.
- No Firebase/Supabase writes, real admin saves, main merge or production release performed.

## Next concrete step (current)
Restore authorized Preview access for the connected Vercel account/team, then verify the new branch Preview at 390×844 and 428px: fade during rapid navigation/detail return, moving ribbon, category/search independence, favourites persistence, gallery/fullscreen, contact and admin login. Real admin checks must remain read-only. Run npm run test:browser with an installed Chromium; its service mocks block external requests and capture fixture admin saves without changing real data. Keep PR #8 draft until these checks and visual evidence pass.
