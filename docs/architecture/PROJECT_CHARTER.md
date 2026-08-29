# MuseumCheck Project Charter

Status: Active
Audience: maintainers, contributors, and AI coding agents
Last updated: 2026-07-31

This document is the product and engineering north star for MuseumCheck. Any AI agent, regardless of vendor or model family, should use it as the first decision filter before proposing or making changes.

## Mission

MuseumCheck helps families turn museum visits into shared parent-child exploration, so children build curiosity, confidence, and lasting affection for museums.

The product should make a real visit better. It should help parents guide attention, help children notice exhibits, and help museums offer a lightweight interactive layer without requiring heavy setup.

## Vision

MuseumCheck should become the simplest trusted companion for Chinese families visiting museums anywhere in the world. Its defining promise is not merely to generate a plausible itinerary, but to help a family take a reliable first step and continue exploring together during a real visit:

- Families can open it instantly from an H5 web page, including QR-code entry at museum sites.
- Children can complete age-appropriate missions during a real museum visit.
- Parents get enough guidance to start meaningful conversations without becoming tour guides or teachers.
- The first task, the next recommendation, and the language used can adapt to the child's age, interests, time, and observed progress.
- Museum facts, exhibit names, images, and availability are traceable, reviewable, and clearly separated from AI-generated suggestions.
- Museums can onboard their own pages, tasks, images, and public activity walls with minimal operational burden.
- The system remains small, resilient, inexpensive to run, privacy-conscious, and easy for AI agents to improve safely.

Museum coverage is not limited to China. The current product voice, language, family assumptions, and onboarding flows should prioritize Chinese families first, while the data model and architecture should allow museums worldwide to be added without special-case rewrites.

The current product focus is H5 web. Mini-program-specific flows, platform APIs, and packaging should be ignored unless the maintainer explicitly asks for them. Mobile H5 is the primary experience because MuseumCheck is expected to be used during museum visits. PC should remain usable, especially for planning, administration, and longer content work, but PC polish is secondary to on-site mobile UX.

The current stage priority is to become a useful, trusted companion for Chinese families visiting major museums in China. Global museum coverage, deeper museum-operator tooling, and broader platform expansion are valid long-term directions, but should not displace proving the family visit experience and its distribution model first.

## Success Metrics

The north star metric is a successful family visit session. Define it as:

```text
checkin_open -> task_open -> first_task_complete
```

with no blocking error during the flow. Count this on mobile visit sessions, deduplicate refreshes where practical, and keep the signal anonymous.

Use this metric because MuseumCheck should make the real museum visit better. Raw page views, long screen time, and novelty interactions are secondary unless they help families notice exhibits, talk together, and keep moving through the museum.

### Acquisition Metrics

Track whether real families can find and enter the product:

1. Museum page visits, grouped by museum and city.
2. QR-code entry sessions, grouped by museum and placement where available.
3. Search impressions and clicks for museum-specific pages.
4. Shared-link opens and poster or achievement shares.
5. Museums or family organizations actively distributing MuseumCheck.

### Primary Product Metrics

1. Visit activation

   Measure `checkin_open -> task_open`. This shows whether families understand what to do after opening a museum page. The first target is more than 70% of check-in opens leading to a task being opened.

2. First task completion

   Measure `checkin_open -> first_task_complete`. This is the most important early UX metric because a family at the museum entrance should quickly complete one useful step. The first target is more than 40% of check-in opens leading to first task completion.

3. Meaningful visit depth

   Measure completed task count per visit session, grouped as `0`, `1`, `2-3`, `4+`, and `all`. Optimize for useful progress during a real visit, not for long screen time.

4. User feedback signal

   Measure feedback submitted after task completion, helpful vs. not helpful feedback, and not-helpful reasons by task and museum. Direct feedback from on-site families should outweigh speculative feature ideas.

5. Share or publish outcome

   Measure poster creation, achievement publishing, and public wall contribution. These outcomes indicate that the visit became memorable enough to save or share.

6. Successful family visit session

   Treat `checkin_open -> task_open -> first_task_complete` as the minimum successful session. When available, record a second signal of value: a helpful feedback response or a second task opened/completed. Do not use page views or time-on-page as a substitute for this outcome.

### Guardrail Metrics

1. Mobile reliability

   Track JavaScript errors, failed static assets, failed API requests, check-in page load success, and frontend requests to `letmetry.cloud`. Frontend `letmetry.cloud` requests should remain zero.

2. Instant access

   Track time to first useful screen, time until the first task is visible, and task modal open latency on mobile. Keep the H5 entry fast on imperfect museum networks.

3. Privacy

   Anonymous visit signals must not include child nicknames or unnecessary personal data. Local progress should stay local unless the user explicitly publishes or shares it.

4. Trust and content quality

   Track broken images, missing museum metadata, inaccurate task reports, and legacy image rewrite success. Trust beats novelty.

5. Content provenance and recovery

   Track the proportion of featured exhibits with a source or verification state, reports that an exhibit is unavailable or inaccurate, and the time to review or correct those reports. AI-generated wording must never hide uncertainty in the underlying museum facts.

### Growth And Operations Metrics

1. Museum coverage

   Track usable museum pages, museums with complete tasks/images/metadata, and new global museums that can be added without code rewrites.

2. Real-world distribution

   Track QR-code entry sessions, family sharing, and museum/operator usage where available.

3. Repeat family use

   Track anonymous returning visitor sessions and multi-museum usage without weakening privacy defaults.

4. Deployment and regression health

   Track prod deploy success rate, time from push to live, page verification pass rate, targeted Playwright pass rate, and whether `/debug/status/` reports the expected prod commit. Prod deploy success should stay above 95%.

### Growth Guardrails

Growth must not be purchased by weakening the product mission or trust:

1. Do not optimize for page views, screen time, or game time when they do not improve a real museum visit.
2. Do not generate large volumes of thin or inaccurate museum pages solely for search traffic.
3. Do not require registration or expose unnecessary child information to increase sharing or retention.
4. Do not use invented museum facts, images, or recommendations to make pages appear more complete.

### Metric-Driven Iteration Rule

When choosing the next autonomous product improvement, prefer the smallest change that improves one of the primary product metrics without harming the guardrails. If evidence is missing, first add privacy-preserving instrumentation or lightweight user feedback. If a proposed improvement optimizes traffic, screen time, or visual novelty at the expense of real-world visit quality, it conflicts with this charter and needs human discussion.

For larger changes, record which evidence supports the direction, which acquisition, activation, or value metric it is expected to improve, and which guardrail could be harmed. If no evidence exists, label the work as an experiment and define a reversible validation step.

## Product Tenets

1. Real-world visit first

   MuseumCheck should encourage looking at exhibits, talking with family, and moving through the museum. It must not become a screen-first game that distracts from the visit.

2. Child-first, parent-enabled

   The child's task flow should be direct, visual, and low-friction. Parent content should support guidance and preparation without dominating the child's experience.

3. Age matters

   Tasks and explanations must fit the chosen age band. Content for younger children should emphasize observation and delight; older children can handle comparison, history, inference, and research.

4. Global museums, Chinese-family experience

   The museum catalog may include museums worldwide. The experience should remain optimized for Chinese families today, including Chinese-language guidance, family travel needs, and culturally understandable explanations.

5. Mobile-first H5, PC-compatible

   Mobile is the primary product surface for on-site QR-code use during museum visits. Features should be touch-friendly, fast, readable outdoors, and resilient on narrow screens. PC should remain functional and reasonably clean for planning, administration, and longer browsing sessions, but do not optimize PC at the expense of mobile visit UX.

6. Trust beats novelty

   Museum names, images, locations, exhibit descriptions, and task claims should be accurate or clearly marked as user-generated. Do not invent facts to make a page feel complete.

7. Privacy by default

   Local progress should stay local unless the user explicitly publishes or shares it. Public pages should avoid exposing unnecessary personal data.

8. Instant access

   A family at a museum entrance should be able to open the experience quickly on a phone, even on imperfect network conditions. Avoid heavy assets and fragile startup paths.

9. Museum-operator friendly

   QR-code workflows, public achievement walls, and admin tools should be understandable by non-engineers. Operational tools should be dense, clear, and hard to misuse.

10. Visual proof matters

   UI changes are not complete until they have been seen in a browser at realistic mobile and desktop sizes. Code review alone is not enough for visual or interaction work.

11. Data-informed, user-feedback-led

   Product evolution should be guided by real usage signals and direct user feedback, especially feedback from families using MuseumCheck during actual museum visits. Prefer evidence about where users get stuck, confused, delighted, or repeatedly ask for help over speculative feature ideas. Data should inform priorities and validation, while still respecting privacy, trust, and the real-world visit-first mission.

12. Useful and imperfect beats perfect and invisible

   Promotion, distribution, and real-world use of a useful product matter more than waiting for a theoretically perfect product. MuseumCheck should reach families and museums once the core experience is helpful, honest, safe, and usable enough to learn from. Do not hide limitations or weaken trust, but prefer shipping small improvements, collecting feedback, and iterating over polishing in isolation.

13. Distribution is part of the product

   For an on-site experience, QR codes, museum partnerships, family content, and shareable visit outcomes are product pathways, not marketing work detached from the product. Every important museum experience should have a credible way for a family to discover it and enter it at the right moment.

14. Evidence before expansion

   Larger product directions should be supported by at least one meaningful evidence source: real family feedback, observed on-site use, privacy-preserving behavior data, museum-operator demand, or search and distribution data. When evidence is missing, prefer a small reversible experiment over a broad feature expansion.

15. Facts fixed, expression adaptive

   Museum facts, exhibit identity, location, images, availability, and provenance must come from structured, reviewable data. AI may adapt questions, explanations, difficulty, ordering, and tone, but must not invent or silently upgrade uncertain facts.

16. The visit path beats the feature list

   The default experience should make one useful on-site action obvious. Achievements, games, pets, rankings, assessments, and sharing are supporting layers and must not compete with the first task.

17. Real feedback beats model intuition

   Prefer evidence from families who actually used the product during a visit—completion, abandonment, helpfulness, corrections, and repeat use—over speculative AI feature ideas.

18. Small architecture, strong contracts

   Prefer plain, understandable HTML/CSS/JavaScript and existing repo patterns. Add abstractions only when they reduce real duplication or protect a cross-page contract.

19. Backward compatibility is a feature

   Existing localStorage keys, public URLs, database rows, image URLs, and deployed pages may already be in use. Preserve them or provide explicit migration/compatibility behavior.

## Engineering Tenets

1. Use the existing shape of the app before introducing new structure.
2. Keep static pages deployable without a build step unless there is a strong reason to change that contract.
3. Treat `config/api-endpoints.js` as the central API routing contract.
4. Treat `museumcheck.cn` as the canonical production API and asset origin.
5. Do not reintroduce `letmetry.cloud` into frontend runtime paths.
6. Prioritize H5 web behavior; do not optimize for mini-program packaging or platform APIs unless explicitly requested.
7. Design and test mobile first for user-facing visit flows; keep PC compatible, especially for planning and admin flows.
8. Prefer resilient client-side compatibility layers over risky production data rewrites when legacy data exists.
9. Keep shared scripts safe for multiple pages; check load order and missing DOM elements.
10. Write targeted tests for regressions that are likely to recur.
11. Use Playwright or browser checks for navigation, check-in, poster, and public wall behavior.
12. Keep docs in `docs/`; do not add new root Markdown files except the explicitly allowed root docs.

## AI Evolution Model

AI agents may help the project evolve autonomously, but autonomy means disciplined incremental improvement, not unsupervised product drift.

Every AI agent should follow this loop:

1. Read this charter, `AGENTS.md`, and task-relevant docs before changing code.
2. Inspect the actual source files instead of relying only on summaries or generated repo packs.
3. State assumptions when they affect product behavior, data, privacy, deployment, or architecture.
4. Make the smallest coherent change that moves the product toward the mission.
5. Verify locally with the narrowest meaningful test set, then broaden when the blast radius is larger.
6. Check the real deployed environment when the task concerns deployment, routing, assets, or browser behavior.
7. Leave durable context: update docs, tests, comments, or commit messages when the lesson should help the next agent.

## Autonomous Merge Policy

If a future change does not conflict with the mission, vision, or product tenets in this charter, and the relevant validation gates pass, AI agents may merge or push the change to `prod` without asking for another product decision.

If a future change conflicts with the mission, vision, or product tenets, or requires changing the mission, vision, or product tenets, the AI agent must pause and discuss the product direction with a human maintainer first. The maintainer decides whether to reject the change, adapt the implementation, or update this charter.

This policy does not override the explicit-approval requirements below. Production infrastructure, secrets, destructive operations, SSH access, database schema changes, and other high-risk actions still require explicit human approval.

## Autonomous Change Scope

AI agents may generally proceed without extra human approval for:

- Bug fixes with a clear reproduction path and low-risk implementation.
- Test additions or updates that encode existing intended behavior.
- Documentation updates that clarify current behavior.
- Small UI copy, layout, or accessibility improvements that preserve the current product intent.
- Data normalization that is deterministic, reversible, and validated.
- Refactors that are local, behavior-preserving, and covered by existing or added tests.

AI agents must ask for explicit approval before:

- Running `ssh`, `scp`, `sftp`, or any command that invokes SSH.
- Changing production server, Nginx, database, DNS, CDN, SSL, or GitHub Secrets configuration.
- Performing destructive operations, mass deletes, or irreversible data migration.
- Adding or upgrading major dependencies.
- Changing branch strategy, deployment topology, or public API contracts.
- Rewriting localStorage keys or database schema.
- Publishing user-generated content, sending messages to users, or changing privacy defaults.
- Introducing AI-generated museum facts, images, or recommendations without source review.

## Validation Gates

Use the smallest relevant gate first, then expand when needed:

- Static syntax: `node --check <file>` for changed JavaScript files.
- Unit tests: `npm test -- --runInBand` or targeted Jest files.
- Page health: `npm run verify:pages:fast`.
- E2E: `npm run e2e` or targeted Playwright specs for affected flows.
- Visual/browser checks: use Playwright screenshots or real browser inspection for UI changes.
- Deployment observation: use `gh run list`, `gh run view`, and `gh run watch` for GitHub Actions.
- Production smoke test: verify `https://museumcheck.cn/` for prod-facing changes.
- Dev smoke test: verify `https://jackandking.github.io/MuseumCheckDev/` for dev-facing changes.

For image and API routing changes, explicitly verify:

- No frontend request goes to `letmetry.cloud`.
- Legacy `https://letmetry.cloud/images/...` values render through `https://museumcheck.cn/images/...`.
- GitHub Pages uses `https://museumcheck.cn` as API origin.
- `museumcheck.cn` pages can use same-origin API paths.

## Branch And Deployment Contract

The active branch model is:

- `dev`: development branch, deployed to GitHub Pages dev environment.
- `prod`: production branch, deployed to GitHub Pages and the cloud server.

Do not assume a `main` branch exists for production work. If branch strategy needs to change, ask first and document it with an ADR.

## Cross-AI Handoff Format

When handing work from one AI agent to another, include:

- Current branch and latest commit.
- User goal in one sentence.
- Files changed or suspected.
- Commands already run and their outcomes.
- Known blockers, risks, and assumptions.
- Exact URLs or Actions run IDs checked.
- Next recommended step.

This keeps Codex, Claude, Copilot, Gemini, and future agents aligned on evidence instead of memory.

## Definition Of Done

A change is done when:

- It improves or protects the family museum visit experience.
- It follows this charter and the repository agent rules.
- It has been verified with tests or browser checks proportional to risk.
- It does not leak secrets or unnecessary user data.
- It does not introduce avoidable deployment or operational burden.
- The next maintainer or AI agent can understand why the change exists.
