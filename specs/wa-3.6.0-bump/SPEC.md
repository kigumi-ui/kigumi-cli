# SPEC: Web Awesome 3.5.0 → 3.6.0 Bump

**Feature type:** Build/Infra (dependency upgrade + drift reconciliation + drift-guard hardening)

**Status:** Implemented

## Overview

Upgrade Web Awesome from `3.5.0` to `3.6.0` across the free (root) and Pro (`docs/`)
packages, regenerate CEM-derived metadata, reconcile registry/template drift, surface the
new XS/XL/short-form form-control `size` tokens across every mirror, and harden the CEM-sync
gate so enum prop-value drift can never again slip through silently.

WA `3.6.0` is a **minor, non-breaking** release. Authoritative `dist/custom-elements.json`
diff between the 3.5.0 and 3.6.0 Pro tarballs:

- **Components:** 74 → 74 (no additions, no removals).
- **`size` attribute** widened on 18 form controls from `'small' | 'medium' | 'large'` to
  `'xs' | 's' | 'm' | 'l' | 'xl' | 'small' | 'medium' | 'large'`.
- **`beforeinput`** event added to `wa-number-input`.
- **`handleSizeChange`** internal member added to ~19 components (auto-captured, not wrapped).
- **`wa-dialog` / `wa-drawer`** gained a `--backdrop-filter` CSS custom property.
- **`wa-file-input`** dropped the `file-icon` slot.

> The earlier exploratory diff that appeared to add components (date-picker, date-input,
> time-input, known-date, checkbox-group) was an artifact of a stale 3.9.0 copy left in the
> pnpm store; those are 3.9.0 additions, not 3.6.0. See PLAN.md "pnpm store hygiene".

## Goals

- Clean minor bump pinned **exactly** to `3.6.0` (stepping minors one at a time; do not float).
- Zero `validate:all` / `pnpm test` / type-check / lint / docs-type-check failures.
- New `size` tokens available to users across registry, templates, and all hand-maintained mirrors.
- A `minor` changeset staged.
- **Sustainable drift protection:** `validate:cem-sync` detects enum prop-value drift going forward.

## Non-goals

- `src/utils/version-map.ts` edit (release-time only — keeps `kigumiVersion` honest).
- New components (none exist in 3.6.0).
- Consuming `beforeinput` in wrapper logic beyond exposing the event (number-input wrappers do).
- Reconciling the broad, pre-existing divergence between `docs/src/components/ui/*` wrappers
  and the generated templates (tracked as a separate finding).
- Fixing the two pre-existing registry enum divergences (`dropdown-item.variant: neutral`,
  `scroller.orientation: both`) — allowlisted and tracked for separate reconciliation.

## Version pinning

WA is **exact-pinned** by convention (`src/constants.ts`: "must never auto-float"). All four
references use exact `3.6.0`:

- `package.json` → `"@awesome.me/webawesome": "3.6.0"`
- `src/constants.ts` → `DEFAULT_WEBAWESOME_VERSION = '3.6.0'`
- `docs/package.json` → `"@awesome.me/webawesome-pro": "3.6.0"` (was caret `^3.5.0`; switched to
  exact so the CEM resolves to 3.6.0 rather than floating to the latest 3.x)
- `docs/kigumi.config.json` → `.webAwesome.version = "3.6.0"`

## Size token decision

Surface the **full CEM union** `['small','medium','large','xs','s','m','l','xl']` (not just
XS/XL). Rationale: the CEM is the single source of truth; hiding the `s/m/l` short-form aliases
would make the wrapper types narrower than the component actually accepts. `default: 'medium'`
is unchanged (`validate-registry.ts` enforces `default ∈ values`).

## Affected mirrors (must move together)

1. **Registry** `src/utils/registry.ts` — 18 `size` props widened.
2. **Templates** — regenerated React/Vue/Angular wrappers (`pnpm generate:templates`).
3. **Generator snapshots** — _not affected_ (driven by inline fixtures, not the live registry).
4. **Starter-snapshot fixtures** `tests/fixtures/starter-snapshots/**` — size unions on the
   curated set (button/input/select/switch/textarea) + the `--backdrop-filter` dialog doc line,
   patched deterministically (external starter clones unavailable in this environment).
5. **Docs stories** `docs/src/stories/*.stories.tsx` — 18 `size` option arrays widened; a
   `onBeforeinput` argType added to `NumberInput.stories.tsx` (required by `validate:stories`,
   which derives expected event argTypes from metadata).
6. **Docs UI wrappers** `docs/src/components/ui/*` — 18 `size` unions widened; `onBeforeinput`
   added to the NumberInput wrapper so the story args type-check.

## Drift guard (validate:cem-sync hardening)

`component-metadata.ts` carries events/slots/methods but **not** attribute enums, which is why
the `size` widening was invisible to the old presence-only check. The gate now also reads the
raw CEM and diffs each registry enum `prop.values`:

- Registry value WA no longer accepts → **error** (user-facing defect).
- CEM value not yet surfaced in the registry → **warning** (additive).
- `REGISTRY_VALUE_ALLOWLIST` downgrades known pre-existing divergences so new drift still fails
  the build while existing debt stays visible.

## Acceptance criteria

- [x] All four version references read exact `3.6.0`; both lockfiles resolve `3.6.0`.
- [x] `pnpm validate:cem-sync` passes (incl. new prop-value drift check).
- [x] `size` values include the new tokens everywhere; templates + mirrors moved together.
- [x] `pnpm validate:all` + `pnpm test` (1489) + `pnpm type-check` + `pnpm lint` + docs type-check green.
- [x] `minor` changeset present.
- [x] `version-map.ts` untouched.
