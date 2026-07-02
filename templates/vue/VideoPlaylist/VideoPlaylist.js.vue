<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './VideoPlaylist.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/video-playlist/video-playlist.js'));
}

/**
 * Groups multiple videos into a playlist with next/previous navigation
 */
const props = defineProps({
  controls: { type: String, required: false, default: 'full' },
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

const emit = defineEmits(['wa-video-change']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaVideoChange = (e) => emit('wa-video-change', e);

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
  next: () => elementRef.value?.next?.(),
  previous: () => elementRef.value?.previous?.(),
  goTo: (index) => elementRef.value?.goTo?.(index),
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
