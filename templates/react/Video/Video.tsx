import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaVideo from '@awesome.me/webawesome/dist/components/video/video.js';
import './Video.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/video/video.js'));
}

/**
 * Displays a video player with customizable controls, captions, and thumbnails
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Video />
 *
 * // With event handlers
 * <Video
 *   onTimeupdate={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<VideoRef>(null);
 * <button onClick={() => ref.current?.play()}>Call Method</button>
 * <Video ref={ref} />
 * ```
 */
export interface VideoProps extends Omit<
  HTMLAttributes<HTMLElement>,
  | 'onTimeupdate'
  | 'onPlay'
  | 'onPause'
  | 'onVolumechange'
  | 'onError'
  | 'onEnded'
  | 'onLoadedmetadata'
  | 'dir'
> {
  /** The set of controls to display */
  controls?: 'none' | 'standard' | 'full';

  /** The video source URL */
  src?: string;

  /** The poster image URL shown before playback */
  poster?: string;

  /** The video title */
  title?: string;

  /** URL to a WebVTT file for timeline thumbnail previews */
  thumbnails?: string;

  /** Whether the video is currently playing */
  playing?: boolean;

  /** Whether the video is muted */
  muted?: boolean;

  /** The volume level from 0 to 1 */
  volume?: number;

  /** Automatically start playback when connected */
  autoplay?: boolean;

  /** Restart playback when the video ends */
  loop?: boolean;

  /** Autoplay in a muted state */
  'autoplay-muted'?: boolean;

  /** Resume playback when scrolled back into view */
  'autoplay-on-visible'?: boolean;

  /** The browser preload strategy */
  preload?: 'auto' | 'metadata' | 'none';

  /** The icon library used for built-in control icons */
  'icon-library'?: string;

  onTimeupdate?: (event: CustomEvent) => void;

  onPlay?: (event: CustomEvent) => void;

  onPause?: (event: CustomEvent) => void;

  onVolumechange?: (event: CustomEvent) => void;

  onError?: (event: Event) => void;

  onEnded?: (event: CustomEvent) => void;

  onLoadedmetadata?: (event: CustomEvent) => void;
}

export interface VideoRef {
  play: () => void;

  pause: () => void;

  togglePlay: () => void;

  toggleMute: () => void;

  seek: (time: number) => void;

  setVolume: (volume: number) => void;

  setPlaybackRate: (rate: number) => void;

  requestFullscreen: () => void;

  exitFullscreen: () => void;

  getVideoElement: () => void;

  getState: () => void;
  /** Reference to the underlying HTML element */
  element: WaVideo | null;
}

export const Video = forwardRef<VideoRef, VideoProps>(
  (
    {
      children,
      className,
      onTimeupdate,
      onPlay,
      onPause,
      onVolumechange,
      onError,
      onEnded,
      onLoadedmetadata,
      ...props
    },
    ref
  ) => {
    const videoRef = useRef<WaVideo | null>(null);
    const setVideoRef = useCallback((el: WaVideo | null) => {
      videoRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          if (videoRef.current && typeof videoRef.current.play === 'function') {
            videoRef.current.play();
          }
        },
        pause: () => {
          if (
            videoRef.current &&
            typeof videoRef.current.pause === 'function'
          ) {
            videoRef.current.pause();
          }
        },
        togglePlay: () => {
          if (
            videoRef.current &&
            typeof videoRef.current.togglePlay === 'function'
          ) {
            videoRef.current.togglePlay();
          }
        },
        toggleMute: () => {
          if (
            videoRef.current &&
            typeof videoRef.current.toggleMute === 'function'
          ) {
            videoRef.current.toggleMute();
          }
        },
        seek: (time: number) => {
          if (videoRef.current && typeof videoRef.current.seek === 'function') {
            videoRef.current.seek(time);
          }
        },
        setVolume: (volume: number) => {
          if (
            videoRef.current &&
            typeof videoRef.current.setVolume === 'function'
          ) {
            videoRef.current.setVolume(volume);
          }
        },
        setPlaybackRate: (rate: number) => {
          if (
            videoRef.current &&
            typeof videoRef.current.setPlaybackRate === 'function'
          ) {
            videoRef.current.setPlaybackRate(rate);
          }
        },
        requestFullscreen: () => {
          if (
            videoRef.current &&
            typeof videoRef.current.requestFullscreen === 'function'
          ) {
            videoRef.current.requestFullscreen();
          }
        },
        exitFullscreen: () => {
          if (
            videoRef.current &&
            typeof videoRef.current.exitFullscreen === 'function'
          ) {
            videoRef.current.exitFullscreen();
          }
        },
        getVideoElement: () => {
          if (
            videoRef.current &&
            typeof videoRef.current.getVideoElement === 'function'
          ) {
            videoRef.current.getVideoElement();
          }
        },
        getState: () => {
          if (
            videoRef.current &&
            typeof videoRef.current.getState === 'function'
          ) {
            videoRef.current.getState();
          }
        },
        get element() {
          return videoRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = videoRef.current;
      if (!el) return;

      const handleTimeupdate = (e: Event) => {
        if (onTimeupdate) onTimeupdate(e as CustomEvent);
      };

      const handlePlay = (e: Event) => {
        if (onPlay) onPlay(e as CustomEvent);
      };

      const handlePause = (e: Event) => {
        if (onPause) onPause(e as CustomEvent);
      };

      const handleVolumechange = (e: Event) => {
        if (onVolumechange) onVolumechange(e as CustomEvent);
      };

      const handleError = (e: Event) => {
        if (onError) onError(e as Event);
      };

      const handleEnded = (e: Event) => {
        if (onEnded) onEnded(e as CustomEvent);
      };

      const handleLoadedmetadata = (e: Event) => {
        if (onLoadedmetadata) onLoadedmetadata(e as CustomEvent);
      };

      el.addEventListener('timeupdate', handleTimeupdate);
      el.addEventListener('play', handlePlay);
      el.addEventListener('pause', handlePause);
      el.addEventListener('volumechange', handleVolumechange);
      el.addEventListener('error', handleError);
      el.addEventListener('ended', handleEnded);
      el.addEventListener('loadedmetadata', handleLoadedmetadata);

      return () => {
        el.removeEventListener('timeupdate', handleTimeupdate);
        el.removeEventListener('play', handlePlay);
        el.removeEventListener('pause', handlePause);
        el.removeEventListener('volumechange', handleVolumechange);
        el.removeEventListener('error', handleError);
        el.removeEventListener('ended', handleEnded);
        el.removeEventListener('loadedmetadata', handleLoadedmetadata);
      };
    }, [
      onTimeupdate,
      onPlay,
      onPause,
      onVolumechange,
      onError,
      onEnded,
      onLoadedmetadata,
    ]);

    return (
      <wa-video
        ref={setVideoRef}
        class={clsx('Video', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-video>
    );
  }
);

Video.displayName = 'Video';
