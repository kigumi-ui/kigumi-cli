import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/markdown/markdown.js';
import './Markdown.css';

/**
 * Renders markdown content in plain HTML
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Markdown>
 *   <script type="text/markdown"># Hello World</script>
 * </Markdown>
 *
 * // With tab size
 * <Markdown tab-size={2}>
 *   <script type="text/markdown">	Indented content</script>
 * </Markdown>
 * ```
 */
export interface MarkdownProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Tab stop width for whitespace normalization */
  'tab-size'?: number;
}

export interface MarkdownRef {
  /** Re-renders the markdown content */
  renderMarkdown: () => void;
  /** Returns the marked instance used for rendering */
  getMarked: () => unknown;
  /** Updates all wa-markdown elements on the page */
  updateAll: () => void;
  /** Reference to the underlying element */
  element: HTMLElement | null;
}

export const Markdown = forwardRef<MarkdownRef, MarkdownProps>(
  ({ children, className, ...props }, ref) => {
    const markdownRef = useRef<
      HTMLElement & {
        renderMarkdown?: () => void;
        getMarked?: () => unknown;
        constructor: { updateAll?: () => void };
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        renderMarkdown: () => {
          if (
            markdownRef.current &&
            typeof markdownRef.current.renderMarkdown === 'function'
          ) {
            markdownRef.current.renderMarkdown();
          }
        },
        getMarked: () => {
          if (
            markdownRef.current &&
            typeof markdownRef.current.getMarked === 'function'
          ) {
            return markdownRef.current.getMarked();
          }
        },
        updateAll: () => {
          const el = markdownRef.current;
          if (
            el?.constructor &&
            typeof el.constructor.updateAll === 'function'
          ) {
            el.constructor.updateAll();
          }
        },
        get element() {
          return markdownRef.current;
        },
      }),
      []
    );

    return (
      <wa-markdown
        ref={markdownRef}
        class={clsx('Markdown', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-markdown>
    );
  }
);

Markdown.displayName = 'Markdown';
