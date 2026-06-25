<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './DropdownItem.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js'));
}

/**
 * Dropdown items are used inside dropdowns to represent individual menu items
 */
const props = defineProps({
  type: { type: String, required: false, default: 'normal' },
  checked: { type: Boolean, required: false, default: false },
  value: { type: String, required: false, default: '' },
  disabled: { type: Boolean, required: false, default: false },
  loading: { type: Boolean, required: false, default: false },
  variant: { type: String, required: false, default: 'default' },
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

const emit = defineEmits(['blur', 'focus']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleBlur = (e) => emit('blur', e);
const handleFocus = (e) => emit('focus', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('focus', handleFocus);
});

defineExpose({
  openSubmenu: () => elementRef.value?.openSubmenu?.(),
  closeSubmenu: () => elementRef.value?.closeSubmenu?.(),
  element: elementRef,
});
</script>

<template>
  <wa-dropdown-item
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-dropdown-item>
</template>
