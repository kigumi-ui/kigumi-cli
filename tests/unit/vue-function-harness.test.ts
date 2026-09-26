/**
 * The Vue adapter of the Template function harness (issue #76), driven with
 * small inline components so each failure mode has one cause. The shared
 * contract (attributes, cleanup, methods, class) is covered through the React
 * adapter in `react-function-harness.test.ts`; this file covers what the Vue
 * adapter adds: the `on`-prefixed callback that keeps `wa-`, the
 * `defineEmits` declaration check, and `defineExpose` in messages.
 */
// @vitest-environment jsdom

import {
  createApp,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  type Component,
} from 'vue';
import { describe, expect, it } from 'vitest';
import { proveVueTemplate, VUE_ADAPTER } from './vue-function-harness.js';
import type { VueTemplateProbe } from './vue-function-harness.js';

const SHOW = { name: 'wa-after-show', eventType: 'CustomEvent' };

interface InlineTemplate {
  component: Component;
  emits: VueTemplateProbe['emits'];
}

/**
 * A host that re-emits `wa-after-show` and cleans up after itself, or, with
 * `cleanupHook: onUnmounted`, tries to: by then Vue has nulled the ref.
 */
function reEmitting(options: {
  emits: string[];
  emitAs: string;
  cleanupHook?: typeof onBeforeUnmount;
}): InlineTemplate {
  const cleanupHook = options.cleanupHook ?? onBeforeUnmount;
  const component = defineComponent({
    emits: options.emits,
    setup(_props, { emit, expose }) {
      const host = ref<HTMLElement | null>(null);
      const handler = (event: Event) => emit(options.emitAs, event);
      onMounted(() => host.value?.addEventListener(SHOW.name, handler));
      cleanupHook(() => host.value?.removeEventListener(SHOW.name, handler));
      expose({});
      return () => h('wa-dialog', { ref: host });
    },
  });
  return { component, emits: options.emits };
}

function mountWith(Template: Component): VueTemplateProbe['mount'] {
  return ({ attributes, className, handlers }) => {
    const exposed = shallowRef<Record<string, unknown> | null>(null);
    const container = document.createElement('div');
    const app = createApp({
      render: () =>
        h(Template, {
          ...attributes,
          class: className,
          ...handlers,
          ref: exposed,
        }),
    });
    app.mount(container);
    return {
      container,
      unmount: () => {
        app.unmount();
      },
      refHandle: {
        get current() {
          return exposed.value;
        },
      },
    };
  };
}

async function prove(
  template: InlineTemplate,
  overrides: Partial<VueTemplateProbe> = {}
): Promise<readonly string[]> {
  const { violations } = await proveVueTemplate({
    metadata: { tagName: 'wa-dialog', events: [SHOW], methods: [] },
    attributes: [],
    className: 'probe-class',
    emits: template.emits,
    mount: mountWith(template.component),
    ...overrides,
  });
  return violations;
}

describe('VUE_ADAPTER', () => {
  it('keeps the wa- prefix, as a consumer @wa-after-show compiles to', () => {
    expect(VUE_ADAPTER.callbackName('wa-after-show')).toBe('onWaAfterShow');
    expect(VUE_ADAPTER.callbackName('blur')).toBe('onBlur');
  });
});

describe('proveVueTemplate', () => {
  it('accepts a Template that declares, re-emits and cleans up the event', async () => {
    const violations = await prove(
      reEmitting({ emits: [SHOW.name], emitAs: SHOW.name })
    );

    // Class is forwarded by Vue's own fallthrough on these inline hosts.
    expect(violations).toEqual([]);
  });

  it('reports an event missing from defineEmits', async () => {
    const violations = await prove(
      reEmitting({ emits: [], emitAs: SHOW.name })
    );

    expect(violations).toContain(
      'emit wa-after-show is not declared in defineEmits'
    );
  });

  it('reads an object-form emits declaration', async () => {
    const Template = reEmitting({ emits: [SHOW.name], emitAs: SHOW.name });
    const violations = await prove(Template, {
      emits: { [SHOW.name]: null },
    });

    expect(violations).toEqual([]);
  });

  it('reports a Template that re-emits under a React-style name', async () => {
    const violations = await prove(
      reEmitting({ emits: [SHOW.name, 'after-show'], emitAs: 'after-show' })
    );

    expect(violations).toContain(
      'dispatching wa-after-show did not invoke onWaAfterShow'
    );
  });

  it('reports a listener left on the host even though Vue swallows its emit', async () => {
    // After unmount Vue's emit is a no-op, so a dispatch alone cannot see
    // this leak; only the listener log can.
    const violations = await prove(
      reEmitting({
        emits: [SHOW.name],
        emitAs: SHOW.name,
        cleanupHook: onUnmounted,
      })
    );

    expect(violations).toEqual(['listener for wa-after-show was not removed']);
  });

  it('names defineExpose when a public method is missing', async () => {
    const violations = await prove(
      reEmitting({ emits: [SHOW.name], emitAs: SHOW.name }),
      {
        metadata: {
          tagName: 'wa-dialog',
          events: [SHOW],
          methods: [{ name: 'show' }],
        },
      }
    );

    expect(violations).toEqual([
      'defineExpose does not expose a method named show',
    ]);
  });
});
