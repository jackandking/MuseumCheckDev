# devops/ — Convention Guide

This directory contains all DevOps tooling and AI shared assets for the MuseumCheck project. The website lives at the repo root; DevOps and automation live here.

## Directory Layout

```
devops/
├── scripts/           # CI helpers, validation scripts, deployment tools
│   ├── maintenance/   # Maintenance and cleanup scripts
│   └── test/          # Test helper scripts
├── tools/             # Data management tools (museum search, KV store, QR codes)
│   └── museum-data-templates/
├── skills/            # Shared AI skills (canonical location for all AI tools)
│   └── <skill-name>/
│       └── SKILL.md
├── workflows/         # Shared AI workflow definitions
├── agents/            # Shared AI agent definitions
├── .devcontainer/     # Dev container configuration
└── .local/            # Runtime data — NEVER commit (gitignored)
    ├── logs/
    ├── tmp/
    └── exports/
```

## Golden Rules

1. **Runtime data goes in `.local/`** — never write logs, temp files, or exports to the repo root or any tracked directory.
2. **Website stays at repo root** — HTML pages, script.js, style.css, js/, css/, core/, admin/, games/ are not part of devops.
3. **Tests stay at repo root** — tests/ and e2e/ remain at the repo root per industry convention.
4. **AI tool native configs stay in their own locations** — `.github/copilot-instructions.md`, root `CLAUDE.md`, `.cursor/rules/` etc. This directory holds shared skills/workflows/agents that all AI tools reference.

## Path Resolution

### In JavaScript (run via npm scripts from repo root)

Scripts are always executed from the repo root via `npm run`, so `process.cwd()` is the repo root.

```js
// Use process.cwd() for repo root paths
const repoRoot = process.cwd();
const dataPath = path.join(repoRoot, 'data', 'museums-meta.json');

// Use __dirname for paths relative to the script itself
const scriptDir = __dirname; // e.g., /path/to/repo/devops/scripts
```

### In Shell Scripts

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"     # repo root (2 levels up from devops/scripts/)
```

## AI Tool Discovery

| Tool | Native Location | How to discover shared assets |
|------|----------------|-------------------------------|
| Kimi | `.agents/skills/` | Symlink → `devops/skills/` |
| Copilot | `.github/copilot-instructions.md` | References `devops/skills/` |
| Claude | `CLAUDE.md` (root) | References `devops/skills/` |
| Universal | `AGENTS.md` (root) | References `devops/` structure |

## What Does NOT Belong Here

- Website HTML/CSS/JS (stays at repo root)
- Frontend modules (js/, css/, core/, shared/)
- Test files (tests/, e2e/)
- Test configuration (package.json jest config, playwright.config.js)
- Documentation (docs/, wiki/)
- Museum data (data/, config/)
