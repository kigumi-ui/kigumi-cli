<script setup>
import { ref, computed, onMounted } from 'vue';
import './FormatBytes.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/format-bytes/format-bytes.js'));
}

/**
 * Formats a number as a human-readable byte value
 */
const props = defineProps({
  value: { type: Number, required: false, default: 0 },
  unit: { type: String, required: false, default: 'byte' },
  display: { type: String, required: false, default: 'short' },
  lang: { type: String, required: false },
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
  <wa-format-bytes ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-format-bytes>
</template>
