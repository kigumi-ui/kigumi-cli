# Pro Media & Date Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four Web Awesome Pro 3.10.0 components — `video`, `video-playlist`, `date-picker`, `date-input` — to the Kigumi CLI so `kigumi list` shows them and `kigumi add <Name>` installs React/Vue/Angular wrappers.

**Architecture:** `LOCAL_REGISTRY` in `src/utils/registry.ts` is the hand-authored source of truth; all wrappers, metadata, skill-refs, and story headers are generated from it plus the WA Pro CEM. The plan adds 4 registry entries by hand, regenerates all derived artifacts from the installed 3.10.0 Pro CEM, hand-writes the artifacts generators cannot produce (React `.jsx`/`.test.jsx`, docs stories, docs UI wrappers), and gates on `pnpm validate:all` + `pnpm test`.

**Tech Stack:** TypeScript, tsx scripts, pnpm, Vitest, Web Awesome Pro 3.10.0, changesets.

## Global Constraints

- Web Awesome version floor: **3.10.0** (already pinned in `docs/package.json`).
- All four components are **`tier: 'pro'`**, `status: experimental`.
- `importPath` uses the **free-package literal** `${WEB_AWESOME_FREE_PACKAGE}/dist/components/<slug>/<slug>.js` — the Pro rewrite happens at `kigumi add` time. Never hardcode `webawesome-pro` in `importPath`.
- **Never hand-edit generated files**: `src/utils/component-metadata.ts` and `scripts/css-metadata.ts` are produced by `pnpm generate:metadata`; the three `.claude/skills/shared/*-api-surface.md` by `pnpm generate:skill-refs`; the `<Name>.tsx`, `<Name>.css`, `<Name>.test.tsx` react templates by `pnpm generate:react`. Only `<Name>.jsx` and `<Name>.test.jsx` are hand-maintained in `templates/react/`.
- React `.jsx` `addEventListener` calls must be a **subset** of the `.tsx` ones (drift-guard Check C).
- Docs UI wrapper `<Name>.css` must be **CSS-rule-equal** (comments stripped) to `templates/react/<Name>/<Name>.css` (Check B) — copy the generated template CSS.
- No co-author trailer in commits (project preference).
- Work happens in worktree branch `add-pro-media-date-components`.
- Acceptance gate for the whole plan: `pnpm validate:all` green + `pnpm test` green + `pnpm build` succeeds.

Component categories & dependencies (from CEM):
- `video` → `Media`, deps `['dropdown','dropdown-item','popover','slider','button','icon']`
- `video-playlist` → `Media`, deps `['video','icon']`
- `date-picker` → `Form Controls`, deps `['icon']`
- `date-input` → `Form Controls`, deps `['date-picker','icon','popup']` (form-associated)

---

## File Structure

**Modified (hand):**
- `src/utils/registry.ts` — add 4 `LOCAL_REGISTRY` entries.
- `docs/src/components/ui/index.ts` — 4 barrel exports.
- `AGENTS.md`, `src/AGENTS.md`, `templates/AGENTS.md` — component counts + footer.

**Created (hand):**
- `templates/react/{Video,VideoPlaylist,DatePicker,DateInput}/<Name>.jsx` + `<Name>.test.jsx`
- `docs/src/stories/{Video,VideoPlaylist,DatePicker,DateInput}.stories.tsx`
- `docs/src/components/ui/{Video,VideoPlaylist,DatePicker,DateInput}/<Name>.tsx` + `<Name>.css`
- `.changeset/pro-media-date-components.md`

**Regenerated (via scripts — do not hand-edit):**
- `src/utils/component-metadata.ts`, `scripts/css-metadata.ts`
- `templates/{react,vue,angular}/<Name>/…` (except the hand `.jsx` pair)
- `.claude/skills/shared/{react,vue,angular}-api-surface.md`
- Story machine-headers (via `pnpm generate:stories`)

**The four component PascalCase names:** `Video`, `VideoPlaylist`, `DatePicker`, `DateInput`. Slugs: `video`, `video-playlist`, `date-picker`, `date-input`. Tags: `wa-video`, `wa-video-playlist`, `wa-date-picker`, `wa-date-input`.

---

## Task 1: Confirm the Pro CEM is installed & baseline is green

**Files:**
- Read: `docs/package.json`, `docs/node_modules/.pnpm/` (verify only)

- [ ] **Step 1: Verify the 3.10.0 Pro CEM is installed**

Run:
```bash
cd docs && find node_modules/.pnpm -path '*webawesome-pro@3.10.0*/dist/custom-elements.json' | head -1
```
Expected: a path is printed. If empty, run `pnpm install` in `docs/` first (auth via `docs/.npmrc`), then re-run.

- [ ] **Step 2: Confirm the four tags exist in that CEM**

Run:
```bash
CEM=$(find node_modules/.pnpm -path '*webawesome-pro@3.10.0*/dist/custom-elements.json' | head -1); \
grep -oE '"wa-(video|video-playlist|date-picker|date-input)"' "$CEM" | sort -u
```
Expected: all four tags printed (`"wa-date-input"`, `"wa-date-picker"`, `"wa-video"`, `"wa-video-playlist"`).

- [ ] **Step 3: Baseline — run the full validation to confirm a clean starting point**

Run (from repo root):
```bash
cd .. && pnpm validate:all
```
Expected: PASS. (Note: `validate:cem-sync` currently emits a *warning* for the stale metadata keys but does not fail. If it fails, stop and investigate before proceeding.)

- [ ] **Step 4: No commit** — this task only verifies preconditions.

---

## Task 2: Add the four registry entries

**Files:**
- Modify: `src/utils/registry.ts` (add 4 keys to `LOCAL_REGISTRY`)
- Test: `pnpm validate:registry`, `tests/unit/registry.test.ts`

**Interfaces:**
- Produces: registry keys `video`, `video-playlist`, `date-picker`, `date-input`, each a `ComponentDefinition` (`name, tagName, category, description, dependencies, files, props, importPath, tier`). Later tasks (generators) consume these via `getAllComponents()`.

- [ ] **Step 1: Add the `video` entry**

Insert into `LOCAL_REGISTRY` (alphabetical-ish placement near other Media components; exact position does not matter functionally):

```ts
  'video': {
    name: 'Video',
    tagName: 'wa-video',
    category: 'Media',
    description:
      'Displays a video player with customizable controls, captions, and thumbnails',
    dependencies: ['dropdown', 'dropdown-item', 'popover', 'slider', 'button', 'icon'],
    files: {
      react: ['components/Video.tsx', 'types/video.d.ts'],
      vue: ['components/Video/Video.vue'],
      angular: ['components/Video/video.component.ts'],
    },
    props: [
      { name: 'controls', type: 'string', values: ['none', 'standard', 'full'], default: 'standard', description: 'The set of controls to display' },
      { name: 'src', type: 'string', description: 'The video source URL' },
      { name: 'poster', type: 'string', description: 'The poster image URL shown before playback' },
      { name: 'title', type: 'string', description: 'The video title' },
      { name: 'thumbnails', type: 'string', description: 'URL to a WebVTT file for timeline thumbnail previews' },
      { name: 'playing', type: 'boolean', default: 'false', description: 'Whether the video is currently playing' },
      { name: 'muted', type: 'boolean', default: 'false', description: 'Whether the video is muted' },
      { name: 'volume', type: 'number', default: '1', description: 'The volume level from 0 to 1' },
      { name: 'autoplay', type: 'boolean', default: 'false', description: 'Automatically start playback when connected' },
      { name: 'loop', type: 'boolean', default: 'false', description: 'Restart playback when the video ends' },
      { name: 'autoplay-muted', type: 'boolean', default: 'false', description: 'Autoplay in a muted state' },
      { name: 'autoplay-on-visible', type: 'boolean', default: 'false', description: 'Resume playback when scrolled back into view' },
      { name: 'preload', type: 'string', values: ['auto', 'metadata', 'none'], default: 'metadata', description: 'The browser preload strategy' },
      { name: 'icon-library', type: 'string', default: 'system', description: 'The icon library used for built-in control icons' },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/video/video.js`,
    tier: 'pro',
  },
```

- [ ] **Step 2: Add the `video-playlist` entry**

```ts
  'video-playlist': {
    name: 'VideoPlaylist',
    tagName: 'wa-video-playlist',
    category: 'Media',
    description:
      'Groups multiple videos into a playlist with next/previous navigation',
    dependencies: ['video', 'icon'],
    files: {
      react: ['components/VideoPlaylist.tsx', 'types/video-playlist.d.ts'],
      vue: ['components/VideoPlaylist/VideoPlaylist.vue'],
      angular: ['components/VideoPlaylist/video-playlist.component.ts'],
    },
    props: [
      { name: 'controls', type: 'string', values: ['none', 'standard', 'full'], default: 'full', description: 'The set of controls forwarded to each child video' },
      { name: 'icon-library', type: 'string', default: 'system', description: 'The icon library used for placeholder icons' },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/video-playlist/video-playlist.js`,
    tier: 'pro',
  },
```

- [ ] **Step 3: Add the `date-picker` entry**

```ts
  'date-picker': {
    name: 'DatePicker',
    tagName: 'wa-date-picker',
    category: 'Form Controls',
    description:
      'An inline calendar for selecting a single date or a date range',
    dependencies: ['icon'],
    files: {
      react: ['components/DatePicker.tsx', 'types/date-picker.d.ts'],
      vue: ['components/DatePicker/DatePicker.vue'],
      angular: ['components/DatePicker/date-picker.component.ts'],
    },
    props: [
      { name: 'mode', type: 'string', values: ['single', 'range'], default: 'single', description: 'The selection mode' },
      { name: 'value', type: 'string', description: 'The selected date(s) in ISO format' },
      { name: 'min', type: 'string', description: 'The earliest selectable date (YYYY-MM-DD)' },
      { name: 'max', type: 'string', description: 'The latest selectable date (YYYY-MM-DD)' },
      { name: 'today', type: 'string', description: 'Overrides the date considered "today"' },
      { name: 'focused-date', type: 'string', description: 'The currently focused date' },
      { name: 'view', type: 'string', values: ['months', 'days', 'years'], default: 'days', description: 'The current calendar view' },
      { name: 'months', type: 'number', values: ['1', '2'], default: '1', description: 'The number of months rendered side-by-side' },
      { name: 'page-by', type: 'string', values: ['single', 'months'], default: 'months', description: 'Whether prev/next advances by the visible range or one month' },
      { name: 'first-day-of-week', type: 'string', values: ['auto', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], default: 'auto', description: 'The first day of the week' },
      { name: 'with-outside-days', type: 'boolean', default: 'false', description: 'Show leading/trailing days from adjacent months' },
      { name: 'with-week-numbers', type: 'boolean', default: 'false', description: 'Show the ISO week-number column' },
      { name: 'weekday-format', type: 'string', values: ['narrow', 'short', 'long'], default: 'short', description: 'The weekday header format' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the entire picker' },
      { name: 'readonly', type: 'boolean', default: 'false', description: 'Displays the value without allowing changes' },
      { name: 'disabled-dates', type: 'string', description: 'Whitespace-separated ISO dates to disable' },
      { name: 'disabled-days-of-week', type: 'string', description: 'Space-separated 3-letter weekday names to disable' },
      { name: 'disable-past', type: 'boolean', default: 'false', description: 'Disable all dates before today' },
      { name: 'disable-future', type: 'boolean', default: 'false', description: 'Disable all dates after today' },
      { name: 'min-range', type: 'number', default: '0', description: 'Minimum range length in days (range mode); 0 disables the check' },
      { name: 'max-range', type: 'number', default: '0', description: 'Maximum range length in days (range mode); 0 disables the check' },
      { name: 'size', type: 'string', values: ['xs', 's', 'm', 'l', 'xl'], default: 'm', description: 'The visual size' },
      { name: 'locale', type: 'string', description: 'A BCP-47 locale override' },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/date-picker/date-picker.js`,
    tier: 'pro',
  },
```

- [ ] **Step 4: Add the `date-input` entry**

```ts
  'date-input': {
    name: 'DateInput',
    tagName: 'wa-date-input',
    category: 'Form Controls',
    description:
      'A segmented date field with an optional popup calendar, for use in forms',
    dependencies: ['date-picker', 'icon', 'popup'],
    files: {
      react: ['components/DateInput.tsx', 'types/date-input.d.ts'],
      vue: ['components/DateInput/DateInput.vue'],
      angular: ['components/DateInput/date-input.component.ts'],
    },
    props: [
      { name: 'name', type: 'string', description: 'The name of the form control, submitted with form data' },
      { name: 'value', type: 'string', description: 'The current value; ISO date or range' },
      { name: 'mode', type: 'string', values: ['single', 'range'], default: 'single', description: 'The selection mode' },
      { name: 'label', type: 'string', description: 'The input label (use the label slot for HTML)' },
      { name: 'hint', type: 'string', description: 'The hint text (use the hint slot for HTML)' },
      { name: 'size', type: 'string', values: ['xs', 's', 'm', 'l', 'xl'], default: 'm', description: 'The visual size' },
      { name: 'appearance', type: 'string', values: ['filled', 'outlined', 'filled-outlined'], default: 'outlined', description: 'The visual appearance' },
      { name: 'pill', type: 'boolean', default: 'false', description: 'Draws the input with pill-style rounded edges' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Makes the input required for form submission' },
      { name: 'readonly', type: 'boolean', default: 'false', description: 'Makes the input non-editable' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the input' },
      { name: 'autocomplete', type: 'string', description: 'Forwarded to the hidden form input for browser autofill' },
      { name: 'with-clear', type: 'boolean', default: 'false', description: 'Shows a clear button when a value is present' },
      { name: 'min', type: 'string', description: 'The earliest selectable date' },
      { name: 'max', type: 'string', description: 'The latest selectable date' },
      { name: 'today', type: 'string', description: 'Overrides the date considered "today"' },
      { name: 'first-day-of-week', type: 'string', values: ['auto', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], default: 'auto', description: 'The first day of the week in the popup calendar' },
      { name: 'disabled-dates', type: 'string', description: 'Whitespace-separated ISO dates to disable' },
      { name: 'disabled-days-of-week', type: 'string', description: 'Space-separated 3-letter weekday names to disable' },
      { name: 'disable-past', type: 'boolean', default: 'false', description: 'Disable all dates before today' },
      { name: 'disable-future', type: 'boolean', default: 'false', description: 'Disable all dates after today' },
      { name: 'min-range', type: 'number', default: '0', description: 'Minimum range length in days (range mode); 0 disables the check' },
      { name: 'max-range', type: 'number', default: '0', description: 'Maximum range length in days (range mode); 0 disables the check' },
      { name: 'months', type: 'number', values: ['1', '2'], default: '1', description: 'The number of months rendered in the popup calendar' },
      { name: 'page-by', type: 'string', values: ['months', 'single'], default: 'months', description: 'Whether prev/next pages by the visible range or one month' },
      { name: 'with-outside-days', type: 'boolean', default: 'false', description: 'Show leading/trailing adjacent-month days in the popup' },
      { name: 'with-week-numbers', type: 'boolean', default: 'false', description: 'Show ISO week numbers in the popup' },
      { name: 'weekday-format', type: 'string', values: ['narrow', 'short', 'long'], default: 'short', description: 'The weekday header format in the popup' },
      { name: 'open', type: 'boolean', default: 'false', description: 'Whether the popup calendar is open' },
      { name: 'placement', type: 'string', values: ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end'], default: 'bottom-start', description: 'The preferred popup placement' },
      { name: 'distance', type: 'number', default: '0', description: 'The distance in pixels between the popup and input' },
    ],
    importPath: `${WEB_AWESOME_FREE_PACKAGE}/dist/components/date-input/date-input.js`,
    tier: 'pro',
  },
```

- [ ] **Step 5: Run registry validation**

Run: `pnpm validate:registry`
Expected: PASS (all required fields present; no duplicate keys). If it complains about missing template files, that is expected until Task 4 — re-read the error: `validate:registry` checks required *fields*, while template-file existence is `validate:parity`/`validate:templates` (Task 4). If the failure is a field/shape error, fix it here.

- [ ] **Step 6: Run registry unit tests**

Run: `pnpm test -- registry`
Expected: PASS (tests use dynamic counts, no hardcoded names).

- [ ] **Step 7: Commit**

```bash
git add src/utils/registry.ts
git commit -m "feat(registry): add video, video-playlist, date-picker, date-input (Pro)"
```

---

## Task 3: Regenerate metadata from the 3.10.0 Pro CEM

**Files:**
- Regenerate: `src/utils/component-metadata.ts`, `scripts/css-metadata.ts`
- Test: `pnpm validate:cem-sync`

**Interfaces:**
- Produces: `COMPONENT_METADATA` blocks for the four (events/slots/methods) and `CSS_METADATA` (parts/custom-props), consumed by template & skill-ref generators in Task 4.

- [ ] **Step 1: Regenerate metadata**

Run: `pnpm generate:metadata`
Expected: writes `src/utils/component-metadata.ts` and `scripts/css-metadata.ts`.

- [ ] **Step 2: Review the diff for unexpected churn**

Run: `git diff --stat src/utils/component-metadata.ts scripts/css-metadata.ts`
Expected: the four components' blocks now reflect real 3.10.0 data (e.g. `video` has `wa-video`? no — video's events are `timeupdate/play/pause/…`; `video-playlist` has `wa-video-change`; `date-input` has the `wa-show/wa-hide/wa-invalid` set). Incidental refresh of *other* components is acceptable (latent drift fix). Inspect any non-four component change and confirm it is a genuine CEM-driven diff, not corruption. If a change looks wrong, stop and investigate.

- [ ] **Step 3: Run CEM-sync validation**

Run: `pnpm validate:cem-sync`
Expected: PASS — every registry key (including the four new ones) now has matching CEM metadata; no `missing-from-cem` errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/component-metadata.ts scripts/css-metadata.ts
git commit -m "chore(metadata): regenerate from WA Pro 3.10.0 CEM"
```

---

## Task 4: Generate framework templates + hand-write React JS variants

**Files:**
- Regenerate: `templates/{react,vue,angular}/{Video,VideoPlaylist,DatePicker,DateInput}/…`
- Create (hand): `templates/react/<Name>/<Name>.jsx` + `<Name>.test.jsx` for each of the four
- Test: `pnpm validate:templates`, `pnpm validate:parity`, `pnpm validate:generated-fresh`

**Interfaces:**
- Consumes: registry entries (Task 2), `COMPONENT_METADATA`/`CSS_METADATA` (Task 3).
- Produces: `templates/react/<Name>/<Name>.tsx` (generated) whose event set defines the `.jsx` subset requirement.

- [ ] **Step 1: Generate all framework templates**

Run: `pnpm generate:templates`
Expected: creates `templates/react/Video/…`, `templates/vue/Video/…`, `templates/angular/Video/…` and likewise for VideoPlaylist, DatePicker, DateInput. Verify:
```bash
ls templates/react/Video templates/react/VideoPlaylist templates/react/DatePicker templates/react/DateInput
```
Each should contain `<Name>.tsx`, `<Name>.css`, `<Name>.test.tsx` (NOT `.jsx` yet).

- [ ] **Step 2: Read each generated `.tsx` to learn its event set**

Run: `grep -H "addEventListener" templates/react/Video/Video.tsx templates/react/VideoPlaylist/VideoPlaylist.tsx templates/react/DatePicker/DatePicker.tsx templates/react/DateInput/DateInput.tsx`
Expected: prints the `wa-*`/native event names each wrapper binds. Note them per component — the `.jsx` must bind a **subset** of these.

- [ ] **Step 3: Hand-write `templates/react/VideoPlaylist/VideoPlaylist.jsx`**

Model on `templates/react/RandomContent/RandomContent.jsx` (the display-component JS pattern: `React.forwardRef`, `ensureLoaded()` dynamic import, `useImperativeHandle` for methods, `useEffect` binding events, `clsx('VideoPlaylist', className)`). Bind only `wa-video-change`. Include the methods `next`, `previous`, `goTo` in the imperative handle. Import path in `ensureLoaded`: `@awesome.me/webawesome/dist/components/video-playlist/video-playlist.js`. Root element `<wa-video-playlist>`.

- [ ] **Step 4: Hand-write the remaining three `.jsx` files**

Create `templates/react/Video/Video.jsx`, `templates/react/DatePicker/DatePicker.jsx`, `templates/react/DateInput/DateInput.jsx` using the same JS pattern. For each: match the event names found in Step 2 (subset allowed), expose the CEM methods in the imperative handle (Video: `play/pause/togglePlay/toggleMute/seek/setVolume/setPlaybackRate/requestFullscreen/exitFullscreen/getVideoElement/getState`; DatePicker: none; DateInput: `focus/blur/show/hide/clear` plus form-validity methods `checkValidity/reportValidity/setCustomValidity`), and use the correct `ensureLoaded` import path per slug and root `<wa-*>` element. DateInput follows the form-control JS pattern — model additionally on `templates/react/NumberInput/NumberInput.jsx` for form value/event handling.

- [ ] **Step 5: Hand-write the four `.test.jsx` files**

Create `<Name>.test.jsx` for each, modeling on `templates/react/RandomContent/RandomContent.test.jsx` (and `NumberInput.test.jsx` for the form case). Keep them minimal: render the component, assert the custom element is in the DOM, and (where methods exist) assert the ref exposes them.

- [ ] **Step 6: Run template validations**

Run: `pnpm validate:templates && pnpm validate:parity`
Expected: PASS — `files.{react,vue,angular}` in the registry match the emitted template dirs; no orphaned/missing template findings.

- [ ] **Step 7: Run the generated-fresh drift guard (Check C is the critical one)**

Run: `pnpm validate:generated-fresh`
Expected: PASS. If Check C fails, a `.jsx` binds an event not present in its `.tsx` — remove the offending `addEventListener`. (Check B/D about docs & fixture CSS come in Task 5; if they fail here, that is expected and addressed next.)

- [ ] **Step 8: Run the generator unit/snapshot tests**

Run: `pnpm test -- generate-`
Expected: PASS. These use fixtures (`BUTTON_FIXTURE`, `BADGE_FIXTURE`), not the full registry, so new components do not change snapshots. If a snapshot unexpectedly fails, inspect before using `-u`.

- [ ] **Step 9: Commit**

```bash
git add templates/
git commit -m "feat(templates): add react/vue/angular wrappers for the four Pro components"
```

---

## Task 5: Docs UI wrappers + barrel export

**Files:**
- Create (hand): `docs/src/components/ui/{Video,VideoPlaylist,DatePicker,DateInput}/<Name>.tsx` + `<Name>.css`
- Modify: `docs/src/components/ui/index.ts`
- Test: `pnpm validate:generated-fresh` (Check B), `pnpm build` (docs types)

**Interfaces:**
- Consumes: generated `templates/react/<Name>/<Name>.tsx` and `<Name>.css` (Task 4).

- [ ] **Step 1: Create each docs UI wrapper `.tsx`**

For each component, create `docs/src/components/ui/<Name>/<Name>.tsx`. Use an existing docs wrapper as the model (e.g. `docs/src/components/ui/RandomContent/RandomContent.tsx`) — copy the generated `templates/react/<Name>/<Name>.tsx` content, keeping imports resolvable within `docs/` (they import from `@awesome.me/webawesome` / relative `./<Name>.css`).

- [ ] **Step 2: Copy the generated CSS into each docs wrapper**

For each: `cp templates/react/<Name>/<Name>.css docs/src/components/ui/<Name>/<Name>.css`. This guarantees CSS-rule equality for Check B.

- [ ] **Step 3: Add barrel exports**

In `docs/src/components/ui/index.ts`, add (alphabetical placement to match the file's convention):
```ts
export * from './DateInput/DateInput';
export * from './DatePicker/DatePicker';
export * from './Video/Video';
export * from './VideoPlaylist/VideoPlaylist';
```

- [ ] **Step 4: Run Check B via the drift guard**

Run: `pnpm validate:generated-fresh`
Expected: PASS — docs wrapper CSS is rule-equal to template CSS. If a mismatch appears, re-copy the template CSS (do not hand-edit).

- [ ] **Step 5: Typecheck the docs**

Run: `cd docs && pnpm build 2>&1 | tail -20; cd ..` (or the repo's docs typecheck script if separate)
Expected: no type errors referencing the four new wrappers/barrel exports.

- [ ] **Step 6: Commit**

```bash
git add docs/src/components/ui/
git commit -m "feat(docs): add UI wrappers for the four Pro components"
```

---

## Task 6: Storybook stories

**Files:**
- Create (hand): `docs/src/stories/{Video,VideoPlaylist,DatePicker,DateInput}.stories.tsx`
- Regenerate: story machine-headers via `pnpm generate:stories`
- Test: `pnpm validate:stories`

**Interfaces:**
- Consumes: docs UI wrappers + barrel (Task 5).

- [ ] **Step 1: Author each story file**

For each component, create `docs/src/stories/<Name>.stories.tsx` modeling on `docs/src/stories/RandomContent.stories.tsx`: import the component (and `type <Name>Ref` if it has methods) from `@/components/ui`; define `meta` with `title: 'Components/<Name>'`, `tags: ['autodocs']`, `argTypes` covering the main props (control types from prop types: `select` for enums with `options`, `boolean`, `number`, `text`), and `args` with `fn()` for each event. Provide at least: `Default` plus 1–3 variant stories exercising key props (e.g. Video: `WithPoster`, `Autoplay`; DatePicker: `RangeMode`, `WithWeekNumbers`; DateInput: `Required`, `RangeMode`; VideoPlaylist: `Default` with 2–3 `<Video>` children).

- [ ] **Step 2: Patch machine-generated headers**

Run: `pnpm generate:stories`
Expected: patches the machine-managed JSDoc/argTypes header sections in each new story to match registry+metadata. Review `git diff docs/src/stories/` to confirm only header regions changed.

- [ ] **Step 3: Validate stories exist for every registry component**

Run: `pnpm validate:stories`
Expected: PASS — no `missing-story` for the four.

- [ ] **Step 4: Commit**

```bash
git add docs/src/stories/
git commit -m "feat(stories): add Storybook stories for the four Pro components"
```

---

## Task 7: Skill references + changeset + AGENTS docs

**Files:**
- Regenerate: `.claude/skills/shared/{react,vue,angular}-api-surface.md`
- Create: `.changeset/pro-media-date-components.md`
- Modify: `AGENTS.md`, `src/AGENTS.md`, `templates/AGENTS.md`
- Test: `pnpm validate:agents`, `pnpm validate:generated-fresh`

- [ ] **Step 1: Regenerate skill references**

Run: `pnpm generate:skill-refs`
Expected: the three `*-api-surface.md` gain entries for the four components. Review `git diff .claude/skills/shared/`.

- [ ] **Step 2: Create the changeset**

Create `.changeset/pro-media-date-components.md`:
```markdown
---
'kigumi': minor
---

Add four Web Awesome Pro components:

- **Video** (`wa-video`) — a video player with `none`/`standard`/`full` control presets, poster, captions, timeline thumbnails, and playback methods (`play`, `pause`, `seek`, `setVolume`, `requestFullscreen`, …).
- **VideoPlaylist** (`wa-video-playlist`) — groups `<Video>` elements into a playlist with `next()`/`previous()`/`goTo()` navigation and a `wa-video-change` event.
- **DatePicker** (`wa-date-picker`) — an inline calendar for single or range date selection with min/max, disabled dates, week numbers, and locale support.
- **DateInput** (`wa-date-input`) — a form-associated segmented date field with an optional popup calendar, validation, and clear button.

All four are Pro-tier and require a Web Awesome Pro license.
```

- [ ] **Step 3: Determine the real component counts**

Run:
```bash
grep -cE "^  '[a-z-]+': \{" src/utils/registry.ts
ls templates/react | wc -l
```
Note both numbers (registry keys; react template dirs). Use these exact values when editing the AGENTS files — do not guess.

- [ ] **Step 4: Update the AGENTS.md files**

In `AGENTS.md`, `src/AGENTS.md`, `templates/AGENTS.md`: update the hardcoded component count(s) and the "Last Updated / after adding X" footer to today's date (2026-07-02) and the new counts from Step 3. Update any mermaid-diagram nodes that hardcode a per-framework component count. Search each file for the old count string before editing:
```bash
grep -rn "components" AGENTS.md src/AGENTS.md templates/AGENTS.md | grep -iE '[0-9]{2} components|Last Updated'
```

- [ ] **Step 5: Validate agents docs + generated freshness**

Run: `pnpm validate:agents && pnpm validate:generated-fresh`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/shared/ .changeset/pro-media-date-components.md AGENTS.md src/AGENTS.md templates/AGENTS.md
git commit -m "docs: skill refs, changeset, and AGENTS updates for the four Pro components"
```

---

## Task 8: Full acceptance gate

**Files:** none (verification only)

- [ ] **Step 1: Run the full validation suite**

Run: `pnpm validate:all`
Expected: PASS — all 8 guards green.

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Manual smoke — `kigumi list` shows the four**

Run: `node dist/index.js list 2>/dev/null | grep -iE 'video|date-picker|date-input' || pnpm kigumi list | grep -iE 'video|date'`
Expected: the four components appear under Media / Form Controls.

- [ ] **Step 5: Final commit if anything was fixed during acceptance**

```bash
git add -A
git commit -m "chore: finalize Pro media & date components" || echo "nothing to finalize"
```

---

## Self-Review Notes

- **Spec coverage:** Registry (Task 2), metadata regen (Task 3), templates + `.jsx` (Task 4), docs wrappers (Task 5), stories (Task 6), skill-refs + changeset + AGENTS (Task 7), acceptance gate (Task 8). All spec implementation units mapped.
- **Deferred (per spec Open Questions, intentionally out of scope):** `StorybookComponentGrid.tsx` catalog entries/PNGs; `video.duration`/`currentTime` state-readout props.
- **Guard mapping:** validate:registry→T2; validate:cem-sync→T3; validate:templates/parity + generated-fresh Check C→T4; generated-fresh Check B→T5; validate:stories→T6; validate:agents→T7; validate:all→T8.
