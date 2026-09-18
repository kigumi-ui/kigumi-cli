import { describe, it, expect } from 'vitest';
import {
  toKebabCase,
  toPascalCase,
  toCamelCase,
  stripWaPrefix,
} from '../../../src/utils/naming.js';

/**
 * The casing primitives the generators share, pinned.
 *
 * Before these existed, six scripts hand-rolled the kebab <-> Pascal
 * conversions. The PascalCase -> kebab copies omitted the consecutive-capitals
 * rule, so a name like QRCode produced 'qrcode' rather than 'qr-code' and
 * silently missed every lookup keyed by the kebab name.
 *
 * See issue #31.
 */
describe('toKebabCase', () => {
  it.each([
    ['Button', 'button'],
    ['ButtonGroup', 'button-group'],
    ['AnimatedImage', 'animated-image'],
    ['Icon', 'icon'],
    ['QrCode', 'qr-code'],
  ])('%s -> %s', (input, expected) => {
    expect(toKebabCase(input)).toBe(expected);
  });

  describe('consecutive capitals', () => {
    it.each([
      ['QRCode', 'qr-code'],
      ['HTMLViewer', 'html-viewer'],
      ['IOStream', 'io-stream'],
    ])('%s -> %s', (input, expected) => {
      expect(toKebabCase(input)).toBe(expected);
    });

    it('does not collapse QRCode to qrcode, the bug this rule fixes', () => {
      expect(toKebabCase('QRCode')).not.toBe('qrcode');
    });

    it('agrees with the single-capital spelling of the same component', () => {
      expect(toKebabCase('QRCode')).toBe(toKebabCase('QrCode'));
    });
  });
});

describe('toPascalCase', () => {
  it.each([
    ['after-hide', 'AfterHide'],
    ['show', 'Show'],
    ['qr-code', 'QrCode'],
    ['slide-change', 'SlideChange'],
  ])('%s -> %s', (input, expected) => {
    expect(toPascalCase(input)).toBe(expected);
  });
});

describe('toCamelCase', () => {
  it.each([
    ['after-hide', 'afterHide'],
    ['show', 'show'],
    ['slide-change', 'slideChange'],
  ])('%s -> %s', (input, expected) => {
    expect(toCamelCase(input)).toBe(expected);
  });
});

describe('stripWaPrefix', () => {
  it('drops the vendor prefix', () => {
    expect(stripWaPrefix('wa-after-hide')).toBe('after-hide');
  });

  it('leaves a native event name alone', () => {
    expect(stripWaPrefix('blur')).toBe('blur');
  });

  it('only strips a leading occurrence', () => {
    expect(stripWaPrefix('data-wa-thing')).toBe('data-wa-thing');
  });
});

/**
 * The three generators build genuinely different handler names from the same
 * primitive. These assertions pin the per-framework adapters so a future change
 * to the shared primitive cannot silently converge them.
 */
describe('per-framework adapters built on the primitives', () => {
  const reactEventName = (e: string) => 'on' + toPascalCase(stripWaPrefix(e));
  const angularOutputName = (e: string) => {
    const stripped = stripWaPrefix(e);
    return stripped === 'input' ? 'inputEvent' : toCamelCase(stripped);
  };

  it.each([
    ['wa-after-hide', 'onAfterHide', 'afterHide'],
    ['wa-show', 'onShow', 'show'],
    ['change', 'onChange', 'change'],
    ['blur', 'onBlur', 'blur'],
  ])('%s -> React %s, Angular %s', (event, react, angular) => {
    expect(reactEventName(event)).toBe(react);
    expect(angularOutputName(event)).toBe(angular);
  });

  it('keeps Angular’s input -> inputEvent collision rule', () => {
    expect(angularOutputName('input')).toBe('inputEvent');
    expect(reactEventName('input')).toBe('onInput');
  });

  it('keeps the Vue handler name prefixed, since it takes the raw event name', () => {
    expect(toPascalCase('wa-after-hide')).toBe('WaAfterHide');
  });
});
