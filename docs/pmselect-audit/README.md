# PMSELECT CARS audit and verification

Source: `branding/pmselect-cars` at `b043976`. Changes are on a separate branch; PR #2 remains untouched. This is a reviewable development change, not approval for production deployment.

## Findings and fixes

- Navigation previously combined two local Boolean modes with parent section state. Recent commits made the class conditions exclusive, but did not remove competing owners. The observer selected from only its latest callback entries and used a fixed 950 ms wall-clock lock. `useShowroomNavigation` now owns one mode. Search and favorites are derived from it. A single animation-frame scroll measurement synchronizes sections; a requested target remains authoritative until reached or interrupted by wheel, touch movement, or keyboard scrolling. Pending navigation frames are cancelled on a subsequent selection and on cleanup. No observer or navigation timeout remains.
- Programmatic scrolling respects reduced motion and clamps its destination to actual document limits. Browser verification caught and corrected a boundary condition when navigating upward from the bottom of the document.
- Gallery images were keyed and replaced immediately; an opacity animation could begin before network loading/decoding, leaving a blank image. The gallery now decodes replacements, retains the previous image underneath the 260 ms fade, rejects stale decode completions, and preloads the two neighboring images. A failed replacement retains the last image and shows an accessible status message. Lightbox, swipe handlers, thumbnails, keyboard controls, and focus restoration remain available.
- The collection was mounted inside a hidden container during the intro. It now mounts on entry, avoiding premature collection media elements. The fixture verifies zero card elements before entry and twelve afterward. No claim is made that all filtering/array construction is deferred.
- Repeated, contradictory mobile card rules and ineffective typography overrides were consolidated. Titles use two lines and consistent height while the button retains the full accessible vehicle name. Manrope was already the sole Google Fonts family in the base branch's `_document.js`; that configuration is retained. One font variable supplies both legacy font aliases.
- Old watermark elements and duplicate header/footer marks had already been removed in the base branch. Empty watermark spacing is now removed, and the redundant per-card backdrop blur is removed. The existing compact, 480 px maximum app layout is preserved at desktop widths.
- Read-only, field-masked Firestore GETs established that `lot/daily.logoImage` was absent/empty and `settings/branding.logoImage` was configured. The latter's image was downloaded and visually inspected: it contains the PM Select Automotive artwork shown in the request. An unchanged copy is included as `public/pmselect-logo.png`; configured logos retain priority. CSS frames the original padded canvas in the main intro branding area. No logo was generated. The original is about 1.8 MB; further asset compression is not represented as a measured improvement here.

## Data and administration

Firebase project `cars-d0f1d`, document paths/IDs, vehicle schemas, prices, descriptions, specifications, image URLs, Supabase storage, auth routes, and editing/upload handlers are unchanged. Existing public page loading includes an analytics write, so the real application was not opened for browser testing. Tests import the actual showroom and navigation hook into a standalone static fixture and block all external browser requests. Only read-only Firestore requests and an existing storage-image download were performed against client services. **No production data was modified.**

The `/#admin` entry point and admin code paths were inspected. The existing auth unit test checks fail-closed sessions, tampering, expiry, and cookie flags locally. Authenticated editing, uploads, categories, and settings were not exercised against production.

## Checks

- `npm ci` succeeded before implementation; test dependencies were subsequently installed and locked as development dependencies.
- `npm run build`: passed with Next.js 16.2.9, including compilation, type checking, static page generation, and API route build.
- `node --test tests/auth.test.mjs`: passed (one test).
- `npm run test:showroom`: Chromium fixture checks at 360, 375, 390, 430, 768, and 1440 px. Checks one active class and one `aria-current` item after rapid consecutive selections, selected state after smooth scrolling, manual scrolling to contacts, no horizontal overflow, long names, detail open/back, delayed decode retention, gallery next/previous, failed-image retention/status, lightbox Escape dismissal, and no page JavaScript errors. Reduced-motion animation suppression is checked separately.
- `git diff --check`: passed.

Run browser tests with an installed Chromium (`CHROMIUM_PATH` overrides `/usr/bin/chromium`). The script bundles the real components with esbuild, serves a loopback-only fixture, mocks vehicle images, and writes artifacts under ignored `work/showroom-qa/`. It does not start Next.js or contact Firebase/Supabase.

Screenshots here use synthetic vehicles and flat SVG image fixtures, not client inventory. They demonstrate layout and state, not production photography or a reference-site comparison.

## Limits and release status

- Emergent is outside this environment's enforced network allowlist. Its live visual behavior was not inspected, so no fidelity claim is made.
- Vercel's connected project read returned a 403 scope authorization error for `gyursels-projects`. No Vercel CLI was configured. Paused status and deployment logs could not be independently verified. No Vercel settings, pause state, deployment, or domain was changed.
- No real Android Chrome or iPhone Safari device test, WebKit test, field Core Web Vitals, Lighthouse baseline, network bandwidth benchmark, or production CPU/frame-rate comparison was performed. A successful build and fixture interaction checks do not establish production performance scores.
- Browser history/back gestures, authenticated admin end-to-end workflows, live catalog loading, dealership gallery paging, and production notification/upload integrations remain unverified.
- No merge or production deployment was performed. Review the PR and verify on authorized devices and an isolated deployment before production release.
