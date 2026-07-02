<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

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

onUnmounted(() => {
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
  <wa-video ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-video>
</template>
