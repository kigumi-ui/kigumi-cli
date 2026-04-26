<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './TabGroup.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tab-group/tab-group.js'));
}

/**
 * Tab groups organize content into a container that shows one section at a time
 */
export interface TabGroupProps {
  placement?: 'top' | 'bottom' | 'start' | 'end';
  activation?: 'auto' | 'manual';
  'without-scroll-controls'?: boolean;
  active?: string;
}

const props = defineProps<TabGroupProps>();

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
  'wa-tab-show': [event: CustomEvent];
  'wa-tab-hide': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaTabShow = (e: Event) => emit('wa-tab-show', e as CustomEvent);
const handleWaTabHide = (e: Event) => emit('wa-tab-hide', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-tab-show', handleWaTabShow);
  el.addEventListener('wa-tab-hide', handleWaTabHide);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-tab-show', handleWaTabShow);
  el.removeEventListener('wa-tab-hide', handleWaTabHide);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-tab-group
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-tab-group>
</template>
