---
'kigumi': patch
---

### Added

- **Pro registry**: `KIGUMI_PRO_REGISTRY` names a registry that serves Web Awesome Pro instead of Cloudsmith, such as a company mirror. `init`, `upgrade` and token detection use it for the registry line and the auth key alike; unset, empty or not an http(s) URL, Cloudsmith stays the registry.
