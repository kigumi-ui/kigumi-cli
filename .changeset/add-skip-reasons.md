---
'kigumi': patch
---

### Fixed

- **add**: A component `kigumi add` leaves alone now says why. Files that already match the template read "already up to date" (also with `--force`, which overwrites only what differs), a component `--all` skips without `--force` says to pass `--force` to overwrite it, and a declined overwrite says your local version was kept. Before, all three printed "already exists", which made `--force` look ignored. The summary counts each reason on its own line, and a run where everything was already up to date ends with "Already up to date" instead of "No new components added". The same applies to `kigumi add --from`.
