import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/video-playlist/video-playlist.js';
import './VideoPlaylist.css';

/**
 * Groups multiple videos into a playlist with next/previous navigation
 *
 * @example
 * ```tsx
 * <VideoPlaylist>
 *   <Video src="/intro.mp4" title="Intro" />
 *   <Video src="/deep-dive.mp4" title="Deep Dive" />
 * </VideoPlaylist>
 * ```
 */
export interface VideoPlaylistProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The set of controls forwarded to each child video */
  controls?: 'none' | 'standard' | 'full';

  /** The icon library used for placeholder icons */
  'icon-library'?: string;

  /** Emitted when the active video changes. */
  onVideoChange?: (event: CustomEvent) => void;
}

export interface VideoPlaylistRef {
  /** Plays the next video in the playlist. */
  next: () => void;

  /** Plays the previous video in the playlist. */
  previous: () => void;

  /** Jumps to the video at the given index. */
  goTo: (index: number) => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const VideoPlaylist = forwardRef<VideoPlaylistRef, VideoPlaylistProps>(
  ({ children, className, onVideoChange, ...props }, ref) => {
    const videoplaylistRef = useRef<
      HTMLElement & {
        next?: () => void;
        previous?: () => void;
        goTo?: (index: number) => void;
      }
    >(null);

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
      const el = videoplaylistRef.current;
      if (!el) return;

      const handleVideoChange = (e: Event) => {
        if (onVideoChange) onVideoChange(e as CustomEvent);
      };

      el.addEventListener('wa-video-change', handleVideoChange);

      return () => {
        el.removeEventListener('wa-video-change', handleVideoChange);
      };
    }, [onVideoChange]);

    return (
      <wa-video-playlist
        ref={videoplaylistRef}
        class={clsx('VideoPlaylist', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-video-playlist>
    );
  }
);

VideoPlaylist.displayName = 'VideoPlaylist';
