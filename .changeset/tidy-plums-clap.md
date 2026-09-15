---
'kigumi': patch
---

Fix `isCancel` losing its type guard in the prompts wrapper, which let a clack cancel sentinel (`symbol`) flow past `if (p.isCancel(x)) throw ...` checks as an untyped `string | symbol`. Also bumps `@clack/prompts` to 1.8.0 and `zod` to 4.6.2.
