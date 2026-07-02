<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './VideoPlaylist.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/video-playlist/video-playlist.js'));
}

/**
 * Groups multiple videos into a playlist with next/previous navigation
 */
export interface VideoPlaylistProps {
  controls?: 'none' | 'standard' | 'full';
  'icon-library'?: string;
}

const props = defineProps<VideoPlaylistProps>();

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
  'wa-video-change': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaVideoChange = (e: Event) =>
  emit('wa-video-change', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-video-change', handleWaVideoChange);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-video-change', handleWaVideoChange);
});

defineExpose({
  next: () => (elementRef.value as any)?.next?.(),
  previous: () => (elementRef.value as any)?.previous?.(),
  goTo: (index: number) => (elementRef.value as any)?.goTo?.(index),
  element: elementRef,
});
</script>

<template>
  <wa-video-playlist
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-video-playlist>
</template>
