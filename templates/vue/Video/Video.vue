<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Video.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/video/video.js'));
}

/**
 * Displays a video player with customizable controls, captions, and thumbnails
 */
export interface VideoProps {
  controls?: 'none' | 'standard' | 'full';
  src?: string;
  poster?: string;
  title?: string;
  thumbnails?: string;
  playing?: boolean;
  muted?: boolean;
  volume?: number;
  autoplay?: boolean;
  loop?: boolean;
  'autoplay-muted'?: boolean;
  'autoplay-on-visible'?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  'icon-library'?: string;
}

const props = defineProps<VideoProps>();

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

function hostAttributes(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits<{
  timeupdate: [event: CustomEvent];
  play: [event: CustomEvent];
  pause: [event: CustomEvent];
  volumechange: [event: CustomEvent];
  error: [event: Event];
  ended: [event: CustomEvent];
  loadedmetadata: [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleTimeupdate = (e: Event) => emit('timeupdate', e as CustomEvent);
const handlePlay = (e: Event) => emit('play', e as CustomEvent);
const handlePause = (e: Event) => emit('pause', e as CustomEvent);
const handleVolumechange = (e: Event) => emit('volumechange', e as CustomEvent);
const handleError = (e: Event) => emit('error', e as Event);
const handleEnded = (e: Event) => emit('ended', e as CustomEvent);
const handleLoadedmetadata = (e: Event) =>
  emit('loadedmetadata', e as CustomEvent);

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
  play: () => (elementRef.value as any)?.play?.(),
  pause: () => (elementRef.value as any)?.pause?.(),
  togglePlay: () => (elementRef.value as any)?.togglePlay?.(),
  toggleMute: () => (elementRef.value as any)?.toggleMute?.(),
  seek: (time: number) => (elementRef.value as any)?.seek?.(time),
  setVolume: (volume: number) => (elementRef.value as any)?.setVolume?.(volume),
  setPlaybackRate: (rate: number) =>
    (elementRef.value as any)?.setPlaybackRate?.(rate),
  requestFullscreen: () => (elementRef.value as any)?.requestFullscreen?.(),
  exitFullscreen: () => (elementRef.value as any)?.exitFullscreen?.(),
  getVideoElement: () => (elementRef.value as any)?.getVideoElement?.(),
  getState: () => (elementRef.value as any)?.getState?.(),
  element: elementRef,
});
</script>

<template>
  <wa-video ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-video>
</template>
