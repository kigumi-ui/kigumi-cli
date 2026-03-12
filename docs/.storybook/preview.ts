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

// Apply WA theme classes to <html> (mirrors src/lib/kigumi.ts)
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
          'Style',
          [
            'Color Variants',
            'Native Styles',
            'Reducing FOUCE',
            'Rounding Utilities',
            'Text',
            'Visually Hidden',
          ],
          'Layout',
          [
            'Align Items',
            'Cluster',
            'Flank',
            'Flex Wrap',
            'Frame',
            'Gap',
            'Grid',
            'Justify Content',
            'Split',
            'Stack',
          ],
          'Design Tokens',
          [
            'Color',
            'Space',
            'Typography',
            'Border',
            'Shadow',
            'Focus',
            'Transition',
            'Component Groups',
          ],
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
    chromatic: { disableSnapshot: true },
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
