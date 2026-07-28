---
'kigumi': patch
---

**`diff` and `update` no longer skip community components silently.** Components installed from a community registry have no built-in template to compare against, so both commands dropped them from the scan and then reported "all components are up to date". They are now listed explicitly, with the registry they came from and what to do about them.
