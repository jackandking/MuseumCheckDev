# Project Agent Rules

- Read `docs/architecture/PROJECT_CHARTER.md` before making product, architecture, deployment, or autonomous-improvement decisions.
- Keep changes aligned with the mission: help families turn museum visits into shared parent-child exploration, so children build curiosity and lasting affection for museums.
- Prioritize mobile-first H5 UX for on-site museum visits. Keep PC usable, but treat PC polish as secondary unless the task is planning or admin focused. Ignore mini-program-specific work unless the user explicitly requests it.
- If a change does not conflict with the charter's mission, vision, or tenets and the relevant tests pass, AI agents may merge or push it to `prod`; if there is a conflict, ask a human whether to change the charter or the implementation.
- Do not run `ssh` in this repository.
- If SSH access is genuinely required for a task, ask the user for explicit approval first and wait for confirmation before running any `ssh` command or command that invokes SSH, such as `scp`, `sftp`, or `rsync -e ssh`.

## Multi-session coordination (read before starting work)

Other AI sessions may be working in this repo at the same time. Before you start:

1. Run `node /Users/jak/WorkBuddy/commander/commander.mjs wip` — see who has claimed which repo/paths, and whether there is **orphan WIP** (uncommitted changes nobody claimed, usually left by a finished session). Do not silently build on orphan WIP; report it to the user first.
2. Declare your own claim:
   `node /Users/jak/WorkBuddy/commander/commander.mjs claim <task-id> --repo=museumcheck --paths=<a,b> --ttl=90`
   If another task already holds an overlapping path, the command **exits non-zero and refuses**. Do not force it — tell the user there is a conflict.
3. When finished: `node /Users/jak/WorkBuddy/commander/commander.mjs release <task-id>`

Before creating any new scheduled job (cron / launchd / automation), check the registry first:
`node /Users/jak/WorkBuddy/commander/commander.mjs status`
An equivalent job may already exist. **Register every job you create in `/Users/jak/WorkBuddy/commander/tasks.json`** — an unregistered job is invisible to other sessions and causes duplicate work.
