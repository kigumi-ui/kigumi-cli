# Contributing to Kigumi

Thanks for your interest in Kigumi. This guide covers everything you need to get productive.

## Prerequisites

- **Node.js 22.12 or newer** (see `engines` in `package.json`)
- **pnpm 10** (the repo pins its package manager via `packageManager`)
- A Web Awesome Pro license is **not** required to contribute. Pro components are supported through
  metadata and type-check shims that carry names and signatures but no Pro-authored documentation, so
  a plain clone builds, type-checks and tests fine.

  Two things do need a Pro token, and both are maintainer tasks: building the documentation site
  (`docs/` depends on the Pro package), and regenerating the Pro metadata and shims after a Web
  Awesome upgrade. CI detects a missing token and skips the docs jobs, so a pull request from a fork
  gets a clean run rather than an authentication error.

## Getting Started

```bash
git clone https://github.com/Siregar/kigumi-cli.git
cd kigumi-cli
pnpm install
pnpm build
pnpm test
```

## The One Rule That Matters Most

**Never edit generated component code.** Kigumi ships component wrappers for React, Vue, and Angular,
and those wrappers are produced from the sources in `templates/`. If you change a wrapper by hand, the
next generation run silently overwrites your work, and CI will flag the drift.

The correct loop is:

1. Edit the real source under `templates/react/<Component>/`, `templates/vue/<Component>/`, or
   `templates/angular/<Component>/`. These are genuine `.tsx` / `.vue` / `.component.ts` files that
   are type-checked and linted like any other code.
2. Run `pnpm build` to regenerate.
3. Validate with `pnpm validate:templates` and `pnpm validate:registry`.

`AGENTS.md` at the repo root documents the architecture in depth, with sub-guides in `src/`,
`templates/`, and `tests/`.

## Validation Loop

Run these before opening a pull request. CI runs the same checks.

```bash
pnpm type-check          # TypeScript across src, templates, and tests
pnpm lint                # ESLint
pnpm format:check        # Prettier
pnpm test                # Unit tests
pnpm validate:registry   # Registry and template consistency
pnpm validate:templates  # Per-framework template completeness
pnpm validate:generated-fresh  # Generated artifacts match their generators
```

If `validate:generated-fresh` reports drift, regenerate rather than hand-editing: run
`pnpm generate:templates` for component wrappers, or `pnpm generate:metadata` if you have a Pro token
and the Web Awesome version changed.

For broader changes:

```bash
pnpm validate:all        # Every consistency guard
pnpm test:integration    # Framework integration tests
pnpm test:e2e            # End-to-end CLI tests
```

## Coding Conventions

A handful of rules exist because violating them breaks things in ways that are hard to spot:

- Use `class`, not `className`, on `<wa-*>` elements. Web components do not understand React's
  `className` prop.
- Declare JSX types with `declare global`, never `declare module 'react'`. The latter replaces React's
  own exports instead of extending them.
- Always return a cleanup function from `useEffect` when you attach `wa-*` event listeners.
- No `!important`. Styling order is handled by CSS cascade layers in `layers.css`.
- No `any`. Use `unknown` or a precise type.
- Import the `KigumiConfig` type from `src/schemas/config.ts`, which is Zod-inferred and complete.
- Never store the license tier in a config file. Detect it at runtime with `detectTier()`.

## Tests

Tests live in `tests/`, split into `unit`, `integration`, and `e2e`. Unit tests are the ones that run
on every change and must stay fast.

Write tests that can fail for a real reason. A test that only asserts that a class can be constructed,
or that a function returns something truthy, adds coverage without adding confidence. Prefer asserting
on behavior, especially error paths and edge cases.

Coverage thresholds are enforced in `vitest.unit.config.ts`. There is also a mock budget
(`pnpm check:mocks`): heavy mocking at filesystem and network boundaries hides real bugs, so the number
of mocks is capped and enforced in CI.

## Pull Requests

- Branch off `main`. Keep the history linear; rebase rather than merge.
- Add a changeset for anything user-facing: `pnpm changeset`. Pick `patch`, `minor`, or `major` and
  describe the change from a user's point of view.
- Keep the docs in sync. If you add or rename a command, util, or schema, update the relevant
  `AGENTS.md` and the README.
- One logical change per pull request. A focused diff gets reviewed faster.

## Adding a Component

Web Awesome components are mirrored into Kigumi through the registry in `src/utils/registry.ts` plus
per-framework templates. The `generate-component-wrapper` workflow described in `templates/AGENTS.md`
walks through the full checklist, including metadata, stories, and docs wrappers.

## Reporting Bugs

Open an issue using the bug report template. The single most useful thing you can include is the exact
command you ran, the framework you targeted, and your `kigumi.config.json`.

For security issues, do not open a public issue. See [SECURITY.md](SECURITY.md).

## Code of Conduct

Participation in this project is covered by the [Code of Conduct](CODE_OF_CONDUCT.md).
