import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '!../src/stories/VueGuide.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  core: {
    disableTelemetry: true,
  },
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-links',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: '@storybook/react-vite',
};
export default config;
