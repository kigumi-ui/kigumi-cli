import React from 'react';
import clsx from 'clsx';
import './Video.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/video/video.js'));
}

/**
 * Displays a video player with customizable controls, captions, and thumbnails
 *
 * @example
 * ```jsx
 * // Basic usage
 * <Video src="/demo.mp4" poster="/demo.jpg" title="Demo" controls="full" />
 *
 * // Using ref methods
 * const videoRef = React.useRef(null);
 * <button onClick={() => videoRef.current?.play()}>Play</button>
 * <Video ref={videoRef} src="/demo.mp4" />
 * ```
 *
 * @typedef {Object} VideoProps
 * @property {string} [controls] - The set of controls to display: none | standard | full
 * @property {string} [src] - The video source URL
 * @property {string} [poster] - The poster image URL shown before playback
 * @property {string} [title] - The video title
 * @property {string} [thumbnails] - URL to a WebVTT file for timeline thumbnail previews
 * @property {boolean} [playing] - Whether the video is currently playing
 * @property {boolean} [muted] - Whether the video is muted
 * @property {number} [volume] - The volume level from 0 to 1
 * @property {boolean} [autoplay] - Automatically start playback when connected
 * @property {boolean} [loop] - Restart playback when the video ends
 * @property {boolean} [autoplay-muted] - Autoplay in a muted state
 * @property {boolean} [autoplay-on-visible] - Resume playback when scrolled back into view
 * @property {string} [preload] - The browser preload strategy: auto | metadata | none
 * @property {string} [icon-library] - The icon library used for built-in control icons
 * @property {function} [onTimeupdate] - Event fired when the time changes
 * @property {function} [onPlay] - Event fired when playback begins
 * @property {function} [onPause] - Event fired when playback stops
 * @property {function} [onVolumechange] - Event fired when the volume changes
 * @property {function} [onError] - Event fired when an error occurs
 * @property {function} [onEnded] - Event fired when playback ends
 * @property {function} [onLoadedmetadata] - Event fired when metadata has been loaded
 */

export const Video = React.forwardRef(
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
    const videoRef = React.useRef(null);

    React.useImperativeHandle(
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
        seek: (time) => {
          if (videoRef.current && typeof videoRef.current.seek === 'function') {
            videoRef.current.seek(time);
          }
        },
        setVolume: (volume) => {
          if (
            videoRef.current &&
            typeof videoRef.current.setVolume === 'function'
          ) {
            videoRef.current.setVolume(volume);
          }
        },
        setPlaybackRate: (rate) => {
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

    React.useEffect(() => {
      ensureLoaded();
      const el = videoRef.current;
      if (!el) return;

      const handleTimeupdate = (e) => {
        if (onTimeupdate) onTimeupdate(e);
      };

      const handlePlay = (e) => {
        if (onPlay) onPlay(e);
      };

      const handlePause = (e) => {
        if (onPause) onPause(e);
      };

      const handleVolumechange = (e) => {
        if (onVolumechange) onVolumechange(e);
      };

      const handleError = (e) => {
        if (onError) onError(e);
      };

      const handleEnded = (e) => {
        if (onEnded) onEnded(e);
      };

      const handleLoadedmetadata = (e) => {
        if (onLoadedmetadata) onLoadedmetadata(e);
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
      <wa-video ref={videoRef} class={clsx('Video', className)} {...props}>
        {children}
      </wa-video>
    );
  }
);

Video.displayName = 'Video';
