# F-013: Restore Correct Tier Gating For Palettes

**Status:** Design approved 2026-04-24 — ready for implementation plan.
**Finding:** `docs/kigumi-cli-overview.md` → F-013 (currently classified quality/low; see "Overview entry correction" below — this is actually a bug).
**Branch:** `fix/f013-palette-tier-gating` (new worktree at `.claude/worktrees/fix-f013-palette-tier-gating`).

## Problem

`src/utils/tier-restrictions.ts:58-82` declares `palettes.free` and `palettes.pro` as identical 9-element arrays with an accompanying comment `// CRITICAL: ALL palettes available to BOTH tiers`. Both the data and the comment are wrong.

The actual Web Awesome contract is:

- **Free palettes (3):** `default`, `bright`, `shoelace`.
- **Pro palettes (6 additional):** `rudimentary`, `elegant`, `mild`, `natural`, `anodized`, `vogue`.
- Pro users get all 9; free users get only the first 3.

Consequences of the current data:

- **`kigumi palette <name>` accepts Pro palettes on free-tier projects.** `palette.ts:86-88` validates against `availablePalettes`, which currently contains all 9. A free-tier project can run `kigumi palette elegant` and the CLI writes `palette: "elegant"` into the config — but the Pro CSS never loads, so the runtime site silently falls back to the default palette. The config lies.
- **`kigumi init` (interactive) offers Pro palettes to free users** via `config-builder.ts:357-359`. Same outcome: config written, CSS never loaded.
- **The initial F-013 finding describes this as a cleanup** (option (a) simplify / option (b) document). Both options are wrong because they assume palettes are tier-agnostic. The fix is to make the data match the contract.

## Goal

Restore correct tier gating for palettes across the three touch-sites (data, two CLI validators) and the test suite. No API signature changes, no structural refactor.

## Non-goals

- Refactoring the `TIER_RESTRICTIONS` shape, renaming it, or collapsing palettes to a single array (the tier split is real).
- Emitting a warning/error when `kigumi init --force` encounters an existing free-tier config whose `palette` is a Pro value. The existing silent fallback to `'default'` in `config-builder.ts:361-368` is a sensible default and the population of affected configs is small (nobody had a working Pro palette on free before — their sites were already rendering with default because the CSS never loaded).
- Adding `isPaletteAvailable` to any production caller. It stays on the public surface (used by tests), now with correct behavior.
- Deriving `PALETTE_OPTIONS` from `TIER_RESTRICTIONS` (or vice versa) at module-load time. The two arrays stay parallel, with a unit test enforcing consistency (see "Display-options symmetry" below).

## Design

### Data fix — `src/utils/tier-restrictions.ts`

**Lines 58-82 — `TIER_RESTRICTIONS.palettes`:**

```ts
// Before
palettes: {
  // CRITICAL: ALL palettes available to BOTH tiers
  free: [
    'default', 'bright', 'shoelace', 'rudimentary', 'elegant',
    'mild', 'natural', 'anodized', 'vogue',
  ],
  pro: [
    'default', 'bright', 'shoelace', 'rudimentary', 'elegant',
    'mild', 'natural', 'anodized', 'vogue',
  ],
}

// After
palettes: {
  free: ['default', 'bright', 'shoelace'],
  pro: [
    'default',
    'bright',
    'shoelace',
    'rudimentary',
    'elegant',
    'mild',
    'natural',
    'anodized',
    'vogue',
  ],
}
```

The misleading `// CRITICAL: ALL palettes available to BOTH tiers` comment is removed. The `TierRestrictions` interface and all function signatures stay identical — the tier parameter is meaningful now, not a no-op.

### Comment fix — `src/commands/palette.ts:85`

Remove the line `// 4. Validate palette (all palettes available to all tiers)` and replace with `// 4. Validate palette against the caller's tier`. The behavior (line 86-88) is unchanged and already correct once the data is fixed.

### Caller impact

- `src/commands/palette.ts:63` — `getAvailablePalettes(tier)` call is unchanged. Free tier now sees 3 options in the interactive picker; passing a Pro palette as argument throws `ValidationError` at line 87. This is the intended behaviour.
- `src/commands/init/config-builder.ts:357-359` — switches from the manual `PALETTE_OPTIONS.filter(...)` to the new `getPaletteOptionsForTier(finalTier)` helper (see "Display-options symmetry" below). Free tier now sees 3 palette options in the interactive selector. Existing free-tier configs with a Pro palette in `existingConfig.theme.palette` hit the `availablePalettes.includes(...)` check at line 364 and silently fall back to `'default'` via `getInitialPalette()` at line 368 — the pre-existing fallback path, no new code needed.

### Display-options symmetry — `src/utils/display-options.ts`

`THEME_OPTIONS` (lines 19-26) already carries per-entry `pro: true` markers and has a `getThemeOptionsForTier(tier)` helper (lines 88-97). `PALETTE_OPTIONS` lacks both. Bring the palette side up to parity in the same PR so both axes of the tier-gating story land together.

**Changes:**

1. Add `pro: true` to the 6 Pro entries in `PALETTE_OPTIONS` (`rudimentary`, `elegant`, `mild`, `natural`, `anodized`, `vogue`). The 3 free entries (`default`, `bright`, `shoelace`) remain without the flag. Use the same shape as `THEME_OPTIONS`.
2. Add `getPaletteOptionsForTier(tier: 'free' | 'pro'): Array<{ value: string; label: string }>` mirroring the existing `getThemeOptionsForTier` implementation (lines 88-97) — strip the `pro` flag from the returned objects so the output remains a plain `{value, label}` list.
3. Update `src/commands/init/config-builder.ts:29` imports: drop `PALETTE_OPTIONS`, add `getPaletteOptionsForTier`. Update line 357-359 to:
   ```ts
   const availablePalettes = getAvailablePalettes(finalTier);
   const paletteOptions = getPaletteOptionsForTier(finalTier);
   ```
   `availablePalettes` is still needed by `getInitialPalette()` at line 364 for the existing-config validity check.
4. `src/utils/display-options.ts` JSDoc stays accurate (the module doc is generic).

**Drift protection:** add one test in `tests/unit/display-options.test.ts` that asserts the Pro-flagged palette values are exactly the set-difference between `TIER_RESTRICTIONS.palettes.pro` and `TIER_RESTRICTIONS.palettes.free`:

```ts
// tests/unit/display-options.test.ts — new describe block
describe('PALETTE_OPTIONS pro flags', () => {
  it('match TIER_RESTRICTIONS.palettes', () => {
    const flaggedAsPro = PALETTE_OPTIONS.filter((p) => 'pro' in p && p.pro).map(
      (p) => p.value
    );
    const expectedProOnly = TIER_RESTRICTIONS.palettes.pro.filter(
      (v) => !TIER_RESTRICTIONS.palettes.free.includes(v)
    );
    expect(new Set(flaggedAsPro)).toEqual(new Set(expectedProOnly));
  });
});
```

This catches either side drifting in future edits without forcing a runtime derivation.

### Tests — `tests/unit/tier-restrictions.test.ts`

Three blocks change:

**`isPaletteAvailable` free-tier block (lines 80-91):**

- Rewrite from "allow all standard palettes" to "allow only free palettes":
  - Keep `toBe(true)` for `default`, `bright`, `shoelace`.
  - Convert the remaining 6 to a new adjacent test `'should deny pro palettes for free tier'` with `toBe(false)` assertions for `rudimentary`, `elegant`, `mild`, `natural`, `anodized`, `vogue`.

**`isPaletteAvailable` pro-tier block (lines 93-103):** unchanged — all 9 return `true`.

**`TIER_RESTRICTIONS constant` block (lines 325-331):** replace the `'should have same 9 palettes for both tiers'` test with:

```ts
it('should have 3 free palettes', () => {
  expect(TIER_RESTRICTIONS.palettes.free).toHaveLength(3);
});

it('should have 9 pro palettes (superset of free)', () => {
  expect(TIER_RESTRICTIONS.palettes.pro).toHaveLength(9);
  for (const palette of TIER_RESTRICTIONS.palettes.free) {
    expect(TIER_RESTRICTIONS.palettes.pro).toContain(palette);
  }
});
```

The existing `'should deny "custom" palette'` and `'should deny unknown palettes'` tests (lines 105-114) stay — both palettes are unknown to both tiers.

The file-header JSDoc (lines 1-14) stays accurate and needs no change.

### Palette-command test

Grep confirmed `tests/unit/palette-command.test.ts` exists. The implementation plan step must read that file and update any fixtures that hardcode the 9-palette `availablePalettes` list for free tier. No detailed design here — the change will follow from running the test and fixing any assertions that now disagree with the corrected data.

### Config-builder test

Existing mock `getAvailablePalettes: vi.fn(() => ['default'])` in `tests/unit/init-config-preservation.test.ts:30` still works — it's tier-insensitive by design. No change needed.

### Changeset

New file `.changeset/fix-f013-palette-tier-gating.md`:

```
---
'kigumi': patch
---

### Fixed

- **Free-tier projects can no longer select Pro palettes.** `TIER_RESTRICTIONS.palettes.free` incorrectly listed all 9 palettes, so `kigumi palette elegant` (or any of the other Pro palettes) on a free-tier project would write the palette to `kigumi.config.json` even though the Pro CSS was never loaded — the runtime silently fell back to the default palette, and the config was a lie. Free projects now see only `default`, `bright`, and `shoelace`, matching the Web Awesome free tier. Existing free-tier configs with a Pro palette value are silently reset to `default` on the next `kigumi init --force` via the pre-existing fallback path. (F-013)

### Changed

- **`PALETTE_OPTIONS` carries `pro: true` markers and a new `getPaletteOptionsForTier(tier)` helper**, matching the existing `THEME_OPTIONS` / `getThemeOptionsForTier(tier)` pattern. Internal utility; no surface change for generated projects.
```

### Overview entry correction — `docs/kigumi-cli-overview.md`

F-013 in the overview (line 509-515) currently reads:

- Category: `quality | low`
- Problem text: "palettes are tier-agnostic in WA"
- Fix sketch: options (a)/(b) treating this as cleanup

All three are wrong. The implementation plan will rewrite the F-013 entry as part of the PR:

- Category: `bug | medium`
- Problem text: correctly describe the tier contract and the silent config/runtime divergence.
- Fix sketch: reference this spec for the canonical fix.
- Keep the finding ID stable (F-013).

The cluster-table line 346 also needs a small update: F-013 is no longer a "2-Zeilen-Kommentar"; it's a 3-line data fix + 2 comment removals + test updates. Recategorize as solo fix with its own PR, retained outside the clusters.

## Verification

- `pnpm type-check` — no signatures changed, should pass unconditionally.
- `pnpm lint` — no rule changes.
- `pnpm test` — `tier-restrictions.test.ts`, `palette-command.test.ts`, `init-config-preservation.test.ts`, `display-options.test.ts` are the direct test surfaces; stop-hook also runs `validate:changes` / `validate:registry` / `validate:templates` (no-ops here).
- Manual smoke:
  1. `pnpm build`.
  2. In a free-tier demo project: `node dist/index.js palette` → picker should offer exactly 3 options.
  3. In the same project: `node dist/index.js palette elegant` → `ValidationError` with available options = `[default, bright, shoelace]`.
  4. In a Pro demo project (`WEBAWESOME_LICENSE_KEY` set): `node dist/index.js palette` → all 9 options visible; `palette elegant` succeeds.

## Risk & rollback

Medium risk. Failure modes:

- A free user who previously (incorrectly) configured a Pro palette will experience a silent switch to `default` on their next `kigumi init --force`. This is the correct behaviour, but the silent fallback is undocumented and the user will not see a warning. Acceptable — their runtime was already rendering with default anyway because the Pro CSS never loaded.
- Tests that hardcode "9 palettes available for free" fail loudly and are already covered in the test section above.

Rollback is a single revert of the commit.

## Open questions

None. The tier contract is confirmed (3 free / 9 pro), the API stays stable, and downstream callers already pass tier correctly.
