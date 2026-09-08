import type { StorybookConfig } from '@storybook/react-vite';

import { interactionStoryPaths } from './interaction-stories';

// Dedicated Storybook config for the storybook-vitest lane. Three reasons
// for the split from .storybook/main.ts:
//   1. Stories are narrowed to the interaction-tagged files so the vitest
//      browser orchestrator does not try to import untagged stories whose
//      iframe handshake flakes in headless CI (e.g. ToastItem,
//      ProgressRing). The list lives in ./interaction-stories.ts, which
//      vitest.storybook.config.ts reads too, so adding a story in one place
//      keeps both the glob and the deps-optimizer warmup in sync.
//   2. @storybook/addon-docs is omitted. The dev preview imports
//      DocsContainer from @storybook/addon-docs/blocks, which forces Vite's
//      deps optimizer to bundle the addon-docs subgraph; under load the
//      optimizer rebundles mid-run and previously cached "?v=<hash>" URLs
//      404 (Select.stories.tsx hit this on every run).
//   3. addon-vitest is the only addon the lane needs (a11y annotations are
//      imported manually in vitest.setup.ts).
const config: StorybookConfig = {
  stories: interactionStoryPaths('../src/stories/'),
  core: {
    disableTelemetry: true,
  },
  addons: ['@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
};
export default config;
