---
'kigumi': patch
---

### Changed

- **Internal**: moved `installDependencies` and `cleanupOldPackage` from `src/commands/init/installer.ts` to `src/utils/dependency-installer.ts`. Both `init` and `upgrade` install dependencies, but the code lived under `init/`, so `upgrade.ts` had to reach into another command's directory. That was the only cross-command import in the codebase. Internal refactor with no change to CLI behaviour.
