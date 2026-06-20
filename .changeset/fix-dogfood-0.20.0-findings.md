---
'kigumi': patch
---

### Fixed

- **Web Awesome is now pinned to an exact version (F-146).** A kigumi release is conformant to one specific Web Awesome version and must never auto-float to a newer upstream release. Three gaps let it drift: the version map had no `0.20.0` entry and stored every `webAwesomeVersion` as a caret range, the config builder wrote the static default into `kigumi.config.json`, and the installer let npm/pnpm rewrite the version to a `^` range via their default save-prefix. The version map now carries a `0.20.0` entry pinned to `3.5.0` (with all historical entries exact too), the config builder reads the exact version from the map for the running CLI version, and the installer passes `--save-exact` (`--exact` for yarn) so the exact version survives into `package.json`.
- **`kigumi status` now detects the Pro token across the full fallback chain (F-147).** The token check read only the project `.env`, so a correctly-configured Pro user whose token lives in the environment or `~/.npmrc` saw "Token: Not found" alongside a correct "Tier: pro". Status now uses the same `env -> ~/.npmrc -> .env` chain as installs and tier detection, and surfaces where the token was found in text mode.

### Added

- **`kigumi brand` and `kigumi palette` accept `--yes` (F-148).** They were the only mutating commands without the flag, so a scripted `kigumi brand red --yes` failed with "unknown option '--yes'" while `init` / `add` / `update` / `upgrade` accepted it. With no positional argument, `--yes` keeps the current value without prompting; an explicit argument still wins.
- **`kigumi list` badges Pro components on Pro tier (F-149).** Every component previously rendered identically on Pro tier, so a Pro user could not tell which ones require Pro. Pro components now carry a `[Pro]` badge. Free tier is unchanged (dimmed `(Pro)` prefix), and Free components are never badged.
