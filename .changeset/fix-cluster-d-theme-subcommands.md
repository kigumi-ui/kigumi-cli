---
'kigumi': patch
---

### Fixed

- **`kigumi theme list` and `kigumi theme show` are now wired into the router.** Both commands previously produced Commander's "unknown command" error because their `Command` exports were never `.addCommand()`'d on the parent `themeCommand`. (F-077)
- **Errors from `kigumi theme set` now route through the structured output layer.** The catch block previously called `handleError(error)` without passing `output`, falling back to raw `console.error`. (F-078)

### Changed

- **Theme sub-commands route all user-facing output through `getOutput()`.** `theme list`, `theme show`, and `theme set` previously called `@clack/prompts` directly (`p.intro`, `p.note`, `p.outro`, `p.spinner`), bypassing the output abstraction used by other commands. (F-085)
- **Lazy `await import('../utils/tier.js')` calls converted to static imports** in `theme.ts`, `palette.ts`, `theme/list.ts`, and `theme/set.ts`. (F-086)
