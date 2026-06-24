<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import './Rating.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/rating/rating.js'));
}

/**
 * Ratings give users a way to quickly view and provide feedback
 */
export interface RatingProps {
  label?: string;
  max?: number;
  precision?: number;
  readonly?: boolean;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
}

const props = defineProps<RatingProps>();

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
  change: [event: CustomEvent];
  'wa-hover': [event: CustomEvent];
  'wa-invalid': [event: CustomEvent];
}>();

const model = defineModel<number>();

const elementRef = ref<HTMLElement | null>(null);

watch(model, (val) => {
  const el = elementRef.value as any;
  if (el && el.value !== val) el.value = val ?? '';
});

onMounted(() => {
  ensureLoaded();
});

const handleChange = (e: Event) => {
  model.value = (e.target as any).value;
  emit('change', e as CustomEvent);
};
const handleWaHover = (e: Event) => emit('wa-hover', e as CustomEvent);
const handleWaInvalid = (e: Event) => emit('wa-invalid', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('change', handleChange);
  el.addEventListener('wa-hover', handleWaHover);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('change', handleChange);
  el.removeEventListener('wa-hover', handleWaHover);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  setCustomValidity: (message: string) =>
    (elementRef.value as any)?.setCustomValidity?.(message),
  formStateRestoreCallback: (
    state: string | File | FormData | null,
    reason: 'autocomplete' | 'restore'
  ) => (elementRef.value as any)?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => (elementRef.value as any)?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-rating
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
    :value="model"
  >
    <slot />
  </wa-rating>
</template>
