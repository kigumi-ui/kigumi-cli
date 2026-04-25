<script setup>
import { ref, computed, onMounted } from 'vue';
import './Callout.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/callout/callout.js'));
}

/**
 * Callouts are used to display important messages inline
 */
const props = defineProps({
    appearance: { type: String, required: false, default: 'filled-outlined' },
    size: { type: String, required: false, default: 'medium' },
    variant: { type: String, required: false, default: 'brand' }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
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
  <wa-callout
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-callout>
</template>
