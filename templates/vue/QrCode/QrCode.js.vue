<script setup>
import { ref, computed, onMounted } from 'vue';
import './QrCode.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/qr-code/qr-code.js'));
}

/**
 * Generates QR codes for encoding text, URLs, or data
 */
const props = defineProps({
    value: { type: String, required: false, default: '' },
    label: { type: String, required: false, default: '' },
    size: { type: Number, required: false, default: 128 },
    fill: { type: String, required: false, default: 'black' },
    background: { type: String, required: false, default: 'white' },
    radius: { type: Number, required: false, default: 0 },
    'error-correction': { type: String, required: false, default: 'H' }
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

const emit = defineEmits([]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-qr-code
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-qr-code>
</template>
