---
'kigumi': patch
---

### Fixed

The Chromatic project token is no longer hardcoded in `docs/package.json`.

The `chromatic` script passed `--project-token=chpt_...` as a literal while the
CI workflow read the same credential from the `CHROMATIC_PROJECT_TOKEN`
repository secret. The workflow treated it as a secret and the local
convenience script did not. The script now relies on the environment variable
the Chromatic CLI already reads, and `docs/.env.example` documents it.

The husky hooks no longer carry an absolute path into the maintainer's home
directory. `post-commit` and `post-checkout` both pinned a `/Users/<name>/...`
interpreter path, which leaked a username to every clone and pointed at a
location that exists on no other machine. The path moves to an untracked
`.husky/.graphify-python`, read with `read` rather than the whitespace-stripping
used elsewhere, because stripping breaks any path containing a space.

### Added

`validate:no-secrets` fails the build when a tracked file contains a
provider-prefixed credential (Chromatic, npm, GitHub, Slack, AWS, OpenAI,
Anthropic, Stripe), an absolute home-directory path, or when a `.env` file is
tracked at all.

It matches on provider prefixes rather than entropy: an entropy scan flags
every hash and minified bundle, and a check that noisy gets switched off.
Placeholders like `your_token_here`, `/Users/you/...` and the existing test
fixtures are deliberately allowed so docs can keep showing the shape of a path
or token.
