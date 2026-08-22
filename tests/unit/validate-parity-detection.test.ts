/**
 * Parity Detection Tests
 *
 * Proves that validate:parity actually detects the drift it claims to, using a
 * synthetic registry rather than live repo state.
 *
 * WHY separate from validate-parity.test.ts: that suite asserts the real tree
 * is clean, which is only meaningful if detection is known to work. It used to
 * assert `gapFindings.length > 0`, i.e. it passed only while 57 real gaps
 * existed and would have gone green against a checker that could not fail.
 * These tests inject the fault instead, so they keep their meaning once the
 * repo is clean.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const getAllComponents = vi.fn();

vi.mock('../../src/utils/registry.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/utils/registry.js')
  >('../../src/utils/registry.js');
  return { ...actual, getAllComponents: () => getAllComponents() };
});

const { validateParity } = await import('../../scripts/validate-parity.js');

/** A registry entry for a component that really has templates on disk. */
function componentWithFiles(
  overrides: Partial<{
    react: string[];
    vue: string[];
    angular: string[];
  }> = {}
) {
  return {
    button: {
      name: 'Button',
      tagName: 'wa-button',
      category: 'Actions',
      description: 'Button',
      dependencies: [],
      files: {
        react: ['components/Button.tsx'],
        vue: ['components/Button.vue'],
        angular: ['components/Button/button.component.ts'],
        ...overrides,
      },
      props: [],
      importPath: '',
      tier: 'free' as const,
    },
  };
}

describe('validate:parity detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass when every framework with templates is declared', async () => {
    getAllComponents.mockReturnValue(componentWithFiles());

    const result = await validateParity();

    expect(
      result.findings.filter((f) => f.category === 'registry-files-gap')
    ).toEqual([]);
  });

  it.each(['vue', 'angular', 'react'] as const)(
    'should flag a missing %s entry as an error',
    async (framework) => {
      getAllComponents.mockReturnValue(componentWithFiles({ [framework]: [] }));

      const result = await validateParity();
      const gaps = result.findings.filter(
        (f) => f.category === 'registry-files-gap'
      );

      expect(gaps).toHaveLength(1);
      expect(gaps[0].message).toContain(framework);
      expect(gaps[0].severity).toBe('error');
      expect(result.passed).toBe(false);
    }
  );

  it('should flag a template directory with no registry entry', async () => {
    // Button templates exist on disk, but the registry knows nothing about it.
    getAllComponents.mockReturnValue({});

    const result = await validateParity();
    const orphans = result.findings.filter(
      (f) => f.category === 'orphaned-template'
    );

    expect(orphans.length).toBeGreaterThan(0);
    expect(orphans.every((f) => f.severity === 'error')).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('should attribute orphans to the framework they were found in', async () => {
    getAllComponents.mockReturnValue({});

    const result = await validateParity();

    expect(result.stats.orphaned.react).toBeGreaterThan(0);
    expect(result.stats.orphaned.vue).toBeGreaterThan(0);
    expect(result.stats.orphaned.angular).toBeGreaterThan(0);
  });

  it('should keep the gap stat consistent with the findings it reports', async () => {
    getAllComponents.mockReturnValue(componentWithFiles({ vue: [] }));

    const result = await validateParity();

    expect(result.stats.registryFilesGaps).toBe(
      result.findings.filter((f) => f.category === 'registry-files-gap').length
    );
  });
});
