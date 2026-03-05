# Kigumi CLI

> **shadcn/ui for Web Awesome** — Template-based CLI that generates React/Vue/Svelte/Angular wrappers around Web Awesome web components.

## Agent Instructions

All detailed rules, architecture, decision trees, and checklists are in [AGENTS.md](AGENTS.md).
Sub-guides: [src/AGENTS.md](src/AGENTS.md) | [templates/AGENTS.md](templates/AGENTS.md) | [tests/AGENTS.md](tests/AGENTS.md)

**Read AGENTS.md at the start of any non-trivial task.**

## Stop Hook

`.claude/hooks/stop-quality-check.sh` runs automatically after each response when source files changed. It runs: type-check, lint, validate:changes, validate:registry, validate:templates, unit tests. Only checks relevant to changed files are triggered. If any check fails, you are blocked and must fix the errors first.

## Critical Rules (Always in Context)

1. **Templates-first**: Never edit generated code. Always edit `.hbs` templates, then `pnpm build` and regenerate.
2. **`class` not `className`** on `<wa-*>` elements — web components don't use React's className.
3. **`declare global`** not `declare module 'react'`\*\* — the latter overwrites React exports.
4. **Event cleanup**: Always return cleanup functions in `useEffect` for `wa-*` event listeners.
5. **No `!important`**: Use CSS cascade layers (`layers.css` handles base < theme ordering).
6. **Tier from `.env`**: Never store tier in config. Always detect via `detectTier()`.
7. **No `any`**: Use `unknown` or proper types.
8. **KigumiConfig type**: Import from `src/schemas/config.ts` (Zod-inferred, complete), NOT from `src/utils/config.ts` (old interface, incomplete).

## Keep Docs in Sync

When you modify commands, utils, schemas, or project structure, you MUST also update the relevant AGENTS.md file(s):

- **New/renamed commands** → Update `AGENTS.md` (Repository Structure, Commands section) + `src/AGENTS.md` (Directory Structure, Commands section)
- **New/renamed utils** → Update `src/AGENTS.md` (Directory Structure, Key Modules)
- **New/renamed schemas or errors** → Update `src/AGENTS.md`
- **Template pattern changes** → Update `templates/AGENTS.md`
- **Test structure changes** → Update `tests/AGENTS.md`
- **Workflow/checklist changes** → Update `AGENTS.md` (Checklists section)

Update the "Last Updated" date at the bottom of any AGENTS.md you modify.

## Quick Reference

```bash
pnpm build              # Build CLI + copy templates
pnpm test               # Unit tests
pnpm lint && pnpm type-check  # Code quality
pnpm validate:registry  # Registry consistency
pnpm validate:templates # Template file completeness
```
