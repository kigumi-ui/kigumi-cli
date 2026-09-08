---
'kigumi': patch
---

### Changed

The interaction-test lane's story list now lives in one module
(`docs/.storybook-test/interaction-stories.ts`) that both
`.storybook-test/main.ts` and `vitest.storybook.config.ts` derive from, instead
of being typed out by hand in both. `validate:story-lanes` additionally checks
that list against the stories actually tagged `interaction`.
