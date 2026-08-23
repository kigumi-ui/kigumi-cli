---
'kigumi': patch
---

### Added

- **validate:wa-pins**: A new check that holds every location naming a Web Awesome version to the same exact version, and enforces the upgrade-path invariant that the newest `VERSION_MAP` entry matches `DEFAULT_WEBAWESOME_VERSION`. That invariant was previously unenforced: `kigumi upgrade` installs whatever the newest map entry names, so bumping Web Awesome without adding an entry made upgrade hand users an older Web Awesome than the CLI ships, with nothing failing. The check also rejects range syntax, since a Kigumi release targets one specific Web Awesome version and must never auto-float. It runs in `validate:all`, in CI as its own step, in the release-readiness gates, and in the stop hook whenever a file naming a version changes.
