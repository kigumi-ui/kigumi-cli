<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Icon.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/icon/icon.js'));
}

/**
 * Icons are symbols that can be used to represent various options within an application
 */
const props = defineProps({
  name: { type: String, required: false },
  library: { type: String, required: false, default: 'default' },
  src: { type: String, required: false },
  label: { type: String, required: false, default: '' },
  family: { type: String, required: false },
  variant: { type: String, required: false },
  canvas: { type: String, required: false },
  'auto-width': { type: Boolean, required: false, default: false },
  'swap-opacity': { type: Boolean, required: false, default: false },
  rotate: { type: Number, required: false },
  flip: { type: String, required: false },
  animation: { type: String, required: false },
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
  <wa-icon ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-icon>
</template>
