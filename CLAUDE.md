# Kigumi CLI

> **shadcn/ui for Web Awesome** — Template-based CLI that generates React/Vue/Angular/Next.js wrappers around Web Awesome web components.

## Agent Instructions

All detailed rules, architecture, decision trees, and checklists are in [AGENTS.md](AGENTS.md).
Sub-guides: [src/AGENTS.md](src/AGENTS.md) | [templates/AGENTS.md](templates/AGENTS.md) | [tests/AGENTS.md](tests/AGENTS.md)

**Read AGENTS.md at the start of any non-trivial task.**

## Stop Hook

`.claude/hooks/stop-quality-check.sh` runs automatically after each response when source files changed. It runs: type-check, lint, validate:changes, validate:registry, validate:templates, unit tests. Only checks relevant to changed files are triggered. If any check fails, you are blocked and must fix the errors first.

## Critical Rules (Always in Context)

1. **Templates-first**: Never edit generated code. Always edit the framework template files in `templates/` (real `.tsx` / `.vue` / `.component.ts` etc., validated by `tsc` and `eslint`), then `pnpm build` and regenerate.
2. **`class` not `className`** on `<wa-*>` elements — web components don't use React's className.
3. **`declare global`** not `declare module 'react'`\*\* — the latter overwrites React exports.
4. **Event cleanup**: Always return cleanup functions in `useEffect` for `wa-*` event listeners.
5. **No `!important`**: Use CSS cascade layers (`layers.css` handles base < theme ordering).
6. **Tier from `.env`**: Never store tier in config. Always detect via `detectTier()`.
7. **No `any`**: Use `unknown` or proper types.
8. **KigumiConfig type**: Defined once in `src/schemas/config.ts` (Zod-inferred). `src/utils/config.ts` re-exports it; either import path gives the same type.
9. **`@/components/ui` in docs/**: The docs site uses Kigumi wrappers from `@/components/ui`, not raw `wa-*` tags.

## Keep Docs in Sync

When you modify commands, utils, schemas, or project structure, you MUST also update the relevant AGENTS.md file(s):

- **New/renamed commands** → Update `AGENTS.md` (Repository Structure, Commands section) + `src/AGENTS.md` (Directory Structure, Commands section)
- **New/renamed utils** → Update `src/AGENTS.md` (Directory Structure, Key Modules)
- **New/renamed schemas or errors** → Update `src/AGENTS.md`
- **Template pattern changes** → Update `templates/AGENTS.md`
- **Test structure changes** → Update `tests/AGENTS.md`
- **Workflow/checklist changes** → Update `AGENTS.md` (Checklists section)

Update the "Last Updated" date at the bottom of any AGENTS.md you modify.

## Development Workflow

- Work in **git worktrees** on dedicated branches, never directly on main. Create worktrees at `.claude/worktrees/<branch-name>`.
- Create a **draft PR** early. This keeps work visible and skips Chromatic until you're ready.
- Mark the PR as **Ready for Review** when you want CI visual regression (Chromatic) to run.
- To force Chromatic on a PR that didn't change visual files, add the `visual-test` label.

## Quick Reference

```bash
pnpm build              # Build CLI + copy templates
pnpm test               # Unit tests
pnpm lint && pnpm type-check  # Code quality
pnpm validate:registry  # Registry consistency
pnpm validate:templates # Template file completeness
```

## Plans

Save plans to `.claude/plans/` (gitignored).

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `Siregar/kigumi-cli`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary, label strings unchanged. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` plus `docs/adr/`. See `docs/agents/domain.md`.

### Workflow skills

Engineering process runs on the `mattpocock-skills` plugin. There is no
superpowers/state directory and no Second Brain protocol; both were retired.

| Situation                                     | Skill                                                          |
| --------------------------------------------- | -------------------------------------------------------------- |
| New feature, big enough to span sessions      | `/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement` |
| New feature, fits in one session              | `/grill-with-docs` → `/implement`                              |
| Something is broken                           | `/diagnosing-bugs`                                             |
| Incoming bug report or request                | `/triage`                                                      |
| Before merging anything                       | `/code-review`                                                 |
| Spare capacity, want to find unknown problems | `/improve-codebase-architecture`                               |
| A term or boundary is fuzzy                   | `/domain-modeling`                                             |
| Designing a module's shape                    | `/codebase-design`                                             |

`/improve-codebase-architecture` is the replacement for the old audit cycle
that produced the F-XXX finding lists: it surfaces deepening opportunities
rather than bug inventories. Findings that need tracking become GitHub issues.

Kigumi's own domain skills (`kigumi-react`/`vue`/`angular`, the four
`kigumi-compose-*`, `generate-*`, `apply-theme-to-figma`, `kigumi-theme`,
`kigumi-cross-framework`, `release`, `release-readiness`) are unaffected.
