---
'kigumi': minor
---

### Vue DX overhaul

- **v-model support**: Vue SFC templates now use `defineModel()` for two-way binding on form controls (`Input`, `Select`, `Checkbox`, `Switch`, `Slider`, etc.) and overlay open state (`Dialog`, `Drawer`, `Dropdown`)
- **Component-specific events**: Each template forwards its Web Awesome events (e.g. `wa-input`, `wa-change`, `wa-show`, `wa-hide`) instead of only generic `wa-blur`/`wa-focus`
- **Named slots**: Templates expose all component slots (`header`, `footer`, `label`, `prefix`, `suffix`, etc.)
- **Vue project scaffolding**: `kigumi init` now configures Vite plugin and tsconfig paths for Vue projects
- **JSON parser fix**: Replaced regex-based `stripJSONComments` with a state-machine parser that no longer corrupts glob patterns like `src/**/*.ts` in tsconfig files
- **New docs**: Vue Guide page, Customize page, framework-aware code blocks in Getting Started
- **Style stories migrated to MDX**: All 6 Style category stories converted from `.stories.tsx` to MDX format
