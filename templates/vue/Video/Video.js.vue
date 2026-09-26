<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Video.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/video/video.js'));
}

/**
 * Displays a video player with customizable controls, captions, and thumbnails
 */
const props = defineProps({
  controls: { type: String, required: false, default: 'standard' },
  src: { type: String, required: false },
  poster: { type: String, required: false },
  title: { type: String, required: false },
  thumbnails: { type: String, required: false },
  playing: { type: Boolean, required: false, default: false },
  muted: { type: Boolean, required: false, default: false },
  volume: { type: Number, required: false, default: 1 },
  autoplay: { type: Boolean, required: false, default: false },
  loop: { type: Boolean, required: false, default: false },
  'autoplay-muted': { type: Boolean, required: false, default: false },
  'autoplay-on-visible': { type: Boolean, required: false, default: false },
  preload: { type: String, required: false, default: 'metadata' },
  'icon-library': { type: String, required: false, default: 'system' },
});

defineOptions({ inheritAttrs: false });

// Forward props and fallthrough attributes to the web component yourself,
// rather than through Vue's default fallthrough:
// - Web Awesome reads attribute presence as truthy, so `false` must never
//   reach <wa-*>. Vue materializes every absent optional Boolean prop as
//   `false`, and would render a fallthrough `false` as the string "false".
//   `aria-*` / `data-*` keep `false`, where "false" is a real value.
// - Vue camelizes declared prop keys (`with-caret` -> `withCaret`). Before
//   the element upgrades, that key lands as the attribute `withcaret`, which
//   Web Awesome never reads, so props go back to their kebab-case names.
// A plain function, not `computed`: `attrs` is tracked per property read,
// so a computed over an empty `attrs` would never see a later attribute.
const attrs = useAttrs();

function hostAttributes() {
  const result = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits([
  'timeupdate',
  'play',
  'pause',
  'volumechange',
  'error',
  'ended',
  'loadedmetadata',
]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleTimeupdate = (e) => emit('timeupdate', e);
const handlePlay = (e) => emit('play', e);
const handlePause = (e) => emit('pause', e);
const handleVolumechange = (e) => emit('volumechange', e);
const handleError = (e) => emit('error', e);
const handleEnded = (e) => emit('ended', e);
const handleLoadedmetadata = (e) => emit('loadedmetadata', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('timeupdate', handleTimeupdate);
  el.addEventListener('play', handlePlay);
  el.addEventListener('pause', handlePause);
  el.addEventListener('volumechange', handleVolumechange);
  el.addEventListener('error', handleError);
  el.addEventListener('ended', handleEnded);
  el.addEventListener('loadedmetadata', handleLoadedmetadata);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('timeupdate', handleTimeupdate);
  el.removeEventListener('play', handlePlay);
  el.removeEventListener('pause', handlePause);
  el.removeEventListener('volumechange', handleVolumechange);
  el.removeEventListener('error', handleError);
  el.removeEventListener('ended', handleEnded);
  el.removeEventListener('loadedmetadata', handleLoadedmetadata);
});

defineExpose({
  play: () => elementRef.value?.play?.(),
  pause: () => elementRef.value?.pause?.(),
  togglePlay: () => elementRef.value?.togglePlay?.(),
  toggleMute: () => elementRef.value?.toggleMute?.(),
  seek: (time) => elementRef.value?.seek?.(time),
  setVolume: (volume) => elementRef.value?.setVolume?.(volume),
  setPlaybackRate: (rate) => elementRef.value?.setPlaybackRate?.(rate),
  requestFullscreen: () => elementRef.value?.requestFullscreen?.(),
  exitFullscreen: () => elementRef.value?.exitFullscreen?.(),
  getVideoElement: () => elementRef.value?.getVideoElement?.(),
  getState: () => elementRef.value?.getState?.(),
  element: elementRef,
});
</script>

<template>
  <wa-video ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-video>
</template>
