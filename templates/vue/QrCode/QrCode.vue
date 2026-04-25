<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import './QrCode.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/qr-code/qr-code.js'));
}

/**
 * Generates QR codes for encoding text, URLs, or data
 */
export interface QrCodeProps {
  value?: string;
  label?: string;
  size?: number;
  fill?: string;
  background?: string;
  radius?: number;
  'error-correction'?: 'L' | 'M' | 'Q' | 'H';
}

const props = defineProps<QrCodeProps>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  // No events for this component
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-qr-code
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-qr-code>
</template>
