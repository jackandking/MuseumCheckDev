# Project Agent Rules

- Read `docs/architecture/PROJECT_CHARTER.md` before making product, architecture, deployment, or autonomous-improvement decisions.
- Keep changes aligned with the mission: help families turn museum visits into shared parent-child exploration, so children build curiosity and lasting affection for museums.
- Prioritize mobile-first H5 UX for on-site museum visits. Keep PC usable, but treat PC polish as secondary unless the task is planning or admin focused. Ignore mini-program-specific work unless the user explicitly requests it.
- If a change does not conflict with the charter's mission, vision, or tenets and the relevant tests pass, AI agents may merge or push it to `prod`; if there is a conflict, ask a human whether to change the charter or the implementation.
- Do not run `ssh` in this repository.
- If SSH access is genuinely required for a task, ask the user for explicit approval first and wait for confirmation before running any `ssh` command or command that invokes SSH, such as `scp`, `sftp`, or `rsync -e ssh`.
