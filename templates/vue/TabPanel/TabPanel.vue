<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './TabPanel.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js'));
}

/**
 * Tab panels are used inside tab groups to display content for each tab
 */
export interface TabPanelProps {
  name?: string;
  active?: boolean;
}

const props = defineProps<TabPanelProps>();

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  // No events for this component
}>();

const elementRef = ref<HTMLElement | null>(null);

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
