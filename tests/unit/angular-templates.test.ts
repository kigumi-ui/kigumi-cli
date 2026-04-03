/**
 * Angular Template Generator - Output Validation Tests
 *
 * Validates that the generated Angular .hbs templates follow all conventions:
 * collision resolution, CVA wiring, type safety, and method signatures.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates', 'angular');

function readTemplate(component: string): string {
  const kebab = component
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
  const filePath = path.join(
    TEMPLATES_DIR,
    component,
    `${kebab}.component.ts.hbs`
  );
  return fs.readFileSync(filePath, 'utf-8');
}

describe('Angular template generator', () => {
  // A1: Output/Method collision resolution - overlay components
  it('should suffix @Output with Event when method has same name', () => {
    const dialog = readTemplate('Dialog');

    // show() method exists
    expect(dialog).toContain('show(): void {');
    // @Output should be showEvent, not show
    expect(dialog).toContain('@Output() showEvent');
    expect(dialog).not.toMatch(/@Output\(\) show\b[^E]/);

    // requestClose is a method but not an event - no collision
    expect(dialog).toContain('requestClose(): void {');
  });

  // A2: focus/blur collision resolution - form components
  it('should suffix focus/blur outputs when methods exist', () => {
    const button = readTemplate('Button');

    // Methods exist
    expect(button).toContain('focus(');
    expect(button).toContain('blur(): void {');

    // @Output should be suffixed
    expect(button).toContain('@Output() focusEvent');
    expect(button).toContain('@Output() blurEvent');
    expect(button).not.toMatch(/@Output\(\) focus\b[^E]/);
    expect(button).not.toMatch(/@Output\(\) blur\b[^E]/);
  });

  // A3: No false-positive renaming
  it('should not suffix outputs when no method collision exists', () => {
    const dialog = readTemplate('Dialog');

    // afterShow/afterHide are events with no matching method
    expect(dialog).toContain('@Output() afterShow');
    expect(dialog).toContain('@Output() afterHide');
    expect(dialog).not.toContain('@Output() afterShowEvent');
    expect(dialog).not.toContain('@Output() afterHideEvent');

    // Details has both renamed (showEvent/hideEvent) and non-renamed (afterShow/afterHide)
    const details = readTemplate('Details');
    expect(details).toContain('@Output() showEvent');
    expect(details).toContain('@Output() hideEvent');
    expect(details).toContain('@Output() afterShow');
    expect(details).toContain('@Output() afterHide');
    expect(details).not.toContain('@Output() afterShowEvent');
    expect(details).not.toContain('@Output() afterHideEvent');
  });

  // A4: inputEvent preserved (collision with @Input decorator)
  it('should keep inputEvent for wa-input event', () => {
    const input = readTemplate('Input');

    // wa-input event should become inputEvent (not input, which clashes with @Input)
    expect(input).toContain('@Output() inputEvent');
    expect(input).not.toMatch(/@Output\(\) input\b[^E]/);
  });

  // A5: CVA blur handler for checked components
  it('should wire onTouchedCallback on blur for checkbox and switch', () => {
    const checkbox = readTemplate('Checkbox');
    const switchTpl = readTemplate('Switch');

    for (const tpl of [checkbox, switchTpl]) {
      expect(tpl).toContain('handleBlurTouch');
      expect(tpl).toContain("el.addEventListener('blur', handleBlurTouch)");
      expect(tpl).toContain('this.onTouchedCallback()');
    }
  });

  // A6: No Function type in any template
  it('should not use Function type in any template', () => {
    const components = fs.readdirSync(TEMPLATES_DIR);
    for (const comp of components) {
      const kebab = comp
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();
      const tsFile = path.join(
        TEMPLATES_DIR,
        comp,
        `${kebab}.component.ts.hbs`
      );
      if (fs.existsSync(tsFile)) {
        const content = fs.readFileSync(tsFile, 'utf-8');
        expect(content, `${comp} contains Function type`).not.toMatch(
          /\bFunction\b/
        );
      }
    }
  });

  // A7: Method signatures use commas not semicolons
  it('should use commas in method type annotations', () => {
    const button = readTemplate('Button');

    // formStateRestoreCallback has 2 params: state, reason
    // The type cast should use commas: (state: unknown, reason: unknown) => void
    const castMatch = button.match(/formStateRestoreCallback:.*?=> void/);
    expect(castMatch).not.toBeNull();
    expect(castMatch![0]).toContain(', ');
    expect(castMatch![0]).not.toContain('; ');
  });
});
