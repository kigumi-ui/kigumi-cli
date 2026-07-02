<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  timeupdate: [event: CustomEvent];
  play: [event: CustomEvent];
  pause: [event: CustomEvent];
  volumechange: [event: CustomEvent];
  error: [event: CustomEvent];
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
const handleError = (e: Event) => emit('error', e as CustomEvent);
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
  <wa-video ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-video>
</template>
