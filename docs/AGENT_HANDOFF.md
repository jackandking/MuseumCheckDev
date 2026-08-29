# MuseumCheck Agent Handoff

This document preserves project-specific knowledge from prior Codex sessions. Read it before continuing product, deployment, data, or outreach work.

## Product direction

- The mission is to help families turn a real museum visit into shared parent-child exploration. The product is not primarily an AI itinerary generator.
- The primary value signal is the on-site path: `checkin_open -> task_open -> first_task_complete`, followed by a second task or helpful feedback when available.
- Do not optimize page views, time-on-page, or feature count when they conflict with a child actually noticing, discussing, or completing a small task.
- Museum facts, exhibit identity, images, and availability must remain traceable and reviewable. Adaptive wording or questions must not silently invent facts.
- Prefer one small reversible experiment backed by visit data over a broad new feature.

## Current product evidence and likely next experiment

- The anonymous visit signal store is `museumcheck-visit-signals`; the general event store is `museumcheck-events`.
- The recurring pulse should inspect `checkin_open`, `task_open`, `first_task_complete`, task depth, `checkin_exit_incomplete`, and `visit_feedback`. Treat `page_view` as distribution context only.
- Recent evidence showed many task openings and incomplete exits but very few first-task completions, with no `visit_feedback`. The current hypothesis is first-task friction, especially when the first step is perceived as requiring a photo.
- The smallest candidate experiment is to make the first task observation/confirmation path primary and photo capture optional. Relevant UI and signal code is in `museum-checkin.html` and `js/museum-checkin.js`; validate the funnel before and after.
- Existing first-task copy and analytics work already exists. Check current signals and diffs before proposing another onboarding rewrite.

## Museum data and cache lessons

- Homepage listing comes from `data/museums-meta.json`, generated into `js/museums-meta.js`; detailed museum data is loaded from the KV store by `js/museum-data-loader.js`.
- When adding a museum, update the source data, regenerate the generated metadata, verify the homepage search, and verify the deployed metadata—not only the local file.
- A museum can exist in the deployed metadata yet be absent in a user's search because the homepage cache uses `museumsMeta:v1` and the script URL was not versioned. When a newly added museum is missing only for some users, first suspect stale browser/script cache. A durable fix is to version or otherwise cache-bust the metadata asset and update the cache key deliberately.
- “上海科技馆” and “上海自然博物馆” are distinct records. Do not infer one from the other; search the exact name and inspect the metadata ID.

## Verification and deployment

- Read `docs/architecture/PROJECT_CHARTER.md` before product or autonomous-improvement decisions.
- Never use SSH in this repository. Production deploys through the existing GitHub Actions workflows on the `prod` branch.
- Verify with the relevant Jest tests, `npm run verify:pages:simple`, `npm run test:data-quality`, `npm run verify:docs-location`, and `npm run verify:docs-content` as applicable.
- Confirm deployment through `https://museumcheck.cn/debug/status/status.json`; the reported commit must match the pushed commit. Also perform a production smoke test for user-facing changes.
- Preserve unrelated untracked directories such as `.playwright-mcp/`, `assets/images/marketing/`, `red-skills/`, and `skills/`.
- A pre-commit hook may report pre-existing game-document inconsistencies unrelated to a small product change. Do not expand scope to fix them silently; record the issue and rely on targeted checks. If a commit must bypass the hook, only do so after the relevant tests and page/data checks pass, and explain it in the handoff.

## Xiaohongshu outreach safety and workflow

- Keep a contacted-target list. Search results can include the project's own account; verify the author identity before drafting or sending.
- Never send duplicate follow-ups just because a thread is quiet. A positive “谢谢/好哒，谢谢” reply is usually a natural stopping point unless a specific next step is useful.
- Separate discovery, drafting, and sending. Public search can produce a maximum of three high-fit candidates; each private message must be personalized to the visible post and must wait for user confirmation.
- Do not auto-follow, message, comment, like, or publish. Do not send to a refusal or a target who asks not to be contacted.
- The browser-control connection is a temporary task capability, not guaranteed by the Chrome extension alone. After a computer restart, the extension may remain enabled while the current Codex task still lacks a browser-control tool. If the tool is absent, report that limitation and do not claim to have read or sent anything.
- Previous confirmed outreach sent one message each to 一初夏令营| The One Camp, 宁行少年, and 禾页时光. Do not resend without a new user-approved reason.

## What not to preserve

- Do not store cookies, login state, access tokens, private message contents beyond the minimum status needed for project follow-up, or personal identifiers.
- Do not treat generated AI text or an unverified report as museum fact.
