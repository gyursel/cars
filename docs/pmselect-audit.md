# PMSELECT CARS audit and repair

Audit date: 19 October 2026. Base: `branding/pmselect-cars` at `b043976` (PR #2). This PR targets that branch, so the diff contains only the repairs on top of the existing branding work.

## Architecture and constraints

The application uses Next.js 16.2.9 Pages Router and React 19.2.4. `pages/index.js` owns public/admin screens, data loading and editing. `components/Showroom.js` renders the collection and details. `styles/apex.css` supplies shared styling; the subsequently imported `mobile-showroom.css` supplies the existing narrow, app-shaped composition, including desktop. That composition is retained.

Firebase project `cars-d0f1d`, Firestore paths, document IDs, schemas, Supabase project/bucket, vehicle records and image URLs are unchanged. Admin save/upload APIs and upload behavior are unchanged. Diagnostic/import reads now require the existing admin session. No production deployment, unpause, merge, database write or storage mutation was performed.

Read-only REST GETs inspected `lot/daily` and `settings/branding`. The lot has no nonempty logo override; branding has a Supabase logo. The image was downloaded and visually checked: it contains the PM Select Automotive wordmark matching the supplied reference's lettering. The existing remote logo and its precedence remain intact. The exact cropped chat attachment is not present as a standalone image file; no replacement logo was drawn or substituted.

## Root causes and fixes

### Navigation

The previous screen split selection between parent `activeNav`, search visibility and favorites visibility. Its IntersectionObserver chose only among entries in each callback, rather than a complete section snapshot. Observers could attach while the collection was hidden. A 950 ms deadline suppressed updates independently of actual scroll completion. Two related timeout paths tried to wait for DOM changes.

`useShowroomNavigation` now owns a single selection object. Every bottom item derives its class and `aria-current` from its one key. Search/favorites are explicit modes, rather than independently toggled flags. Repeated taps remain deterministic. Menu links to inventory/services also map to one valid bottom indicator. Navigation scrolls after React commits the relevant DOM. Scroll synchronization runs at most once per animation frame, only while the collection is visible, and returns the same state object when selection is unchanged. A settling loop replaces the wall-clock lock; touch, wheel and navigation keys interrupt it. No IntersectionObserver or navigation timeout remains. Reduced motion uses immediate scrolling.

Public detail entry now saves collection position/focus and adds a history entry. Back/Forward and the in-app return button restore the screen; returning restores the originating card's focus without scrolling it again. Admin preview still returns to its editor. Changing an already loaded URL to `#admin` now opens login, fixing the prior mount-only hash handling.

### Galleries and rendering

Previously a keyed `<img>` immediately replaced the displayed image and merely faded the new node. Slow decoding could therefore expose the background, and dealership galleries remounted their entire frame on every selection.

`GalleryImage` retains the decoded frame until the requested image loads and decodes. It crossfades with opacity over 260 ms. Cleanup rejects stale asynchronous completions. A failed image preserves the previous photo and adds an accessible message. The component is shared by details, fullscreen and dealership galleries. The dealership frame reserves a 4:3 area, avoiding image-height jumps. Detail galleries preload only their two neighboring photos. Image lists are memoized; thumbnails decode asynchronously. Vertical scrolling no longer accidentally triggers horizontal swipes, and touch cancellation resets tracking.

Collection/detail entry uses a 240 ms opacity/transform animation. Reduced motion disables these effects. No animation library was added.

### Typography, branding and paint costs

Multiple competing card title/price/specification overrides were removed from both stylesheets. There is now one card hierarchy with two-line title clamping, consistent line heights and full accessible names; title attributes expose complete text on hover. The existing Manrope family is now hosted locally as variable WOFF2 subsets (57,008 bytes total for Latin, extended Latin, Cyrillic and extended Cyrillic), with its OFL license. Google Fonts stylesheet/preconnect requests were removed. `font-display: swap` remains.

Unused watermark CSS was removed. Existing absent watermark/duplicate-logo markup remains absent. Import/default dealership naming now uses PMSELECT CARS; an obsolete restaurant notification sentence was corrected. Existing Firestore branding is never overwritten.

Persistent blur layers on the app header, menu, bottom navigation, save controls and detail action were removed; their dark surfaces retain the design's contrast. Repeated card reveal animations and the approximate `content-visibility` placeholder sizing were removed. Hidden collection imagery uses lazy/low priority loading; the visible spotlight becomes high priority when entered. Vehicle URL strings are preserved.

### Backend diagnostic/import fetch protection

Source review found a public diagnostic URL fetch and a public import scrape. Both routes now require the existing authenticated admin session. Their shared fetch helper only accepts HTTPS on `pmselect.mobile.bg`, rejects credentials/custom ports and validates every redirect before sending it. Redirects are bounded and requests have a 15-second timeout. Existing HTML byte/charset decoding and browser user-agent are preserved. The admin import button continues to send its same-origin session cookie. Tests exercise these protections with mocked fetches only.

## Executed validation

- `npm ci` succeeded.
- Production `npm run build` succeeded.
- `npm test` passed four tests: the existing session/tampering/expiry check, rejection of unsafe source URLs/redirects, same-host redirect/byte preservation, and unauthenticated endpoint rejection before network access.
- `npm run test:browser` runs Chromium against temporary fixture routes, importing the actual UI and a copy of the actual Home source with only service imports replaced by test adapters. All non-local browser requests are blocked. Admin login/save HTTP responses are mocked; storage operations are disabled. Fixture routes are removed in `finally` and excluded from Git.
- Widths 360, 375, 390, 430, 768 and 1440: rapid tap sequences, exactly one selected item, `aria-current`, contact selection, manual scrolling back, long Latin/Cyrillic title clamping and no horizontal document overflow passed.
- Slow gallery loading, newer request winning over an older slow request, failed-image preservation, fullscreen arrow keys, Escape/focus return, detail return, reduced motion and empty search results passed.
- Real Home source with mocked services: browser Back/Forward, detail return, `#admin` after load, login and vehicle edit/save passed. The saved mock payload retained the original catalog ID and gallery URLs.
- No uncaught browser page errors occurred.

Representative screenshots use synthetic listings, not client records:

- [390 px collection](pmselect-evidence/showroom-390.png)
- [1440 px collection](pmselect-evidence/showroom-1440.png)

The six-width development-browser run sampled next-frame selection feedback at up to 41.7 ms on this shared execution host. A subsequent focused 390 px/Home run sampled 33.0 ms. These are automated event-to-next-frame samples, not physical-device latency, INP, or a before/after speed comparison. No production Lighthouse/Core Web Vitals measurement is claimed. The structural improvements above are established from the code and fixture tests.

## Remaining limits and findings

- The Emergent host is blocked by the execution environment's network policy (CONNECT 403). Its actual animations, timings and performance could not be observed.
- Vercel project inspection returned 403 for the `gyursels-projects` team. The Vercel CLI is not installed and no Vercel credentials were configured for this environment. Pause state, project settings, deployment logs and preview behavior could not be independently verified. No Vercel mutation was attempted.
- No physical Android/iPhone or Safari/WebKit test was performed. Slow-image behavior was simulated; a complete low-end CPU/network performance profile was not measured.
- Admin editing/save behavior was tested with mocks, not production authentication credentials or real writes. Real upload, import, password change and push delivery were not exercised.
- Source images remain unoptimized by the existing Next configuration. The configured logo download is approximately 1.8 MB. Asset compression should be reviewed separately with the approved originals; this PR does not alter stored assets or URLs.
- The manifest's pre-existing restaurant-style `icon.svg` remains an unrelated branding artifact. A properly sized original logo/icon asset is needed to replace it without inventing a logo.
- Backend changes were verified with mocked network responses. Live Mobile.bg import availability was not tested; the source host is outside the environment network allowlist.
