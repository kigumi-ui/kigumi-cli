<script setup>
import { ref, computed, onMounted } from 'vue';
import './TabPanel.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js'));
}

/**
 * Tab panels are used inside tab groups to display content for each tab
 */
const props = defineProps({
    name: { type: String, required: false, default: '' },
    active: { type: Boolean, required: false, default: false }
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
  <wa-tab-panel
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-tab-panel>
</template>
