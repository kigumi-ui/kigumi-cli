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

// Start with Tailspin branding; the global decorator toggles per-story
if (typeof document !== 'undefined') {
  document.documentElement.classList.add(
    'wa-theme-tailspin',
    'wa-palette-rudimentary',
    'wa-brand-purple'
  );
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
          'General',
          ['Welcome', 'Getting Started', 'CLI', 'Roadmap', 'FAQ', 'Changelog'],
          'Guides',
          [
            'Customize',
            'Updating Components',
            'Community Registries',
            'Monorepo Setup',
            'Agent Skills',
          ],
          'Foundations',
          [
            'Overview',
            'Color',
            'Typography',
            'Spacing',
            'Border & Radius',
            'Elevation',
            'Focus',
            'Motion',
            'Visibility',
            'Native Elements',
            'Component Tokens',
            'Cascade Layers & Customizing',
          ],
          'Layout',
          [
            'Overview',
            'Stack',
            'Cluster',
            'Grid',
            'Split',
            'Flank',
            'Frame',
            'Alignment',
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
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
    docs: {
      container: DocsContainer,
    },
  },
  decorators: [
    (Story, ctx) => {
      const html = document.documentElement;
      const theme = (ctx.globals?.theme as string) ?? 'system';
      const resolved =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      html.classList.toggle('wa-dark', resolved === 'dark');

      // Theme: Components render in WA Default (matches Figma Kit),
      // all other pages keep Kigumi Tailspin branding
      const useDefaultTheme =
        ctx.viewMode === 'story' &&
        (ctx.title?.startsWith('Components/') ||
          ctx.title?.startsWith('Foundations/') ||
          ctx.title?.startsWith('Layout/'));

      html.classList.toggle('wa-theme-tailspin', !useDefaultTheme);
      html.classList.toggle('wa-palette-rudimentary', !useDefaultTheme);
      html.classList.toggle('wa-brand-purple', !useDefaultTheme);

      html.classList.toggle('wa-theme-default', useDefaultTheme);
      html.classList.toggle('wa-palette-default', useDefaultTheme);
      html.classList.toggle('wa-brand-blue', useDefaultTheme);

      return Story();
    },
  ],
};

export default preview;
