---
'kigumi': minor
---

### Changed

- **add**: `kigumi add` no longer writes a test file next to each component. Projects with Vitest or Jest plus Testing Library got one, and Angular projects always did, but the stub only checked that the Web Awesome element rendered. Kigumi's own test suite now checks every component against Web Awesome's manifest instead. Test files you already have stay where they are and are yours to keep or delete.
- **diff / update**: Test files are no longer compared or merged. `kigumi diff` stops reporting a missing `Button.test.tsx` in projects that never had one, and `kigumi update --force` no longer overwrites a test you wrote. A copy of the old test file in `.kigumi/snapshots/` is removed the next time `add` or `update` saves that component's snapshot.
