<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './Option.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/option/option.js'));
}

/**
 * Options define the selectable items within various form controls
 */
export interface OptionProps {
  value?: string;
  disabled?: boolean;
  selected?: boolean;
  label?: string;
}

const props = defineProps<OptionProps>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
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
  <wa-option
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-option>
</template>
