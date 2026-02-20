import type { Preview } from '@storybook/react-vite';
import '@/styles/layers.css';

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
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
