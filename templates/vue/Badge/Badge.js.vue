<script setup>
import { ref, computed, onMounted } from 'vue';
import './Badge.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/badge/badge.js'));
}

/**
 * Badges are used to draw attention and display statuses or counts
 */
const props = defineProps({
    variant: { type: String, required: false, default: 'brand' },
    appearance: { type: String, required: false, default: 'accent' },
    pill: { type: Boolean, required: false, default: false },
    attention: { type: String, required: false, default: 'none' }
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
  <wa-badge
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-badge>
</template>
