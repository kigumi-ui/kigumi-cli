## Summary

<!-- What does this change, and why? -->

## Changes

<!-- The notable pieces, one per line. -->

## Verification

<!-- What you ran, and what it said. Paste output rather than asserting success. -->

- [ ] `pnpm type-check`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm validate:registry` and `pnpm validate:templates` (if templates or the registry changed)

## Checklist

- [ ] Component wrappers were changed in `templates/`, not in generated output
- [ ] A changeset is included for user-facing changes (`pnpm changeset`)
- [ ] Docs updated (README and the relevant `AGENTS.md`) if commands, utils, or schemas changed
