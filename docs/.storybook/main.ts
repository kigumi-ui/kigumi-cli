import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
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
  viteFinal: async (config) => {
    if (process.env.NODE_ENV !== 'development') {
      config.base = '/docs/';
    }
    return config;
  },
};
export default config;
