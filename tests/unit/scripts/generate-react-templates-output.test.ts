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
import { generateComponentTemplates } from '../../../scripts/generate-react-templates.js';
import { getComponent } from '../../../src/utils/registry.js';

describe('generate-react-templates: output filename invariants', () => {
  beforeEach(() => {
    vi.mocked(writeFormatted).mockClear();
  });

  it('writes <Name>.tsx, <Name>.css, and <Name>.test.tsx for a component', async () => {
    const button = getComponent('button');
    expect(button).toBeTruthy();

    await generateComponentTemplates(button!);

    const paths = vi.mocked(writeFormatted).mock.calls.map((c) => c[0]);
    expect(paths).toHaveLength(3);
    expect(
      paths.some((p) => p.endsWith(path.join('Button', 'Button.tsx')))
    ).toBe(true);
    expect(
      paths.some((p) => p.endsWith(path.join('Button', 'Button.css')))
    ).toBe(true);
    expect(
      paths.some((p) => p.endsWith(path.join('Button', 'Button.test.tsx')))
    ).toBe(true);
  });

  it('writes filenames derived verbatim from component.name (no transformations)', async () => {
    // Regression guard: mutations such as `${component.name.replace('o', '')}`
    // or `${component.name.toLowerCase()}` in the path.join site would silently
    // produce orphan files in templates/<framework>/<Name>/ while leaving the
    // original committed files stale. This assertion locks the contract that
    // the filename is component.name verbatim.
    const dropdown = getComponent('dropdown');
    expect(dropdown).toBeTruthy();

    await generateComponentTemplates(dropdown!);

    const paths = vi.mocked(writeFormatted).mock.calls.map((c) => c[0]);
    for (const p of paths) {
      const base = path.basename(p, path.extname(p)).replace(/\.test$/, '');
      expect(base).toBe('Dropdown');
    }
  });
});
