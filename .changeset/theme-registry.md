---
'kigumi': minor
---

Community registry support: connect, install components and themes from GitHub-hosted registries.

### New Features

- **`kigumi registry connect <url>`** — Connect a community registry to your project
- **`kigumi registry list`** — List connected registries
- **`kigumi registry remove <name>`** — Remove a connected registry
- **`kigumi registry init`** — Scaffold a new community registry
- **`kigumi registry validate`** — Validate registry structure
- **`kigumi registry add-component`** — Add a component entry to registry.json
- **`kigumi registry add-theme`** — Add a theme entry to registry.json
- **`kigumi add --from <source>`** — Install components from a community registry (accepts URL or connected name)
- **`kigumi theme install --from <source>`** — Install themes from a community registry (accepts URL or connected name)
- **Name-based registry lookup** — `--from` accepts saved registry names (e.g. `--from mischa-dev`) in addition to full URLs

### Bug Fixes

- Generated type declarations now include `class?: string` on all `wa-*` elements
- Community themes correctly import from local `community-themes/` directory instead of Web Awesome package path
