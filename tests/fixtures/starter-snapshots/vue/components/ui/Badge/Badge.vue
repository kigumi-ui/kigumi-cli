<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './Badge.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/badge/badge.js'));
}

/**
 * Badges are used to draw attention and display statuses or counts
 */
export interface BadgeProps {
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
  appearance?: 'accent' | 'filled' | 'outlined' | 'filled-outlined';
  pill?: boolean;
  attention?: 'none' | 'pulse' | 'bounce';
}

const props = defineProps<BadgeProps>();

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
  <wa-badge ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-badge>
</template>
