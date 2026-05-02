<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './SplitPanel.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/split-panel/split-panel.js'));
}

/**
 * Split panels display two adjacent panels with a divider for resizing
 */
export interface SplitPanelProps {
  position?: number;
  'position-in-pixels'?: number;
  orientation?: 'horizontal' | 'vertical';
  primary?: 'start' | 'end';
  disabled?: boolean;
  snap?: string;
  'snap-threshold'?: number;
}

const props = defineProps<SplitPanelProps>();

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
  'wa-reposition': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaReposition = (e: Event) =>
  emit('wa-reposition', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-reposition', handleWaReposition);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-reposition', handleWaReposition);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-split-panel ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-split-panel>
</template>
