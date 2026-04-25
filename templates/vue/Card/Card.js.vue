<script setup>
import { ref, computed, onMounted } from 'vue';
import './Card.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/card/card.js'));
}

/**
 * Cards can be used to group related subjects in a container
 */
const props = defineProps({
    appearance: { type: String, required: false, default: 'outlined' },
    orientation: { type: String, required: false, default: 'vertical' },
    'with-header': { type: Boolean, required: false, default: false },
    'with-footer': { type: Boolean, required: false, default: false },
    'with-media': { type: Boolean, required: false, default: false }
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
  <wa-card
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-card>
</template>
