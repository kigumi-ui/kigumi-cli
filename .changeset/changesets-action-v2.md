---
'kigumi': patch
---

### Fixed

Migrated the release workflow to `changesets/action` v2.

v2 renamed every input the workflow used (`version`, `publish`, `commit`,
`title`, `createGithubReleases`) and replaced the `GITHUB_TOKEN` env var with an
explicit `github-token` input. GitHub Actions ignores unknown `with:` keys
silently, so the v1-shaped call would not have failed CI. The next release would
have stopped opening the version PR and published unauthenticated.

v2 also dropped the action's own `.npmrc` handling, which is what consumed
`NPM_TOKEN`. Registry auth is now written explicitly before `changeset publish`,
into `$HOME` rather than the workspace so it cannot be swept into the release
commit, and it fails fast with an actionable message when the token is missing
or rejected.
