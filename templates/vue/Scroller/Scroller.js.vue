<script setup>
import { ref, computed, onMounted } from 'vue';
import './Scroller.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/scroller/scroller.js'));
}

/**
 * Adds a scrollable container with optional shadow indicators
 */
const props = defineProps({
  orientation: { type: String, required: false, default: 'both' },
  'with-scroll-indicator': { type: Boolean, required: false, default: false },
  'without-scrollbar': { type: Boolean, required: false, default: false },
  'without-shadow': { type: Boolean, required: false, default: false },
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
  <wa-scroller ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-scroller>
</template>
