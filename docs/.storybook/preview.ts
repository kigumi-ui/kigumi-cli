import type { Preview } from '@storybook/react-vite';
import '@/styles/layers.css';
import { DocsContainer } from './DocsContainer';

// Prevent duplicate custom-element registrations when Web Awesome components
// share internal dependencies (e.g. toast-item internally uses progress-ring)
if (typeof customElements !== 'undefined') {
  const _ceDefine = customElements.define.bind(customElements);
  customElements.define = function (
    name: string,
    ctor: CustomElementConstructor,
    options?: ElementDefinitionOptions
  ) {
    if (!customElements.get(name)) _ceDefine(name, ctor, options);
  };
}

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
        order: [
          'Kigumi',
          ['Welcome', 'Getting Started', 'Changelog'],
          'Components',
        ],
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
