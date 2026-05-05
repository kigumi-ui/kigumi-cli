import type { Preview } from '@storybook/react-vite';
import '@/styles/layers.css';

// Pre-warm Vite's deps optimizer with every wa-* wrapper. Loading the
// barrel here (rather than in vitest.setup.ts) keeps the plugin's
// setup-file ordering intact while still forcing the optimizer to
// crawl all wa-* deps before any story file runs. Without this, the
// optimizer rebundles when the first story file imports its
// components and invalidates "?v=<hash>" URLs already in flight from
// the iframe orchestrator (Select.stories.tsx hit this on every CI
// run).
import '@/components/ui';

// Test-only preview. Mirrors the bits of .storybook/preview.ts that affect
// rendering (custom-element define guard, theme classes, theme decorator)
// but does not import DocsContainer from @storybook/addon-docs/blocks. The
// docs container is purely an autodocs-page customization, irrelevant to
// play() interaction tests, and importing it forces Vite's deps optimizer
// to bundle the addon-docs subgraph (cache races in headless CI).
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

if (typeof document !== 'undefined') {
  document.documentElement.classList.add(
    'wa-theme-tailspin',
    'wa-palette-rudimentary',
    'wa-brand-purple'
  );
}

const preview: Preview = {
  parameters: {
    layout: 'padded',
    a11y: { test: 'todo' },
  },
  decorators: [
    (Story, ctx) => {
      const html = document.documentElement;
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
