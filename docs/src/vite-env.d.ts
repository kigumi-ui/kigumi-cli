/// <reference types="vite/client" />

/**
 * Web Awesome JSX Types
 *
 * This extends React's JSX.IntrinsicElements with Web Awesome custom elements.
 * Uses the official types from the @awesome.me/webawesome-pro package.
 *
 * IMPORTANT: Uses 'declare global' to extend JSX without overwriting React module.
 *
 * @see https://webawesome.com/docs/#react-users
 */

import type {
  CustomElements,
  CustomCssProperties,
} from '@awesome.me/webawesome-pro/dist/custom-elements-jsx.d.ts';

declare global {
  // CLI version injected at build time
  const __CLI_VERSION__: string;

  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends CustomElements {}
  }
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface CSSProperties extends CustomCssProperties {}
}

export {};
