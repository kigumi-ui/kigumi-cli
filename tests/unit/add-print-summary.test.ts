import { describe, it, expect, beforeEach } from 'vitest';
import { printSummary } from '../../src/commands/add/index.js';
import type { KigumiConfig } from '../../src/schemas/index.js';
import type { InstallResult } from '../../src/commands/add/installer.js';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';

/**
 * printSummary fans out into four independent reporting concerns: installed
 * components, cross-framework staging, the overwritten-modifications warning,
 * and skipped/failed. Issue #33 splits them into named helpers.
 *
 * Nothing covered this function before the split, so these tests were written
 * against the original 86-line version first and are what make the extraction
 * safe: every assertion here passed before the refactor and after it.
 *
 * `printSummary` is a test-only seam: exported from src/commands/add/index.ts
 * solely so these assertions can reach it, kept at the bottom of that module,
 * with no new public callers. The four helpers it delegates to stay private.
 * See tests/AGENTS.md, "Internals Exported for Test Coverage".
 */

function config(framework: string): KigumiConfig {
  return {
    framework,
    componentsDir: 'src/components/ui',
  } as unknown as KigumiConfig;
}

function result(over: Partial<InstallResult>): InstallResult {
  return {
    name: 'Button',
    success: true,
    staged: false,
    ...over,
  } as InstallResult;
}

let output: RecordingOutput;

beforeEach(() => {
  output = createRecordingOutput();
});

/**
 * All arguments of every call to `method`, flattened for substring checks.
 * printSummary's output is prose, so these assertions read it as text rather
 * than matching exact `{ method, args }` shapes.
 */
function textOf(method: string): string {
  return output.calls
    .filter((c) => c.method === method)
    .map((c) => c.args.map((a) => String(a)).join(' | '))
    .join('\n');
}

describe('installed components', () => {
  it('reports the count and names the registry when one is given', () => {
    printSummary([result({})], config('react'), output, 'acme');
    expect(textOf('success')).toContain('Added 1 component(s) from acme');
  });

  it('omits the source when no registry is given', () => {
    printSummary([result({})], config('react'), output);
    expect(textOf('success')).toContain('Added 1 component(s)');
    expect(textOf('success')).not.toContain('from');
  });

  describe('the import hint forks on framework', () => {
    it('gives React a single named-import statement', () => {
      printSummary(
        [result({ name: 'Button' }), result({ name: 'Card' })],
        config('react'),
        output
      );
      expect(textOf('note')).toContain(
        "import { Button, Card } from '@/components/ui';"
      );
    });

    it('gives Vue one default import per component, with the .vue path', () => {
      printSummary(
        [result({ name: 'Button' }), result({ name: 'Card' })],
        config('vue'),
        output
      );
      const note = textOf('note');
      expect(note).toContain(
        "import Button from '@/components/ui/Button/Button.vue';"
      );
      expect(note).toContain(
        "import Card from '@/components/ui/Card/Card.vue';"
      );
    });

    it('treats Angular like React rather than like Vue', () => {
      printSummary([result({})], config('angular'), output);
      expect(textOf('note')).toContain("from '@/components/ui';");
      expect(textOf('note')).not.toContain('.vue');
    });
  });

  it('says nothing about installs when none succeeded', () => {
    printSummary([result({ success: false })], config('react'), output);
    expect(textOf('success')).not.toContain('Added');
  });
});

describe('cross-framework staging', () => {
  it('reports staged components with their paths and handoff prompt', () => {
    printSummary(
      [
        result({
          name: 'Button',
          staged: true,
          sourceFramework: 'react',
          stagedPath: '.kigumi/foreign/button',
          handoffPrompt: 'convert Button',
        }),
      ],
      config('vue'),
      output
    );

    expect(textOf('success')).toContain(
      'Staged 1 component(s) for cross-framework conversion'
    );
    const note = textOf('note');
    expect(note).toContain('Button (react → vue)');
    expect(note).toContain('Files at: .kigumi/foreign/button');
    expect(note).toContain('Ask Claude: "convert Button"');
  });

  it('omits the prompt line when there is no handoff prompt', () => {
    printSummary(
      [
        result({
          staged: true,
          sourceFramework: 'react',
          stagedPath: 'p',
        }),
      ],
      config('vue'),
      output
    );
    expect(textOf('note')).not.toContain('Ask Claude');
  });

  it('does not count staged components as installed', () => {
    printSummary(
      [result({ staged: true, sourceFramework: 'react', stagedPath: 'p' })],
      config('vue'),
      output
    );
    expect(textOf('success')).not.toContain('Added');
  });
});

describe('overwritten local modifications', () => {
  it('warns and lists the files per component', () => {
    printSummary(
      [result({ name: 'Button', modifiedFiles: ['Button.tsx', 'Button.css'] })],
      config('react'),
      output
    );

    expect(textOf('warning')).toContain(
      'The following components had local modifications that were overwritten:'
    );
    expect(textOf('warn')).toContain('Button: Button.tsx, Button.css');
    expect(textOf('info')).toContain('Review the changes with git diff');
  });

  it('stays silent when the modified list is empty', () => {
    printSummary([result({ modifiedFiles: [] })], config('react'), output);
    expect(textOf('warning')).not.toContain('local modifications');
  });
});

describe('skipped and failed', () => {
  // Issue #177: one line per reason, so an up-to-date component does not
  // read as something the user has to act on.
  it('reports up-to-date components without asking for anything', () => {
    printSummary(
      [result({ skipped: 'up-to-date' }), result({ skipped: 'up-to-date' })],
      config('react'),
      output
    );
    expect(textOf('info')).toBe('2 component(s) already up to date');
  });

  it('points --all skips at --force', () => {
    printSummary([result({ skipped: 'installed' })], config('react'), output);
    expect(textOf('info')).toBe(
      'Skipped 1 installed component(s): pass --force to overwrite'
    );
  });

  it('reports declined overwrites as kept local versions', () => {
    printSummary([result({ skipped: 'declined' })], config('react'), output);
    expect(textOf('info')).toBe('Kept your local version of 1 component(s)');
  });

  it('counts each reason separately in a mixed run', () => {
    printSummary(
      [
        result({ name: 'Button', skipped: 'up-to-date' }),
        result({ name: 'Card', skipped: 'installed' }),
        result({ name: 'Input', skipped: 'declined' }),
      ],
      config('react'),
      output
    );
    expect(textOf('info').split('\n')).toEqual([
      '1 component(s) already up to date',
      'Skipped 1 installed component(s): pass --force to overwrite',
      'Kept your local version of 1 component(s)',
    ]);
  });

  it('reports each failure with its error', () => {
    printSummary(
      [result({ name: 'Button', success: false, error: 'network down' })],
      config('react'),
      output
    );
    expect(textOf('warning')).toContain('Failed to add 1 component(s)');
    expect(textOf('error')).toContain('Button: network down');
  });
});

describe('the closing line', () => {
  it('is a success when something was installed', () => {
    printSummary([result({})], config('react'), output);
    expect(textOf('outro')).toContain('✓ Done');
  });

  it('is a success when something was staged', () => {
    printSummary(
      [result({ staged: true, sourceFramework: 'react', stagedPath: 'p' })],
      config('vue'),
      output
    );
    expect(textOf('outro')).toContain('✓ Done');
  });

  it('reports nothing added when a skip leaves something to do', () => {
    printSummary(
      [result({ skipped: 'up-to-date' }), result({ skipped: 'installed' })],
      config('react'),
      output
    );
    expect(textOf('outro')).toBe('No new components added');
  });

  it('is a success when everything was already up to date', () => {
    printSummary([result({ skipped: 'up-to-date' })], config('react'), output);
    expect(textOf('outro')).toBe('✓ Already up to date');
  });

  it('is not a success when an up-to-date run also had a failure', () => {
    printSummary(
      [result({ skipped: 'up-to-date' }), result({ success: false })],
      config('react'),
      output
    );
    expect(textOf('outro')).toBe('No new components added');
  });

  it('reports nothing added when everything failed', () => {
    printSummary([result({ success: false })], config('react'), output);
    expect(textOf('outro')).toContain('No new components added');
  });
});

describe('the four concerns are independent', () => {
  it('reports all of them together in one run', () => {
    printSummary(
      [
        result({ name: 'Button', modifiedFiles: ['Button.tsx'] }),
        result({
          name: 'Card',
          staged: true,
          sourceFramework: 'react',
          stagedPath: 'p',
        }),
        result({ name: 'Input', skipped: 'installed' }),
        result({ name: 'Select', success: false, error: 'boom' }),
      ],
      config('vue'),
      output
    );

    expect(textOf('success')).toContain('Added 1 component(s)');
    expect(textOf('success')).toContain('Staged 1 component(s)');
    expect(textOf('warn')).toContain('Button: Button.tsx');
    expect(textOf('info')).toContain('Skipped 1 installed component(s)');
    expect(textOf('error')).toContain('Select: boom');
    expect(textOf('outro')).toContain('✓ Done');
  });
});
