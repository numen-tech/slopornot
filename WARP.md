# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## What this repo is
This repository is a **SlopOrNot plugin bundle** implemented mostly as Markdown.

The legacy direct-install runtime artifact is `SKILL.md`. Plugin payloads live
under `plugins/codex/slopornot/` and `plugins/claude/slopornot/`.

`README.md` is for humans: installation, usage, and a compact overview of the
current `agentic-humanizer` skill.

## Key files (and how they relate)
- `SKILL.md`
  - The actual skill definition.
  - Starts with YAML frontmatter containing `name`, `version`, `description`,
    and `allowed-tools`.
  - After the frontmatter is the editor prompt that orchestrates harness
    detection, Slop or Not probing, the interview, and the rewrite loop.
- `references/patterns.md`
  - The canonical 29-pattern rewrite catalogue.
- `skills/agentic-humanizer/README.md`
  - Dedicated Agentic Humanizer README for users and search indexing.
- `plugins/codex/slopornot/` and `plugins/claude/slopornot/`
  - Generated plugin payloads. Run `node scripts/sync-plugins.mjs` after
    editing canonical runtime files.
- `README.md`
  - Installation and usage instructions.
  - Contains the project overview and install paths.

When changing behavior/content, treat `SKILL.md` as the source of truth, and update `README.md` to stay consistent.

## Common commands
### Validate plugin packaging

```bash
node scripts/sync-plugins.mjs --check
node scripts/check-plugin-packaging.mjs
```

### Install the plugin

```bash
codex plugin marketplace add numen-tech/slopornot
```

Then run `codex`, open `/plugins`, switch to the `slopornot` marketplace, and
choose `Install plugin`.

## How to “run” it (Claude Code)
Invoke the skill:
- `/agentic-humanizer` for direct skill installs
- `/slopornot:agentic-humanizer` for Claude Code plugin installs

## Making changes safely
### Editing `SKILL.md`
- Preserve valid YAML frontmatter formatting and indentation.
- Keep the pattern numbering stable unless you’re intentionally re-numbering
  `references/patterns.md`.

### Documenting non-obvious fixes
If you change the prompt to handle a tricky failure mode (e.g., a repeated mis-edit or an unexpected tone shift), add a short note to `README.md`’s version history describing what was fixed and why.
