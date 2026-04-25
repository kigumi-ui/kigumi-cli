import type {
  CustomElements,
  CustomCssProperties,
} from '@awesome.me/webawesome/dist/custom-elements-jsx.d.ts';

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends CustomElements {}
  }
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface CSSProperties extends CustomCssProperties {}
}
