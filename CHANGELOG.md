# Changelog

## 2026-10-13

- Resumed local GPT-6 Luna research after the user reported the quota reset. Confirmed 100 worthwhile things to do per major city, not 100 upcoming events; data/source quality precedes the final design and performance pass, and road-trip planning is deferred.
- Fixed timeline filtering for scheduled start/end ranges without explicit date lists. Smoke verification now includes an ongoing exhibition during its range and excludes dates before and after it; added boundary, explicit-date, and weekday regression coverage.
- Clarified private image staging, actual byte/hash/dimension verification, address-geocoder provenance, map-center versus destination distinction, and independently complete candidates. Unknown image rights do not block publishing factual records with owned fallback artwork; new researched images remain private.

## 2026-10-12

- Replaced the JavaScript discovery/publication pipeline with a manually invoked OMP GPT-6 Luna skill. Removed automated research, scheduling, LaunchAgent management, and automatic Git publication; the user decides invocation and publish. Offline catalog validation remains active. Documented full inventory, evidence/outcomes, geography, rights, and failure preservation.
- Hid discovery behind an accessible hamburger with preserved filters and committed focus handling. Selected cards retain one activity sentence, readable time/cost/company facts, a website link, and optional source information.
- Added tested source-boundary, polygon-hole, locator fallback, start-first route, and directed-connection behavior. Ground-aligned locators remain visible from browsing zooms; native outline discovery skips unchanged settled views and already-resolved missions.
- Removed raw catalog imports from client code and projected only website fields on the server. Memoized normalized search; added immutable archive caching with verified HTTP byte ranges. Final production smoke measured 1,114,403 HTML bytes (127,433 calculated gzip bytes), without raw coordinate provenance or archive IDs.
- Replaced quota padding with complete-candidate gates and broad human-experience discovery. Published 785 records; retained 860 incomplete leads separately, including 94 whose API evidence was incorrectly used as a visitor website. Validation now requires a human-facing HTTPS website distinct from API source evidence. Expansion and coastal gaps remain paused for design review; Luna workers returned `usage_limit_reached`.
- Required every discovery/refresh run to privately stage suitable missing-image candidates with provenance, including unclear-rights candidates, without adding them to the website before user review. Documented reusable city discovery, agent rules, setup, and handoff.
- Verified production desktop/mobile surfaces, source-backed museum highlight and loaded photo, search/source synchronization, archive HTTP 206 caching, strict TypeScript, lint, optimized build, and 39 passing tests.
