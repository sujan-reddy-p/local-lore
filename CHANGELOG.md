# Changelog

## 2026-10-12

- Replaced the JavaScript discovery/publication pipeline with a manually invoked OMP GPT-6 Luna skill. Removed automated research, scheduling, LaunchAgent management, and automatic Git publication; the user decides invocation and publish. Offline catalog validation remains active. Documented full inventory, evidence/outcomes, geography, rights, and failure preservation.
- Hid discovery behind an accessible hamburger with preserved filters and committed focus handling. Selected cards retain one activity sentence, readable time/cost/company facts, a website link, and optional source information.
- Added tested source-boundary, polygon-hole, locator fallback, start-first route, and directed-connection behavior. Ground-aligned locators remain visible from browsing zooms; native outline discovery skips unchanged settled views and already-resolved missions.
- Removed raw catalog imports from client code and projected only website fields on the server. Memoized normalized search; added immutable archive caching with verified HTTP byte ranges. Final production smoke measured 1,114,403 HTML bytes (127,433 calculated gzip bytes), without raw coordinate provenance or archive IDs.
- Replaced quota padding with complete-candidate gates and broad human-experience discovery. Published 785 records; retained 860 incomplete leads separately, including 94 whose API evidence was incorrectly used as a visitor website. Validation now requires a human-facing HTTPS website distinct from API source evidence. Expansion and coastal gaps remain paused for design review; Luna workers returned `usage_limit_reached`.
- Required every discovery/refresh run to privately stage suitable missing-image candidates with provenance, including unclear-rights candidates, without adding them to the website before user review. Documented reusable city discovery, agent rules, setup, and handoff.
- Verified production desktop/mobile surfaces, source-backed museum highlight and loaded photo, search/source synchronization, archive HTTP 206 caching, strict TypeScript, lint, optimized build, and 39 passing tests.
