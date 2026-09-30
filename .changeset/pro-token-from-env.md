---
'kigumi': patch
---

### Fixed

- **Pro install**: `kigumi init` no longer fails with a 401 when your Web Awesome Pro token is only in `WEBAWESOME_NPM_TOKEN`, in the project `.env`, or passed with `--token`. The project `.npmrc` now reads the token through `//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${WEBAWESOME_NPM_TOKEN}`, which holds no secret and is safe to commit, and Kigumi hands the token it found to the package manager. If your token is in `~/.npmrc`, `.npmrc` stays registry-only, because a project line would take precedence over yours. Re-running `kigumi init` updates an older `.npmrc`, and so does `kigumi upgrade` when it installs a new Web Awesome version. A token you pass with `--token` or at the prompt is the one `init` installs with, and replaces an older one in `.env`.
- **.npmrc**: `kigumi init` keeps the lines of an existing `.npmrc` instead of overwriting the file, and never replaces an auth line you wrote.
- **Pro token detection**: Kigumi reads the user npmrc that npm and pnpm read (`npm_config_userconfig` when set), resolves `${VAR}` values in it, and no longer takes a commented-out line for a token.
- **Pro guidance**: The 401 note names the two setups npm and pnpm authenticate from (the variable, or `npm config set` once per machine) instead of `.env`, which they never read. The Pro upgrade hints point at `kigumi init` instead of `.env` or a `tier` key in `kigumi.config.json`. When pnpm cannot fill the reference and fails with a 404, the same guidance shows. After a Pro install, Kigumi warns when `.npmrc` reads `WEBAWESOME_NPM_TOKEN` and your shell does not set it (with `--no-install`, Next Steps says so), and `init --no-install` shows the install step again.

### Security

- **Pro token**: The token prompt in `kigumi init` is masked. `init` also makes sure `.gitignore` keeps `.env`, where it saves the token, out of git: a `.gitignore` that listed only `.env.local` or `!.env.example` used to count as ignoring it.
