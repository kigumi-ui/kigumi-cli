<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './CopyButton.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/copy-button/copy-button.js'));
}

/**
 * Copies text data to the clipboard when clicked
 */
const props = defineProps({
  value: { type: String, required: false, default: '' },
  from: { type: String, required: false, default: '' },
  disabled: { type: Boolean, required: false, default: false },
  'copy-label': { type: String, required: false, default: '' },
  'success-label': { type: String, required: false, default: '' },
  'error-label': { type: String, required: false, default: '' },
  'feedback-duration': { type: Number, required: false, default: 1000 },
  'tooltip-placement': { type: String, required: false, default: 'top' },
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

const emit = defineEmits(['wa-copy', 'wa-error']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaCopy = (e) => emit('wa-copy', e);
const handleWaError = (e) => emit('wa-error', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-copy', handleWaCopy);
  el.addEventListener('wa-error', handleWaError);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-copy', handleWaCopy);
  el.removeEventListener('wa-error', handleWaError);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-copy-button ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-copy-button>
</template>
