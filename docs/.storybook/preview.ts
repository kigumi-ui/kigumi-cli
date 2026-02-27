import type { Preview } from '@storybook/react-vite';
import '@/styles/layers.css';
import { DocsContainer } from './DocsContainer';

// Apply WA theme classes to <html> (mirrors src/lib/webawesome.ts)
if (typeof document !== 'undefined') {
  const html = document.documentElement;
  html.className = html.className
    .replace(/\bwa-theme-\S+/g, '')
    .replace(/\bwa-palette-\S+/g, '')
    .replace(/\bwa-brand-\S+/g, '');
  html.classList.add('wa-theme-tailspin');
  html.classList.add('wa-palette-rudimentary');
  html.classList.add('wa-brand-purple');
}

const preview: Preview = {
  globalTypes: {
    theme: {
      toolbar: {
        icon: 'circlehollow',
        items: ['light', 'dark', 'system'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'system',
  },
  parameters: {
    layout: 'padded',
    options: {
      storySort: {
        order: ['Kigumi', ['Welcome', 'Getting Started'], 'Components'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {},
    docs: {
      container: DocsContainer,
    },
  },
  decorators: [
    (Story, ctx) => {
      const theme = (ctx.globals?.theme as string) ?? 'system';
      const resolved =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      document.documentElement.classList.toggle('wa-dark', resolved === 'dark');
      return Story();
    },
  ],
};

export default preview;
