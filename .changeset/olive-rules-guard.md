---
'kigumi': patch
---

Add the `kigumi/no-cross-command-import` lint rule. Commands are leaf nodes:
shared code belongs in `src/utils/`, never in a sibling command's directory.
Internal tooling only, no change to CLI behaviour.
