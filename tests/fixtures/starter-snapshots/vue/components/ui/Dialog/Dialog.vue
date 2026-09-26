<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount, watch } from 'vue';
import './Dialog.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/dialog/dialog.js'));
}

/**
 * Dialogs display important prompts and information
 *
 * @remarks Open and close programmatically by binding the `open` prop (e.g. `<Dialog v-model:open="isOpen">`). The previous `show()` / `requestClose()` methods are marked private in WA 3.5.0+ and are no longer exposed.
 */
export interface DialogProps {
  label: string;
  'without-header'?: boolean;
  'light-dismiss'?: boolean;
}

const props = defineProps<DialogProps>();

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
  'wa-show': [event: CustomEvent];
  'wa-after-show': [event: CustomEvent];
  'wa-hide': [event: CustomEvent];
  'wa-after-hide': [event: CustomEvent];
}>();

const open = defineModel<boolean>('open', { default: false });

const elementRef = ref<HTMLElement | null>(null);

watch(open, (newOpen) => {
  const el = elementRef.value as any;
  if (el && el.open !== newOpen) el.open = newOpen;
});

onMounted(() => {
  ensureLoaded();
});

const handleWaShow = (e: Event) => {
  open.value = true;
  emit('wa-show', e as CustomEvent);
};
const handleWaAfterShow = (e: Event) => emit('wa-after-show', e as CustomEvent);
const handleWaHide = (e: Event) => {
  open.value = false;
  emit('wa-hide', e as CustomEvent);
};
const handleWaAfterHide = (e: Event) => emit('wa-after-hide', e as CustomEvent);

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
  element: elementRef,
});
</script>

<template>
  <wa-dialog
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
    :open="open || undefined"
  >
    <slot />
  </wa-dialog>
</template>
