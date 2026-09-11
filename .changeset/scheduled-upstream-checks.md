---
'kigumi': patch
---

### Added

- Run all 15 validators on the weekly maintenance schedule, not only when a pull request touches a file. Drift caused by the outside world moving is now visible without anyone editing anything.
- Report external links in `README.md` and `NOTICE` weekly. Requests are sequential with a retry, so throttling is not mistaken for a dead page.
- Report weekly when Web Awesome or a tracked toolchain package publishes a version ahead of the pins. Upgrading stays a decision; nothing is changed automatically.

Both upstream reports open or update an issue and always exit successfully, so a third-party outage can never turn the repository red.
