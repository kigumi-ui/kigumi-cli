import { describe, expect, it } from 'vitest';
import {
  enumeratedProps,
  formatCustomTypeImports,
  formatEventTypeImports,
  keywordExpression,
  keywordPairLiteral,
} from '../../../scripts/generator-utils.js';

describe('formatEventTypeImports', () => {
  it('imports each Web Awesome event class from its own dist/events module', () => {
    const source = formatEventTypeImports([
      { eventType: 'WaShowEvent', eventTypeModule: 'show' },
      { eventType: 'WaHideEvent', eventTypeModule: 'hide' },
    ]);

    expect(source).toBe(
      "import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';\n" +
        "import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';\n"
    );
  });

  it('imports nothing for native events, whose types are DOM globals', () => {
    expect(
      formatEventTypeImports([
        { eventType: 'FocusEvent' },
        { eventType: 'Event' },
      ])
    ).toBe('');
  });

  it('imports a class once when two events share it', () => {
    // wa-show and a model-sync listener can both reference WaShowEvent.
    const show = {
      eventType: 'WaShowEvent',
      eventTypeModule: 'show',
    };
    expect(formatEventTypeImports([show, show])).toBe(
      "import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';\n"
    );
  });
});

describe('formatCustomTypeImports', () => {
  it('named-imports local option types from the component module', () => {
    const source = formatCustomTypeImports(
      [{ parameters: [{ name: 'options', type: 'ToastCreateOptions' }] }],
      '@awesome.me/webawesome/dist/components/toast/toast.js'
    );

    expect(source).toBe(
      "import type { ToastCreateOptions } from '@awesome.me/webawesome/dist/components/toast/toast.js';\n"
    );
  });

  it('default-imports sibling Wa* element types from their own module', () => {
    const source = formatCustomTypeImports(
      [{ parameters: [{ name: 'slide', type: 'WaCarouselItem' }] }],
      '@awesome.me/webawesome/dist/components/carousel/carousel.js'
    );

    expect(source).toBe(
      "import type WaCarouselItem from '@awesome.me/webawesome/dist/components/carousel-item/carousel-item.js';\n"
    );
  });
});

describe('enumerated-boolean emitters', () => {
  const autocorrect = { true: 'on', false: 'off' };

  it('keeps only props with keywords, in registry order, with the pair narrowed', () => {
    expect(
      enumeratedProps([
        {
          name: 'spellcheck',
          type: 'boolean',
          keywords: { true: 'true', false: 'false' },
        },
        { name: 'readonly', type: 'boolean', default: 'false' },
        { name: 'autocorrect', type: 'boolean', keywords: autocorrect },
      ])
    ).toEqual([
      { name: 'spellcheck', keywords: { true: 'true', false: 'false' } },
      { name: 'autocorrect', keywords: autocorrect },
    ]);
  });

  it('spells a pair with its named keys, never positionally', () => {
    expect(keywordPairLiteral(autocorrect)).toBe(
      "{ true: 'on', false: 'off' }"
    );
  });

  it('picks the true keyword when the value expression is truthy', () => {
    expect(keywordExpression('autocorrect', autocorrect)).toBe(
      "autocorrect ? 'on' : 'off'"
    );
  });
});
