---
'kigumi': minor
---

**Removed the inert `--no-types` flag from `kigumi add`.** The flag was accepted but never read: TypeScript output has always been controlled by the `typescript` field in `kigumi.config.json`, which `kigumi init` sets from your project. Passing `--no-types` silently did nothing, so it is gone rather than left as a promise the CLI does not keep.
