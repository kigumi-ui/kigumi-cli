---
'kigumi': minor
---

### Added

- **Cross-framework conversion**: New `--cross-framework` flag on `kigumi add` lets a project consume components from a community registry that targets a different framework. Source-framework files are staged into `.kigumi/foreign/<slug>/` (with `_meta.json` recording source/target framework and registry provenance) for an agent-driven conversion.
- **Local filesystem registries**: `kigumi registry connect` and `kigumi add --from` now accept absolute or relative filesystem paths in addition to GitHub URLs, via a new `RegistrySource` discriminated union (`GitHubRegistrySource | LocalRegistrySource`). Local sources skip the `~/.kigumi/cache` layer.
- **kigumi-cross-framework skill**: New end-user skill at `.claude/skills/kigumi-cross-framework/` that translates Kigumi components between React, Vue, and Angular. Reads `_meta.json`, loads the matching `kigumi-{target}` skill plus any relevant `kigumi-compose-*` skill via the Skill tool, applies state/effect/event/control-flow mappings, and writes the converted file. Published to `kigumi.style/.well-known/skills/`.
- **Foreign-files staging**: New `src/utils/foreign-files-staging.ts` helper writes the staged source files plus `_meta.json` and returns the canonical hand-off prompt. `.kigumi/foreign/` is seeded into the gitignore template.

### Changed

- **`kigumi registry connect`**: Framework mismatch is now downgraded from a hard error to a warning so consumers can connect a foreign-framework registry first and later use `--cross-framework` to fetch from it.
- **`FrameworkMismatchError`**: Now lists `--cross-framework` as a fourth resolution path in its suggestion bullets.
