# Follow-up: original vehicle media on mobile

Three original Supabase photographs and their read-only render variants were fetched and decoded for dimension inspection. Vehicle URLs and records were not changed; no uploads were performed.

| Sample | Original bytes / pixels | Card bytes / pixels | Gallery bytes / pixels |
| --- | --- | --- | --- |
| A | 398,819 / 1600×1200 | 33,780 / 480×360 | 124,111 / 960×720 |
| B | 4,557,443 / 5712×4284 | 34,276 / 480×360 | 117,469 / 960×720 |
| C | 3,502,280 / 2624×3024 | 62,611 / 480×553 | 238,030 / 960×1106 |

Sample B reduces transferred bytes by 99.25% for a card. Its approximate 4-byte-per-pixel decoded buffer falls from 93.35 MiB to 0.66 MiB. This is an image-size calculation, not a browser memory measurement or a measured frame-rate result. Aggregate response bytes for these three card images fall from 8,458,542 to 130,667 (98.46%).

The actual component now requests existing Supabase public image render variants at width 480 for cards, 960 for spotlight/detail/preload, 160 for thumbnails, and 1920 for full-screen viewing. It uses quality 75 and `resize=contain`, preserving aspect ratio. Original database URLs remain the source of truth. Failed transformed images fall back to their original URL. Gallery decode failures retain the previous visible photograph, and stale completions remain cancelled.

The inspected lot has 16 visible vehicles: seven primary-image URLs on the existing Supabase host and nine on `mobistatic*.focus.bg`. Only the known Supabase public-object path is transformed. Other hosts, signed/private URLs, data URLs and local assets are passed through. The nine external-host primary images could not be downloaded under the environment allowlist and are not claimed as optimized.

Validation: production build passed; existing authentication test plus two media tests passed; Chromium fixture at 360/375/390/430/768/1440 px and reduced motion passed again. The media regression tests cover preserving version parameters and unrelated/private URLs, derivative failure falling back to the original, and total image failure propagating correctly. Synthetic browser tests do not benchmark the real photographs.

The PR's Vercel bot comment identifies the preview at `https://cars-git-fix-pmselect-mobile-audit-gyursels-projects.vercel.app`. PR #4 is the GitHub review page, not the application itself. Emergent access was retried and still received an HTTP 403 from the environment proxy; its hostname is still absent from the enforced allowlist. No live side-by-side comparison, physical device measurement, or claim of matching Emergent's motion is made.
