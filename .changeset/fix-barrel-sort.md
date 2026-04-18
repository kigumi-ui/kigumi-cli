---
'kigumi': patch
---

### Changed

- **`kigumi add` now writes `src/components/index.ts` with alphabetically sorted exports.** Previously, new barrel exports were appended in installation order, which made the file harder to scan as more components were added. The order of the exports in an existing index file is now normalized on every `add`. No behavioral change to the generated component code itself; only the order of lines in the barrel file is affected.
