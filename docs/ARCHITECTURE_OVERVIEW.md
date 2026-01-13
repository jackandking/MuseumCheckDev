# MuseumCheck — High Level Architecture Overview

**Scope**: High-level architecture for the MuseumCheck single-page application (SPA). Focuses on public interfaces, major flows, data contracts, observable failure modes, and testing / operational guidance.

**Diagram**

```mermaid src="./diagrams/museumcheck_architecture.mmd" alt="MuseumCheck high-level architecture"```

## Components

- **Web Client (SPA)**: `index.html`, `script.js`, `style.css` — browser-run UI that renders museum cards, modals, checklists, and controls age selection.
- **Museum Data (current)**: `museums-meta.js` for lightweight homepage listing, plus per-museum static JSON files under `/museums/{id}.json` for verified content; dynamic Tier 2 (KV store) can override when available.
- **Local Persistence**: Browser `localStorage` (keys: `visitedMuseums`, `museumChecklists`) used for all runtime state and progress.
- **Optional Tier-2 (KV) / Letmetry API**: remote KV store & Letmetry endpoints used in some flows (dev/debug) for sharing or backup. Requires composite keys (`key` + `sortKey`).
- **Image Sources**: Wikimedia Commons preferred; fallback via Bing helper or image proxy helpers (`image-proxy-helper.js`).
- **Testing & CI**: Jest + jsdom tests under `tests/` and Playwright config for E2E; `package.json` scripts run unit and data-quality tests.
- **Hosting / Deployment**: Static hosting on GitHub Pages (production: `jackandking.github.io/MuseumCheck/`, CNAME: `museumcheck.cn`).

## Public Interfaces / Contracts

- Browser ↔ Static Host: GET requests for `index.html`, `script.js`, `style.css`, `museums-meta.js`, and `/museums/{id}.json` (200 OK expected for assets).
- Browser ↔ localStorage: keys and shapes:

  - `visitedMuseums`: JSON array of museum IDs, e.g. `["forbidden-city","national-museum"]`.
  - `museumChecklists`: JSON object mapping checklist keys to arrays, e.g. `{ "forbidden-city-parent-7-12": [0,2], "forbidden-city-child-7-12": [1] }`.

- Browser ↔ Letmetry KV (optional): HTTP POST/GET to `/mysql/query`, `/file/upload`, `/museum/search`, and KV endpoints. For KV save/load, both `key` and `sortKey` are required. DDL operations must be whitelisted.

Why it matters: These are the only external contracts; tests and migration plans should validate them explicitly.

## Key Data Flows (Ingress → Egress)

 1. User Visit & Checklists
    - Browser loads SPA → `museums-meta.js` populates listing → user opens museum modal → loader fetches Tier 2 (KV) then Tier 1 (`/museums/{id}.json`) → user checks items → client updates `museumChecklists` in `localStorage` → UI updates progress counter.

2. Mark Museum Visited
   - User toggles museum visit on card → client updates `visitedMuseums` (localStorage) → progress percentage recalculated and shown.

3. Optional Remote Sync / Tier-2
   - Client posts data to KV (POST body contains `{ key, sortKey, value }`) → remote returns success → later loads via GET `?key=...&sortKey=...`.

## Grouped Failure Modes (Observable at boundaries)

- Asset 404/500 (Static host): SPA fails to load or has missing JS/CSS → visible error, no fallback. Mitigation: health-check CI and SRI for critical assets.
- `localStorage` unavailable or quota exceeded (incognito, browser limits): progress lost/failed writes. Mitigation: detect failures, prompt user to export or retry.
- JSON parse errors on static data (`museums-meta.js` or `/museums/{id}.json`): UI crashes. Mitigation: defensive parsing and fail-safe UI to show a meaningful error and recovery path.
- KV/Letmetry failures (missing `sortKey`, 4xx/5xx, network errors): remote sync fails — must not block local saves. Mitigation: local-first writes, exponential retry, circuit breaker, and clear error UX.
- Duplicate museum IDs/names in metadata or static JSON: UI confusion (search, counters wrong). Mitigation: run data-quality tests (`npm run validate-data`) and block PRs on duplicates.
- Image load failures / broken URLs: thumbnails broken. Mitigation: `image-fallback-config.js` and proxy helpers to surface placeholders.

## SLIs / SLOs (Suggested)

- Page Load (First Contentful Paint): SLO 99% < 1s on broadband.
- Asset Serve Success: SLI 99.9% of `script.js`, `index.html`, `style.css` return 200.
- Local Persistence Availability: 99.9% successful read/write to `localStorage` in normal browser contexts (non-incognito).
- Test Suite Stability: CI run with Jest should pass with 100% of core/regression tests.

Why it matters: These SLOs are focused on user-observable behavior for a static, mobile-first SPA.

## Testing & Validation Strategy

- Unit/regression tests (Jest + jsdom) for core logic: checklist save/load, progress calc, KV request formation (must include `sortKey`).
- Data-quality tests: detect duplicate `id` or `name` in `museums-meta.js` and static museum files; fail CI until resolved.
- Manual validation matrix (documented in repository): local dev server `python3 -m http.server 8000` and manual scenarios for checklists and persistence.
- E2E: lightweight Playwright scenario to open homepage, open a museum modal, toggle checklist items, refresh, and verify persistence.

## Security & Privacy Notes

- No server-side user data collection (localStorage only) by default — reduces PII concerns but requires clear user communication about persistence being local.
- Letmetry or remote KV usage requires secure credentials; DDL/DDL-like operations must be whitelisted and audited.

## Deployment & Release

- Static deploy via GitHub Pages. No build step required for production changes; CI should run tests and data quality checks before merge.

## Recommendations / Next Steps

1. Enforce data-quality tests in CI to prevent duplicate IDs/names.
2. Harden localStorage error handling and provide an export/import fallback for user data.
3. Add a small sync-status UI when Tier-2 sync is enabled so users know remote backup state.
4. Document the exact `localStorage` schema in `README.md` and tests to lock the contract.

## Information Requested (TBD)

- Confirm desired production SLIs/SLOs and alerting thresholds.
- Should Tier-2 KV sync be enabled by default or only in opt-in developer builds?
- Any constraints on image hosting / allowed licenses beyond the Wikimedia-first guidance?

---
<small>Generated with GitHub Copilot as directed by {USER_NAME_PLACEHOLDER}</small>
