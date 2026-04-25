<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Tag.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tag/tag.js'));
}

/**
 * Tags are used as labels to organize things or indicate selections
 */
export interface TagProps {
  appearance?: 'accent' | 'filled' | 'outlined' | 'filled-outlined';
  pill?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
  'with-remove'?: boolean;
}

const props = defineProps<TagProps>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  'wa-remove': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaRemove = (e: Event) => emit('wa-remove', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-remove', handleWaRemove);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-remove', handleWaRemove);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-tag
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-tag>
</template>
