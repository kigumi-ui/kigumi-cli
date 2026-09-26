<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
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

defineOptions({ inheritAttrs: false });

// Forward props and fallthrough attributes to the web component yourself,
// rather than through Vue's default fallthrough:
// - Web Awesome reads attribute presence as truthy, so `false` must never
//   reach <wa-*>. Vue materializes every absent optional Boolean prop as
//   `false`, and would render a fallthrough `false` as the string "false".
//   `aria-*` / `data-*` keep `false`, where "false" is a real value.
// - Vue camelizes declared prop keys (`with-caret` -> `withCaret`). Before
//   the element upgrades, that key lands as the attribute `withcaret`, which
//   Web Awesome never reads, so props go back to their kebab-case names.
// A plain function, not `computed`: `attrs` is tracked per property read,
// so a computed over an empty `attrs` would never see a later attribute.
const attrs = useAttrs();

function hostAttributes(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

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

onBeforeUnmount(() => {
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
  <wa-pagination
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-pagination>
</template>
