<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Pagination.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/pagination/pagination.js'));
}

/**
 * Pagination splits long lists of content into pages, letting users navigate between them
 */
const props = defineProps({
  total: { type: Number, required: false, default: 0 },
  'page-size': { type: Number, required: false, default: 10 },
  page: { type: Number, required: false, default: 1 },
  'sibling-count': { type: Number, required: false, default: 2 },
  'boundary-count': { type: Number, required: false, default: 1 },
  'without-nav': { type: Boolean, required: false, default: false },
  'with-edges': { type: Boolean, required: false, default: false },
  'with-summary': { type: Boolean, required: false, default: false },
  format: { type: String, required: false, default: 'standard' },
  'href-template': { type: String, required: false, default: '' },
  'hide-single-page': { type: Boolean, required: false, default: false },
  label: { type: String, required: false, default: '' },
  appearance: { type: String, required: false, default: 'outlined' },
  disabled: { type: Boolean, required: false, default: false },
});

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

function hostAttributes() {
  const result = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits(['wa-before-page-change', 'wa-page-change']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaBeforePageChange = (e) => emit('wa-before-page-change', e);
const handleWaPageChange = (e) => emit('wa-page-change', e);

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
