import React from 'react';
import clsx from 'clsx';
import './VideoPlaylist.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/video-playlist/video-playlist.js'));
}

/**
 * Groups multiple videos into a playlist with next/previous navigation
 *
 * @example
 * ```jsx
 * // Basic usage
 * <VideoPlaylist>
 *   <Video src="/intro.mp4" title="Intro" />
 *   <Video src="/deep-dive.mp4" title="Deep Dive" />
 * </VideoPlaylist>
 *
 * // Using ref methods
 * const playlistRef = React.useRef(null);
 * <button onClick={() => playlistRef.current?.next()}>Next</button>
 * <VideoPlaylist ref={playlistRef}>…</VideoPlaylist>
 * ```
 *
 * @typedef {Object} VideoPlaylistProps
 * @property {string} [controls] - Controls forwarded to each child video: none | standard | full
 * @property {string} [icon-library] - The icon library used for placeholder icons
 * @property {function} [onVideoChange] - Event fired when the active video changes
 */

export const VideoPlaylist = React.forwardRef(
  ({ children, className, onVideoChange, ...props }, ref) => {
    const videoplaylistRef = React.useRef(null);

    React.useImperativeHandle(
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
        goTo: (index) => {
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

    React.useEffect(() => {
      ensureLoaded();
      const el = videoplaylistRef.current;
      if (!el) return;

      const handleVideoChange = (e) => {
        if (onVideoChange) onVideoChange(e);
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
        {...props}
      >
        {children}
      </wa-video-playlist>
    );
  }
);

VideoPlaylist.displayName = 'VideoPlaylist';
