import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './Markdown.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/markdown/markdown.js'));
}

/**
 * Renders markdown content in plain HTML
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Markdown />
 *
 * // With event handlers
 * <Markdown />
 *
 * // With ref methods
 * const ref = useRef<MarkdownRef>(null);
 * <button onClick={() => ref.current?.getMarked()}>Call Method</button>
 * <Markdown ref={ref} />
 * ```
 */
export interface MarkdownProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** Tab stop width for whitespace normalization */
  'tab-size'?: number;
}

export interface MarkdownRef {

  /** Returns the shared Marked instance used by all `<wa-markdown>` components. */
  getMarked: () => void;

  /** Re-renders all connected `<wa-markdown>` instances. Call this after changing the Marked configuration. */
  updateAll: () => void;

  /** Reads the script content, normalizes whitespace, parses markdown, and injects the result. */
  renderMarkdown: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Markdown = forwardRef<MarkdownRef, MarkdownProps>(
  ({ children, className, ...props }, ref) => {
    const markdownRef = useRef<HTMLElement & {
      getMarked?: () => void;
      updateAll?: () => void;
      renderMarkdown?: () => void;
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
        getMarked: () => {
          if (markdownRef.current && typeof markdownRef.current.getMarked === 'function') {
            markdownRef.current.getMarked();
          }
        },
        updateAll: () => {
          if (markdownRef.current && typeof markdownRef.current.updateAll === 'function') {
            markdownRef.current.updateAll();
          }
        },
        renderMarkdown: () => {
          if (markdownRef.current && typeof markdownRef.current.renderMarkdown === 'function') {
            markdownRef.current.renderMarkdown();
          }
        },
        get element() {
          return markdownRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-markdown
        ref={markdownRef}
        class={clsx('Markdown', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-markdown>
    );
  }
);

Markdown.displayName = 'Markdown';
