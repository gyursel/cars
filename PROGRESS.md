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
