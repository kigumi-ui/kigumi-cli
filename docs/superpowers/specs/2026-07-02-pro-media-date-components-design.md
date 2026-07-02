# Add Pro Media & Date Components to Kigumi CLI

**Date:** 2026-07-02
**Branch:** `add-pro-media-date-components`
**Status:** Design approved — ready for implementation plan

## Summary

Add four Web Awesome **Pro** components — `video`, `video-playlist`, `date-picker`,
`date-input` — to the Kigumi CLI so that `kigumi list` shows them and `kigumi add
<Name>` installs framework wrappers for them. All four ship in **Web Awesome Pro
3.10.0** (the version already pinned by `docs/package.json` and bumped in commit
`cce99c1d` / kigumi 0.26.0). This is a single atomic PR modeled on the CheckboxGroup
addition (commit `4ef7b3c8`, #216).

## Background & Motivation

These four components were requested for wrapping. Investigation established:

- They do **not** exist in the Web Awesome **free** package, nor in the stale 3.5.0
  Pro CEM that was cached in `docs/node_modules`.
- They **do** exist in **Web Awesome Pro 3.10.0**. Verified by installing the pinned
  Pro package and grepping the CEM:
  `node_modules/.pnpm/@awesome.me+webawesome-pro@3.10.0_.../dist/custom-elements.json`
  contains `wa-video`, `wa-video-playlist`, `wa-date-picker`, `wa-date-input`
  (plus a `wa-video-change` event).
- The CLI's `src/utils/component-metadata.ts` already contains **stale ghost blocks**
  for all four, generated in Feb 2026 from a since-pulled Pro `^3.2.1` beta. These are
  not wired into `LOCAL_REGISTRY`, so the components are invisible to `kigumi
  list`/`add` today. Regenerating metadata from the real 3.10.0 CEM replaces the stale
  blocks with current data.

All four are marked `status: "experimental"` in the CEM, `since: "3.7"` (video,
video-playlist) / `since: "3.8"` (date-picker, date-input), and are **Pro-tier**.

## Goals

- `kigumi list` shows the four components under their categories.
- `kigumi add Video|VideoPlaylist|DatePicker|DateInput` installs correct React, Vue,
  and Angular wrappers.
- `component-metadata.ts` / `css-metadata.ts` are regenerated from the **real 3.10.0
  Pro CEM** (no hand-editing of generated files).
- `pnpm validate:all` and `pnpm test` pass; no drift-guard regressions.

## Non-Goals

- Adding these components to any consumer project (e.g. mischa). That is a separate,
  downstream `kigumi add` once this ships.
- Building the `StorybookComponentGrid.tsx` catalog entries + PNG screenshots
  (best-effort, not guard-enforced; deferred to a follow-up — see Open Questions).
- Changing tier-gating mechanics or the Pro-rewrite path.

## Architecture & Data Flow

`LOCAL_REGISTRY` (`src/utils/registry.ts`, **hand-authored**) is the single source of
truth. Everything else is generated from it plus the WA Pro CEM:

```
WA Pro 3.10.0 CEM ──generate:metadata──▶ src/utils/component-metadata.ts (events/slots/methods)
                  └─generate:metadata──▶ scripts/css-metadata.ts        (parts/custom-props)
registry.ts (hand) ─generate:templates─▶ templates/{react,vue,angular}/<Name>/…
                   ├─generate:skill-refs▶ .claude/skills/shared/{react,vue,angular}-api-surface.md
                   └─(drives)───────────▶ docs stories (hand + patch) + docs ui wrappers (hand)
```

Template generators iterate `getAllComponents()` (the registry), reading
`COMPONENT_METADATA` and `CSS_METADATA` per component. The registry `files` field is a
manifest checked by `validate:parity`, not a generation gate — every registry component
gets templates in every framework.

**Tier convention:** `tier: 'pro'` is the CLI's own free/pro gate. `importPath` still
uses the free-package literal `${WEB_AWESOME_FREE_PACKAGE}/dist/components/<slug>/<slug>.js`;
the Pro package rewrite happens in `materializeTemplate()` at `kigumi add` time (per
`templates/AGENTS.md`). This matches existing Pro entries like `file-input`,
`number-input`.

## Component APIs (from WA Pro 3.10.0 CEM)

### video (`wa-video`) — category `Media`, tier `pro`
- **dependencies:** `dropdown`, `dropdown-item`, `popover`, `slider`, `button`, `icon`
- **Authoring props:** `controls` (`none|standard|full`, default `standard`), `src`,
  `poster`, `title`, `thumbnails`, `playing` (bool), `muted` (bool), `volume` (number,
  default `1`), `autoplay` (bool), `loop` (bool), `autoplay-muted` (bool),
  `autoplay-on-visible` (bool), `preload` (`auto|metadata|none`, default `metadata`),
  `icon-library` (default `system`).
- **Omitted from props** (state readouts, not authoring inputs): `duration`,
  `currentTime`. Their events/methods still surface via generated metadata.
- **Events:** `timeupdate`, `play`, `pause`, `volumechange`, `error`, `ended`,
  `loadedmetadata` (all standard media events).
- **Methods:** `play`, `pause`, `togglePlay`, `toggleMute`, `seek`, `setVolume`,
  `setPlaybackRate`, `requestFullscreen`, `exitFullscreen`, `getVideoElement`,
  `getState`.
- **Notable CSS custom props:** `--controls-color`, `--controls-background`,
  `--poster-play-button-background`.

### video-playlist (`wa-video-playlist`) — category `Media`, tier `pro`
- **dependencies:** `video`, `icon`
- **Props:** `controls` (`none|standard|full`, default `full`), `icon-library`.
- **Events:** `wa-video-change`.
- **Methods:** `next`, `previous`, `goTo(index)`.

### date-picker (`wa-date-picker`) — category `Form Controls`, tier `pro`
- **dependencies:** `icon`
- **Props (~24):** `mode` (`single|range`), `value`, `min`, `max`, `today`,
  `focused-date`, `view` (`months|days|years`, default `days`), `months` (`1|2`),
  `page-by` (`single|months`), `first-day-of-week`
  (`auto|sun|mon|tue|wed|thu|fri|sat`), `with-outside-days` (bool), `with-week-numbers`
  (bool), `weekday-format` (`narrow|short|long`), `disabled` (bool), `readonly` (bool),
  `disabled-dates`, `disabled-days-of-week`, `disable-past` (bool), `disable-future`
  (bool), `min-range` (number), `max-range` (number), `size`
  (`xs|s|m|l|xl`), `locale`.
- **Events:** `input`, `change`, `wa-focus-day`, `wa-view-change`.
- **Methods:** none.

### date-input (`wa-date-input`) — category `Form Controls`, tier `pro`
- **dependencies:** `date-picker`, `icon`, `popup`
- **Form-associated** (extends `WebAwesomeFormAssociatedElement`) — wrapper follows the
  form-control pattern (`file-input`/`number-input`), not the display pattern.
- **Props (~35):** the date-picker date props (`mode`, `min`, `max`, `today`,
  `first-day-of-week`, `disabled-dates`, `disabled-days-of-week`, `disable-past`,
  `disable-future`, `min-range`, `max-range`, `months`, `page-by`, `with-outside-days`,
  `with-week-numbers`, `weekday-format`) **plus** form/appearance props: `name`,
  `value`, `required` (bool), `readonly` (bool), `disabled` (bool), `size`,
  `appearance` (`filled|outlined|filled-outlined`), `pill` (bool), `label`, `hint`,
  `autocomplete`, `with-clear` (bool), `open` (bool), `placement`
  (`top*|bottom*`, default `bottom-start`), `distance` (number).
- **Events:** `input`, `change`, `focus`, `blur`, `wa-clear`, `wa-show`,
  `wa-after-show`, `wa-hide`, `wa-after-hide`, `wa-invalid`.
- **Methods:** `focus`, `blur`, `show`, `hide`, `clear`, plus inherited form-validity
  methods (`checkValidity`, `reportValidity`, `setCustomValidity`, etc.).

## Implementation Units

Ordered; each is independently checkable.

1. **Registry entries** — add 4 keys to `LOCAL_REGISTRY` in `src/utils/registry.ts`,
   using the `random-content` entry as the structural template. Props transcribed from
   the APIs above. Set `tier: 'pro'`, correct `dependencies`, `importPath`
   (free literal), and `files.{react,vue,angular}` to match generator output.
   *Check:* `pnpm validate:registry`.

2. **Regenerate metadata** — `pnpm generate:metadata`. Replaces stale ghost blocks in
   `component-metadata.ts` + `css-metadata.ts` with real 3.10.0 data. Review the diff:
   expect the four components plus possible incidental refresh of other components whose
   CEM changed since the last generation — this is correct drift-fixing; flag anything
   unexpected. *Check:* `pnpm validate:cem-sync` (registry keys ⊆ metadata keys).

3. **Regenerate templates** — `pnpm generate:templates` (react/vue/angular). Emits
   `templates/{react,vue,angular}/<Name>/…` for all four.

4. **Hand-write React JS variants** — `templates/react/<Name>/<Name>.jsx` and
   `<Name>.test.jsx` for each (generators skip these). `.jsx` event listeners must be a
   subset of `.tsx`. Model on an existing Pro component's `.jsx`. *Check:*
   `pnpm validate:generated-fresh` (Check C).

5. **Regenerate skill refs** — `pnpm generate:skill-refs`. Updates the three
   `.claude/skills/shared/*-api-surface.md`.

6. **Docs stories** — hand-author `docs/src/stories/<Name>.stories.tsx` for each (model
   on `RandomContent.stories.tsx`: Default + key variants + relevant states), then
   `pnpm generate:stories` to patch machine-generated headers. *Check:*
   `pnpm validate:stories`.

7. **Docs UI wrappers** — create `docs/src/components/ui/<Name>/<Name>.tsx` + `<Name>.css`
   for each; add `export * from './<Name>/<Name>';` to
   `docs/src/components/ui/index.ts`. `<Name>.css` must be rule-equal (comment-stripped)
   to `templates/react/<Name>/<Name>.css` — simplest path is to copy the generated
   template CSS. *Check:* `pnpm validate:generated-fresh` (Check B).

8. **Changeset** — new `.changeset/<name>.md` with `'kigumi': minor` frontmatter and an
   "Added" bullet per component (props/events/tier), styled like the CheckboxGroup /
   random-content changesets. `CHANGELOG.md` is updated automatically at
   `changeset version` time.

9. **AGENTS.md updates** — bump the hardcoded component count and "Last Updated / after
   adding X" footer in root `AGENTS.md`, `src/AGENTS.md`, `templates/AGENTS.md`; update
   mermaid-diagram count nodes. Reconcile the **real** counts by grepping registry keys
   and framework-template dirs at edit time rather than trusting existing numbers.

10. **Skill markdown sanity** — read `kigumi-compose-layout` / `kigumi-compose-overlay`
    skill markdown; patch only if they assert these components are absent.

## Validation Gate (Acceptance)

- `pnpm validate:all` green — all 8 guards: `validate:registry`, `validate:templates`,
  `validate:changes`, `validate:stories`, `validate:cem-sync`, `validate:parity`,
  `validate:agents`, `validate:generated-fresh`.
- `pnpm test` green — unit + snapshot tests. If generator snapshot tests enumerate the
  full registry, update with `vitest -u` and review the snapshot diff.
- `pnpm build` succeeds.

## Risks & Mitigations

- **cem-sync depends on the installed Pro CEM.** The 3.10.0 CEM is installed in `docs/`
  via lockfile, so this passes locally and reproducibly in CI. `generated-fresh` Check A
  self-skips without a Pro token; `cem-sync` runs at release-readiness — both satisfied
  because metadata is committed from the real CEM. Confirm the `docs/` install is
  lockfile-driven (no lockfile churn).
- **`.jsx` hand-authoring** (Unit 4) is the most error-prone step (Check C). Mirror an
  existing Pro component's `.jsx` closely.
- **date-input is form-associated** — its wrapper needs the form-participation surface
  (name/value/validity). Follow the existing form-control wrapper pattern
  (`file-input`/`number-input`), not the display-component pattern.
- **Larger-than-four metadata diff** (Unit 2) — accepted as latent-drift fixing; review
  and call out unexpected churn before committing.

## Open Questions

- **Catalog grid (`StorybookComponentGrid.tsx`)** — deferred by default (not
  guard-enforced; even `random-content` is absent). Revisit if catalog parity is wanted;
  would require 4 PNG screenshots + entries.
- **State-readout props** (`video.duration`, `video.currentTime`) — omitted from
  registry `props` as outputs, not authoring inputs. Reconsider if consumers need them
  as documented attributes.

## References

- Precedent commit: `4ef7b3c8` (CheckboxGroup addition, #216) — same PR shape.
- WA 3.10.0 bump: `cce99c1d` (#218), changeset `.changeset/web-awesome-3-10-0.md`.
- Registry template: `random-content` entry, `src/utils/registry.ts`.
- Add-component walkthrough: `templates/AGENTS.md` "Adding New Components"; root
  `AGENTS.md` "Checklist: Before Adding New Component".
