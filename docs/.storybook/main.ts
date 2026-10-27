import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../storybook/public', '../public'],
  core: {
    disableTelemetry: true,
  },
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-links',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/react-vite',
  // Stories tagged `maintainer` (the Theme Agent sidebar) show in
  // `pnpm storybook` and are left out of the sidebar of every build:
  // the published Storybook and Chromatic's.
  tags: (existing, { configType }) =>
    configType === 'PRODUCTION'
      ? { ...existing, maintainer: { excludeFromSidebar: true } }
      : existing,
};
export default config;
