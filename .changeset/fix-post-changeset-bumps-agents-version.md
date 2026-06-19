---
'kigumi': patch
---

### Fixed

- **`post-changeset-version.ts` now bumps the AGENTS.md version marker in lockstep with `package.json` (F-145).** The post-`changeset version` processor reformatted CHANGELOG.md but left the `**Version**:` line in AGENTS.md pointing at the previous release. `validate-agents` requires that marker to equal `package.json`, so `validate:all` failed on every version bump until someone edited AGENTS.md by hand. The processor now rewrites the marker to the freshly-bumped version in the same step, keeping the release gate green without manual intervention. (F-145)
