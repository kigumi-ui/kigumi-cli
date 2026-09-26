<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './TreeItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tree-item/tree-item.js'));
}

/**
 * Tree items are used inside trees to represent hierarchical items
 */
export interface TreeItemProps {
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  lazy?: boolean;
}

const props = defineProps<TreeItemProps>();

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
  'wa-expand': [event: CustomEvent];
  'wa-after-expand': [event: CustomEvent];
  'wa-collapse': [event: CustomEvent];
  'wa-after-collapse': [event: CustomEvent];
  'wa-lazy-change': [event: CustomEvent];
  'wa-lazy-load': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaExpand = (e: Event) => emit('wa-expand', e as CustomEvent);
const handleWaAfterExpand = (e: Event) =>
  emit('wa-after-expand', e as CustomEvent);
const handleWaCollapse = (e: Event) => emit('wa-collapse', e as CustomEvent);
const handleWaAfterCollapse = (e: Event) =>
  emit('wa-after-collapse', e as CustomEvent);
const handleWaLazyChange = (e: Event) =>
  emit('wa-lazy-change', e as CustomEvent);
const handleWaLazyLoad = (e: Event) => emit('wa-lazy-load', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-expand', handleWaExpand);
  el.addEventListener('wa-after-expand', handleWaAfterExpand);
  el.addEventListener('wa-collapse', handleWaCollapse);
  el.addEventListener('wa-after-collapse', handleWaAfterCollapse);
  el.addEventListener('wa-lazy-change', handleWaLazyChange);
  el.addEventListener('wa-lazy-load', handleWaLazyLoad);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-expand', handleWaExpand);
  el.removeEventListener('wa-after-expand', handleWaAfterExpand);
  el.removeEventListener('wa-collapse', handleWaCollapse);
  el.removeEventListener('wa-after-collapse', handleWaAfterCollapse);
  el.removeEventListener('wa-lazy-change', handleWaLazyChange);
  el.removeEventListener('wa-lazy-load', handleWaLazyLoad);
});

defineExpose({
  getChildrenItems: (options: { includeDisabled?: boolean }) =>
    (elementRef.value as any)?.getChildrenItems?.(options),
  element: elementRef,
});
</script>

<template>
  <wa-tree-item
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-tree-item>
</template>
