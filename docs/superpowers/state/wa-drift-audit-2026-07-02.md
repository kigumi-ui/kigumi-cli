# WA 3.7.0–3.10.0 Drift Audit — 2026-07-02

Audit of residual documentation/metadata drift from the Web Awesome bumps in
PRs #208 (3.7.0), #209 (3.8.0), #216 (3.9.0), #218 (3.10.0). Three parallel
sweeps: code/registry/types, Storybook/docs site, agent-facing markdown.
All findings below are fixed in the drift-fix PR (branch `drift-fix-wa-370-3100`)
unless noted otherwise.

## Verified clean (no action)

version-map entries and dates; `DEFAULT_WEBAWESOME_VERSION`; all package pins;
Drawer `light-dismiss=false` across all wrappers/stories; Tree `leaf-multiple`
typing in all frameworks; CopyButton `feedback` part; no `time-picker` residue;
no `--wa-accordion-divider-color` residue (removed in WA 3.9.0); auto-generated
`*-api-surface.md` fresh; root/src/tests AGENTS.md; README; Typography/Motion
MDX (text utilities + transition tokens present); `breakingChanges: []` for
0.24.0 is correct because Kigumi wrappers always defaulted Drawer light-dismiss
to false.

## Findings

- **F-156 (quality, high) — Components grid missing 6 new components.**
  `docs/src/components/storybook/StorybookComponentGrid.tsx` is a hand-maintained
  map, last touched in PR #85; Accordion, AccordionItem, TimeInput, KnownDate,
  CheckboxGroup, RandomContent (and the older Markdown) were absent from the
  Components landing grid and its search index. Fixed in this PR.
- **F-157 (quality, medium) — `templates/AGENTS.md` stale.** "74 React
  templates" (now 80) and Last Updated 2026-05-02; the file was not touched by
  any of the four bump PRs. Fixed in this PR.
- **F-158 (quality, medium) — `kigumi-angular` skill stale count.** "all 74
  components" (now 80). Fixed in this PR.
- **F-159 (quality, medium) — compose-form skill unaware of new form
  controls.** Selection tables and key-props/cheatsheet omit CheckboxGroup,
  TimeInput, KnownDate. Fixed in this PR.
- **F-160 (quality, low) — compose-layout collapsible-sections pattern lacks
  Accordion.** Settings archetype only offered standalone Details; no pointer
  to Accordion for coordinated expand/collapse. Fixed in this PR.
- **F-161 (quality, low) — cem-sync warns on intentionally unwrapped
  components.** `video`, `video-playlist`, `date-picker`, `date-input` produced
  4 warnings every run with no documented allowlist. Added
  `INTENTIONALLY_UNWRAPPED` to `scripts/validate-cem-sync.ts` (+ src/AGENTS.md
  note); passing runs are now zero-warning, new gaps still warn. Fixed in this
  PR. Wrapping date-input/date-picker remains a separate scoped effort.
- **F-162 (quality, low) — repo-root `kigumi.config.json` floated `^3.1.0`.**
  Dogfooding config contradicted the exact-pin policy. Pinned to 3.10.0 in
  this PR.
- **F-163 (quality, low) — story gaps for new/changed APIs.** No Tree
  `leaf-multiple` demo story; RandomContent lacked a ChromaticOnly snapshot;
  Accordion/AccordionItem lacked the `play` interaction tests their sibling
  stories have. Fixed in this PR.
- **F-164 (quality, low) — kigumi-theme references claimed WA 3.4.0
  sourcing.** `available-themes.md` and `css-variables.md` (published to
  docs/public via publish-skills) carried "sourced from Web Awesome 3.4.0"
  notes. Re-validation against 3.10.0 found real value drift: `--wa-color-mix-hover`
  / `--wa-color-mix-active` changed from flat `black N%` to `oklch(from
currentColor ...)` / surface-based mixes, new `--wa-button-transform-hover/-active`
  tokens were undocumented, and the `shoelace` palette was missing from the
  palettes table. All corrected and sourcing notes bumped to 3.10.0 in this PR.
