<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './Callout.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/callout/callout.js'));
}

/**
 * Callouts are used to display important messages inline
 */
export interface CalloutProps {
  appearance?: 'accent' | 'filled' | 'outlined' | 'plain' | 'filled-outlined';
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
}

const props = defineProps<CalloutProps>();

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
  <wa-callout ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-callout>
</template>
