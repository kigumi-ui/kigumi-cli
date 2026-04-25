import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaMarkdown from '@awesome.me/webawesome/dist/components/markdown/markdown.js';
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
 * <button onClick={() => ref.current?.renderMarkdown()}>Call Method</button>
 * <Markdown ref={ref} />
 * ```
 */
export interface MarkdownProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** Tab stop width for whitespace normalization */
  'tab-size'?: number;
}

export interface MarkdownRef {

  /** Reads the script content, normalizes whitespace, parses markdown, and injects the result. */
  renderMarkdown: () => void;
  /** Reference to the underlying HTML element */
  element: WaMarkdown | null;
}

export const Markdown = forwardRef<MarkdownRef, MarkdownProps>(
  ({ children, className, ...props }, ref) => {
    const markdownRef = useRef<WaMarkdown | null>(null);
    const setMarkdownRef = useCallback((el: WaMarkdown | null) => {
      markdownRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
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
        ref={setMarkdownRef}
        class={clsx('Markdown', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-markdown>
    );
  }
);

Markdown.displayName = 'Markdown';
