<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

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
