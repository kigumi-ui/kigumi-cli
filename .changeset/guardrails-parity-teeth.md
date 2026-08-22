---
'kigumi': patch
---

### Fixed

- **validate:parity**: The check can now fail. Both finding types were hardcoded to `warning` while the pass/fail predicate only looked for `error`, so the script reported success no matter what it found, including the 57 real gaps it had been listing for months. Missing `files` entries and orphaned template directories are now errors.
- **registry**: Backfilled the 57 missing `files.vue` entries, so every component declares the frameworks it actually ships templates for. Each path was verified against the template file on disk.

### Changed

- **validate:parity**: Angular is now checked alongside React and Vue. It had been excluded since the script was written, so Angular metadata was never verified in either direction; it turned out to be complete. Orphan counts are now tracked per framework rather than collapsing everything that is not React into a Vue tally.
- **registry**: The four `files.vue` paths that used a nested `components/<Name>/<Name>.vue` shape now use the flat `components/<Name>.vue` form their React and Angular siblings already used.
