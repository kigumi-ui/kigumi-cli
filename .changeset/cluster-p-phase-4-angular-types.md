---
'kigumi': minor
---

### Breaking Changes

- **Angular and Vue: imperative methods removed from Dialog, Drawer, and Markdown wrappers (F-143).** WA 3.5.0+ marks `wa-dialog` / `wa-drawer` `show()`+`requestClose()` and `wa-markdown` `getMarked()`+`updateAll()` as `privacy: 'private'` in the CEM, so they are no longer exposed on the framework wrappers. All three framework wrappers (React/Angular/Vue) now converge on the WA-recommended attribute pattern. **Migration:**
  - **Angular:** replace `dialogComponent.show()` with `[open]="isOpen"` (and `requestClose()` with `[open]="false"`). Same for `wa-drawer`. For `wa-markdown`, replace `getMarked()` / `updateAll()` calls with re-binding the projected source content; `renderMarkdown()` remains public.
  - **Vue:** replace `dialogRef.value.show()` with `<Dialog v-model:open="isOpen">` (and `requestClose()` with `isOpen.value = false`). Same for `<Drawer>`. For `<Markdown>`, drop calls to `getMarked()` / `updateAll()`; `renderMarkdown()` remains exposed via `defineExpose`.
    The wrapper JSDoc carries an `@remarks` block pointing to the replacement API in every affected file.

### Changed

- **Angular: native event types now flow through `@Output()` declarations (F-139).** Wrappers previously emitted `EventEmitter<CustomEvent>` for every event because two latent bugs in `scripts/generate-angular-templates.ts` (`getEvents`/`getMethods` reading `e.type?.text` against a flat-string metadata shape, hidden by an OR-fallback) made every type fall back to `unknown`/`CustomEvent`. After the fix and a full template regeneration, native events emit their precise type, e.g. Button's `focusEvent` is now `EventEmitter<FocusEvent>`. WA-specific event types (`BlurEvent`, `WaInvalidEvent`, etc.) still fall back to `CustomEvent`; tracked as F-141 for a follow-up.
- **Angular: method parameters now have real types (F-139, F-140).** Wrappers previously declared every method parameter as `unknown` and cast the host element with `(p: unknown) => void`. After the fix they emit precise types from the CEM (e.g. `focus(options?: FocusOptions)`, `setCustomValidity(message?: string)`, `formStateRestoreCallback(state?: string | File | FormData | null, reason?: 'autocomplete' | 'restore')`). Bare-identifier non-builtin types (currently `ToastCreateOptions`) get a named `import type` from the WA module. A second latent bug in the cast-signature parser (naive `.split(':')` against types containing colons) was fixed by refactoring `MethodInfo` to carry structured `parameters: Array<{name, type}>`.

### Fixed

- **Changelog: commit hashes are stripped from indented bullets (F-142).** `scripts/post-changeset-version.ts`'s hash-stripping regex (`/^- [a-f0-9]{7}: /gm`) ran before the indent-unwrap step, so changesets that wrap entries inside `### Patch Changes` bullets (`  - abc1234: …`) kept their hashes through the rewrite. Reordered so hash-stripping runs after unwrapping; both un-indented and originally-indented entries are now cleaned.

### Added

- **`pnpm generate:react` / `pnpm generate:vue` / `pnpm generate:angular` / `pnpm generate:templates`** package.json scripts, mirroring the existing `generate:metadata` / `generate:skill-refs` pattern. Run after editing a generator script or `src/utils/component-metadata.ts` to regenerate the `templates/<framework>/**` tree.
- **Snapshot-pinned unit tests** for `scripts/generate-{react,vue,angular}-templates.ts` and `scripts/post-changeset-version.ts` (34 tests, 18 external snapshots), bringing all four scripts into the unit-only coverage gate at ≥70% per file (F-125, original cluster P phase 4 scope).
