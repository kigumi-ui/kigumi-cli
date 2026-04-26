<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './ZoomableFrame.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/zoomable-frame/zoomable-frame.js'));
}

/**
 * Zoomable frames display iframe content with zoom controls
 */
const props = defineProps({
    src: { type: String, required: false },
    srcdoc: { type: String, required: false },
    zoom: { type: Number, required: false, default: 1 },
    'zoom-levels': { type: String, required: false, default: '25% 50% 75% 100% 125% 150% 175% 200%' },
    allowfullscreen: { type: Boolean, required: false, default: false },
    loading: { type: String, required: false, default: 'eager' },
    'without-controls': { type: Boolean, required: false, default: false },
    'without-interaction': { type: Boolean, required: false, default: false },
    sandbox: { type: String, required: false },
    referrerpolicy: { type: String, required: false }
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

const emit = defineEmits(['load', 'error']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleLoad = (e) => emit('load', e);
const handleError = (e) => emit('error', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('load', handleLoad);
  el.addEventListener('error', handleError);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('load', handleLoad);
  el.removeEventListener('error', handleError);
});

defineExpose({
  zoomIn: () => elementRef.value?.zoomIn?.(),
  zoomOut: () => elementRef.value?.zoomOut?.(),
  element: elementRef,
});
</script>

<template>
  <wa-zoomable-frame
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-zoomable-frame>
</template>
