<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Pagination.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/pagination/pagination.js'));
}

/**
 * Pagination splits long lists of content into pages, letting users navigate between them
 */
export interface PaginationProps {
  total?: number;
  'page-size'?: number;
  page?: number;
  'sibling-count'?: number;
  'boundary-count'?: number;
  'without-nav'?: boolean;
  'with-edges'?: boolean;
  'with-summary'?: boolean;
  format?: 'standard' | 'compact';
  'href-template'?: string;
  'hide-single-page'?: boolean;
  label?: string;
  appearance?: 'outlined' | 'filled' | 'plain';
  disabled?: boolean;
}

const props = defineProps<PaginationProps>();

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
  'wa-before-page-change': [event: CustomEvent];
  'wa-page-change': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaBeforePageChange = (e: Event) =>
  emit('wa-before-page-change', e as CustomEvent);
const handleWaPageChange = (e: Event) =>
  emit('wa-page-change', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-before-page-change', handleWaBeforePageChange);
  el.addEventListener('wa-page-change', handleWaPageChange);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-before-page-change', handleWaBeforePageChange);
  el.removeEventListener('wa-page-change', handleWaPageChange);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-pagination ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-pagination>
</template>
