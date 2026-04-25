<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './Card.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/card/card.js'));
}

/**
 * Cards can be used to group related subjects in a container
 */
export interface CardProps {
  appearance?: 'outlined' | 'filled-outlined' | 'plain' | 'filled' | 'accent';
  orientation?: 'vertical' | 'horizontal';
  'with-header'?: boolean;
  'with-footer'?: boolean;
  'with-media'?: boolean;
}

const props = defineProps<CardProps>();

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
  <wa-card
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-card>
</template>
