<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
import './Popover.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/popover/popover.js'));
}

/**
 * Popovers display additional content when users interact with a trigger element
 */
const props = defineProps({
  disabled: { type: Boolean, required: false, default: false },
  placement: { type: String, required: false, default: 'top' },
  trigger: { type: String, required: false, default: 'click' },
  distance: { type: Number, required: false, default: 8 },
  skidding: { type: Number, required: false, default: 0 },
  'with-arrow': { type: Boolean, required: false, default: false },
  'without-arrow': { type: Boolean, required: false, default: false },
  for: { type: String, required: false },
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

const emit = defineEmits([
  'wa-show',
  'wa-after-show',
  'wa-hide',
  'wa-after-hide',
]);

const open = defineModel('open', { default: false });

const elementRef = ref(null);

watch(open, (newOpen) => {
  const el = elementRef.value;
  if (el && el.open !== newOpen) el.open = newOpen;
});

onMounted(() => {
  ensureLoaded();
});

const handleWaShow = (e) => {
  open.value = true;
  emit('wa-show', e);
};
const handleWaAfterShow = (e) => emit('wa-after-show', e);
const handleWaHide = (e) => {
  open.value = false;
  emit('wa-hide', e);
};
const handleWaAfterHide = (e) => emit('wa-after-hide', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-show', handleWaShow);
  el.addEventListener('wa-after-show', handleWaAfterShow);
  el.addEventListener('wa-hide', handleWaHide);
  el.addEventListener('wa-after-hide', handleWaAfterHide);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-show', handleWaShow);
  el.removeEventListener('wa-after-show', handleWaAfterShow);
  el.removeEventListener('wa-hide', handleWaHide);
  el.removeEventListener('wa-after-hide', handleWaAfterHide);
});

defineExpose({
  show: () => elementRef.value?.show?.(),
  hide: () => elementRef.value?.hide?.(),
  element: elementRef,
});
</script>

<template>
  <wa-popover
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :open="open || undefined"
  >
    <slot />
  </wa-popover>
</template>
