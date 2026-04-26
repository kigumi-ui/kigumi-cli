<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './AnimatedImage.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/animated-image/animated-image.js'));
}

/**
 * A component for displaying animated GIFs and WEBPs that play and pause on interaction
 */
const props = defineProps({
    src: { type: String, required: true },
    alt: { type: String, required: true },
    play: { type: Boolean, required: false, default: false }
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

const emit = defineEmits(['wa-load', 'wa-error']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaLoad = (e) => emit('wa-load', e);
const handleWaError = (e) => emit('wa-error', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-load', handleWaLoad);
  el.addEventListener('wa-error', handleWaError);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-load', handleWaLoad);
  el.removeEventListener('wa-error', handleWaError);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-animated-image
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-animated-image>
</template>
