/**
 * A Template directory holds exactly the files `kigumi add` can copy. A
 * per-Template test is not one of them (issue #80): the function harness is
 * the proof, so a stray test file fails validation instead of shipping in
 * the package unread.
 */
import { describe, expect, it } from 'vitest';

import { findTemplateDirIssues } from '../../../scripts/validate-templates.js';
import { getTemplateFileNames } from '../../../src/utils/template.js';

describe('findTemplateDirIssues', () => {
  it.each(['react', 'vue', 'angular'] as const)(
    'accepts a %s directory holding exactly the Template files',
    (framework) => {
      const files = getTemplateFileNames(framework, 'ButtonGroup');
      expect(findTemplateDirIssues(framework, 'ButtonGroup', files)).toEqual(
        []
      );
    }
  );

  it.each([
    ['react', 'ButtonGroup.test.tsx'],
    ['react', 'ButtonGroup.test.jsx'],
    ['vue', 'ButtonGroup.test.ts'],
    ['vue', 'ButtonGroup.test.js'],
    ['angular', 'button-group.component.spec.ts'],
  ] as const)('rejects a %s test file %s', (framework, stray) => {
    const files = [...getTemplateFileNames(framework, 'ButtonGroup'), stray];
    expect(findTemplateDirIssues(framework, 'ButtonGroup', files)).toEqual([
      `Unexpected file: templates/${framework}/ButtonGroup/${stray}`,
    ]);
  });

  it('reports each missing Template file', () => {
    expect(
      findTemplateDirIssues('vue', 'ButtonGroup', ['ButtonGroup.vue'])
    ).toEqual([
      'Missing file: templates/vue/ButtonGroup/ButtonGroup.js.vue',
      'Missing file: templates/vue/ButtonGroup/ButtonGroup.css',
    ]);
  });
});
