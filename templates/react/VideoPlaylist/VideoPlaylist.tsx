import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaVideoPlaylist from '@awesome.me/webawesome/dist/components/video-playlist/video-playlist.js';
import './VideoPlaylist.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/video-playlist/video-playlist.js'));
}

/**
 * Groups multiple videos into a playlist with next/previous navigation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <VideoPlaylist />
 *
 * // With event handlers
 * <VideoPlaylist
 *   onVideoChange={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<VideoPlaylistRef>(null);
 * <button onClick={() => ref.current?.next()}>Call Method</button>
 * <VideoPlaylist ref={ref} />
 * ```
 */
export interface VideoPlaylistProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onVideoChange' | 'dir'
> {
  /** The set of controls forwarded to each child video */
  controls?: 'none' | 'standard' | 'full';

  /** The icon library used for placeholder icons */
  'icon-library'?: string;

  onVideoChange?: (event: CustomEvent) => void;
}

export interface VideoPlaylistRef {
  next: () => void;

  previous: () => void;

  goTo: (index: number) => void;
  /** Reference to the underlying HTML element */
  element: WaVideoPlaylist | null;
}

export const VideoPlaylist = forwardRef<VideoPlaylistRef, VideoPlaylistProps>(
  ({ children, className, onVideoChange, ...props }, ref) => {
    const videoplaylistRef = useRef<WaVideoPlaylist | null>(null);
    const setVideoPlaylistRef = useCallback((el: WaVideoPlaylist | null) => {
      videoplaylistRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        next: () => {
          if (
            videoplaylistRef.current &&
            typeof videoplaylistRef.current.next === 'function'
          ) {
            videoplaylistRef.current.next();
          }
        },
        previous: () => {
          if (
            videoplaylistRef.current &&
            typeof videoplaylistRef.current.previous === 'function'
          ) {
            videoplaylistRef.current.previous();
          }
        },
        goTo: (index: number) => {
          if (
            videoplaylistRef.current &&
            typeof videoplaylistRef.current.goTo === 'function'
          ) {
            videoplaylistRef.current.goTo(index);
          }
        },
        get element() {
          return videoplaylistRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = videoplaylistRef.current;
      if (!el) return;

      const handleWaVideoChange = (e: Event) => {
        if (onVideoChange) onVideoChange(e as CustomEvent);
      };

      el.addEventListener('wa-video-change', handleWaVideoChange);

      return () => {
        el.removeEventListener('wa-video-change', handleWaVideoChange);
      };
    }, [onVideoChange]);

    return (
      <wa-video-playlist
        ref={setVideoPlaylistRef}
        class={clsx('VideoPlaylist', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-video-playlist>
    );
  }
);

VideoPlaylist.displayName = 'VideoPlaylist';
