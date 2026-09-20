import { describe, expect, it } from 'vitest';
import { formatCustomTypeImports } from '../../../scripts/generator-utils.js';

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
