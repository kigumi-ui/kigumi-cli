import type { StorybookConfig } from '@storybook/react-vite';

// Dedicated Storybook config for the storybook-vitest lane. Three reasons
// for the split from .storybook/main.ts:
//   1. Stories glob is narrowed to the 22 interaction-tagged files so the
//      vitest browser orchestrator does not try to import untagged stories
//      whose iframe handshake flakes in headless CI (e.g. ToastItem,
//      ProgressRing).
//   2. @storybook/addon-docs is omitted. The dev preview imports
//      DocsContainer from @storybook/addon-docs/blocks, which forces Vite's
//      deps optimizer to bundle the addon-docs subgraph; under load the
//      optimizer rebundles mid-run and previously cached "?v=<hash>" URLs
//      404 (Select.stories.tsx hit this on every run).
//   3. addon-vitest is the only addon the lane needs (a11y annotations are
//      imported manually in vitest.setup.ts).
const config: StorybookConfig = {
  stories: [
    '../src/stories/Button.stories.tsx',
    '../src/stories/Carousel.stories.tsx',
    '../src/stories/Checkbox.stories.tsx',
    '../src/stories/Combobox.stories.tsx',
    '../src/stories/CopyButton.stories.tsx',
    '../src/stories/Details.stories.tsx',
    '../src/stories/Dialog.stories.tsx',
    '../src/stories/Drawer.stories.tsx',
    '../src/stories/Dropdown.stories.tsx',
    '../src/stories/Input.stories.tsx',
    '../src/stories/NumberInput.stories.tsx',
    '../src/stories/Popover.stories.tsx',
    '../src/stories/Radio.stories.tsx',
    '../src/stories/RadioGroup.stories.tsx',
    '../src/stories/Rating.stories.tsx',
    '../src/stories/Select.stories.tsx',
    '../src/stories/Slider.stories.tsx',
    '../src/stories/Switch.stories.tsx',
    '../src/stories/TabGroup.stories.tsx',
    '../src/stories/Textarea.stories.tsx',
    '../src/stories/Tooltip.stories.tsx',
    '../src/stories/Tree.stories.tsx',
  ],
  core: {
    disableTelemetry: true,
  },
  addons: ['@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
};
export default config;
