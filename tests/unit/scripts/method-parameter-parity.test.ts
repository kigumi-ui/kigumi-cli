import { describe, it, expect } from 'vitest';
import { COMPONENT_METADATA } from '../../../src/utils/component-metadata.js';
import { getAllComponents } from '../../../src/utils/registry.js';
import { generateReactTypescriptTemplate } from '../../../scripts/generate-react-templates.js';
import { generateVueTypescriptTemplate } from '../../../scripts/generate-vue-templates.js';
import { generateComponentTS } from '../../../scripts/generate-angular-templates.js';

/**
 * Cross-framework parity for method parameter optionality (issue #108).
 *
 * The metadata records which parameters a call may leave out. Each generator
 * used to decide on its own instead: React and Vue required every argument,
 * Angular none, so wa-stepper's goTo(name) accepted a missing name in Angular
 * only. This holds every framework's signature for every public method of
 * every registry component to the metadata.
 *
 * The expected text is spelled out here rather than produced with the
 * generators' shared formatter, so a bug in that formatter shows up.
 */

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const methods = Object.values(getAllComponents()).flatMap((component) => {
  const key = component.tagName.replace(/^wa-/, '');
  return (COMPONENT_METADATA[key]?.methods ?? [])
    .filter((method) => (method.parameters?.length ?? 0) > 0)
    .map((method) => ({ component, method }));
});

describe('method parameter optionality in every framework', () => {
  it('finds optional and required parameters to check', () => {
    const params = methods.flatMap(({ method }) => method.parameters ?? []);
    expect(params.some((p) => p.optional)).toBe(true);
    expect(params.some((p) => !p.optional)).toBe(true);
  });

  it.each(
    methods.map(
      ({ component, method }) =>
        [`${component.name}.${method.name}`, component, method] as const
    )
  )('%s matches the metadata', (_label, component, method) => {
    const signature = (method.parameters ?? [])
      .map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type}`)
      .join(', ');
    const react = generateReactTypescriptTemplate(component);
    const vue = generateVueTypescriptTemplate(component);
    const angular = generateComponentTS(
      component,
      component.tagName.replace(/^wa-/, '')
    );

    // React: the ref interface member and the useImperativeHandle entry.
    expect(react).toContain(`${method.name}: (${signature}) => void;`);
    expect(react).toContain(`${method.name}: (${signature}) => {`);
    // Vue: the defineExpose entry.
    expect(vue).toMatch(
      new RegExp(`${escape(method.name)}: \\(${escape(signature)}\\) =>`)
    );
    // Angular: the public method and the cast it forwards through.
    expect(angular).toContain(`${method.name}(${signature}): void {`);
    expect(angular).toContain(`${method.name}: (${signature}) => void`);
  });
});

describe('React JSDoc ref example', () => {
  it('calls a method that needs no arguments', () => {
    for (const component of Object.values(getAllComponents())) {
      const source = generateReactTypescriptTemplate(component);
      const call = /ref\.current\?\.(\w+)\(\)\}>Call Method/.exec(source);
      if (!call) continue;
      const key = component.tagName.replace(/^wa-/, '');
      const method = COMPONENT_METADATA[key].methods.find(
        (m) => m.name === call[1]
      );
      expect(
        (method?.parameters ?? []).every((p) => p.optional),
        `${component.name}.${call[1]}()`
      ).toBe(true);
    }
  });
});
