import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';

vi.mock('../../../scripts/generator-utils.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../../scripts/generator-utils.js')
  >('../../../scripts/generator-utils.js');
  return {
    ...actual,
    writeFormatted: vi.fn().mockResolvedValue(undefined),
  };
});

import { writeFormatted } from '../../../scripts/generator-utils.js';
import { isGeneratedTemplateFile } from '../../../scripts/check-generated-fresh.js';
import { generateComponentTemplates as generateAngular } from '../../../scripts/generate-angular-templates.js';
import { generateComponentTemplates as generateReact } from '../../../scripts/generate-react-templates.js';
import { generateComponentTemplates as generateVue } from '../../../scripts/generate-vue-templates.js';
import { getComponent } from '../../../src/utils/registry.js';
import { getTemplateFileNames } from '../../../src/utils/template.js';

const GENERATORS = [
  { framework: 'react', generate: generateReact },
  { framework: 'vue', generate: generateVue },
  { framework: 'angular', generate: generateAngular },
] as const;

function writtenPaths(): string[] {
  return vi.mocked(writeFormatted).mock.calls.map((c) => c[0]);
}

describe('Template generators: output files', () => {
  beforeEach(() => {
    vi.mocked(writeFormatted).mockClear();
  });

  // A generator writes the part of the Template file set it owns, which is
  // the set Check A regenerates, and nothing else: no per-Template test
  // (issue #80). React's `.jsx` is hand-maintained.
  it.each(GENERATORS)(
    '$framework writes the Template files it owns, and no test file',
    async ({ framework, generate }) => {
      await generate(getComponent('button-group')!);

      const paths = writtenPaths();
      expect(
        paths.map((p) => path.basename(path.dirname(p))),
        'every file lands in the component directory'
      ).toEqual(paths.map(() => 'ButtonGroup'));
      expect(paths.map((p) => path.basename(p)).sort()).toEqual(
        getTemplateFileNames(framework, 'ButtonGroup')
          .filter(isGeneratedTemplateFile)
          .sort()
      );
    }
  );

  it('writes filenames derived verbatim from component.name (no transformations)', async () => {
    // Regression guard: mutations such as `${component.name.replace('o', '')}`
    // or `${component.name.toLowerCase()}` in the path.join site would silently
    // produce orphan files in templates/<framework>/<Name>/ while leaving the
    // original committed files stale. This assertion locks the contract that
    // the filename is component.name verbatim.
    const dropdown = getComponent('dropdown');
    expect(dropdown).toBeTruthy();

    await generateReact(dropdown!);

    const paths = writtenPaths();
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      expect(path.basename(p, path.extname(p))).toBe('Dropdown');
    }
  });
});
