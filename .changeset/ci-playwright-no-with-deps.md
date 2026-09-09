---
'kigumi': patch
---

### Fixed

The Storybook interaction lane no longer installs Playwright's system
dependencies, removing a hard dependency on Google's Debian mirror from CI.

`playwright install --with-deps` shells out to apt. When that mirror serves a
corrupted package index the job fails before running any test, which is what
repeatedly blocked the 1.0.0 release PR. Measured on a passing run, 24 of the 33
packages were already present on the runner; the 9 actually installed were fonts
with no bearing on a Latin-only, non-pixel-comparing test lane.
