<script setup>
import { ref, computed, onMounted } from 'vue';
import './Sparkline.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/sparkline/sparkline.js'));
}

/**
 * Sparklines are small inline data visualizations for showing trends
 */
const props = defineProps({
  data: { type: String, required: false },
  label: { type: String, required: false },
  appearance: { type: String, required: false, default: 'line' },
  trend: { type: String, required: false },
  curve: { type: String, required: false, default: 'natural' },
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
  <wa-sparkline ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-sparkline>
</template>
