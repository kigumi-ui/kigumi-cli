<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './DropdownItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js'));
}

/**
 * Dropdown items are used inside dropdowns to represent individual menu items
 */
export interface DropdownItemProps {
  type?: 'normal' | 'checkbox';
  checked?: boolean;
  value?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'neutral' | 'danger';
}

const props = defineProps<DropdownItemProps>();

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
  blur: [event: CustomEvent];
  focus: [event: FocusEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleBlur = (e: Event) => emit('blur', e as CustomEvent);
const handleFocus = (e: Event) => emit('focus', e as FocusEvent);

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
  openSubmenu: () => (elementRef.value as any)?.openSubmenu?.(),
  closeSubmenu: () => (elementRef.value as any)?.closeSubmenu?.(),
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
