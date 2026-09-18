import { describe, it, expect, beforeEach } from 'vitest';
import { printSummary } from '../../src/commands/add/index.js';
import type { KigumiConfig } from '../../src/schemas/index.js';
import type { OutputInterface } from '../../src/output/types.js';
import type { InstallResult } from '../../src/commands/add/installer.js';

/**
 * printSummary fans out into four independent reporting concerns: installed
 * components, cross-framework staging, the overwritten-modifications warning,
 * and skipped/failed. Issue #33 splits them into named helpers.
 *
 * Nothing covered this function before the split, so these tests were written
 * against the original 86-line version first and are what make the extraction
 * safe: every assertion here passed before the refactor and after it.
 */

type Call = [method: string, ...args: string[]];

function recordingOutput(): { output: OutputInterface; calls: Call[] } {
  const calls: Call[] = [];
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push([method, ...args.map((a) => String(a))]);
    };

  const output = {
    start: record('start'),
    message: record('message'),
    stop: record('stop'),
    intro: record('intro'),
    outro: record('outro'),
    info: record('info'),
    success: record('success'),
    warning: record('warning'),
    warn: record('warn'),
    error: record('error'),
    note: record('note'),
    debug: record('debug'),
    spinner: () => ({
      start: record('spinner.start'),
      message: record('spinner.message'),
      stop: record('spinner.stop'),
      error: record('spinner.error'),
    }),
  } as unknown as OutputInterface;

  return { output, calls };
}

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
    skipped: false,
    staged: false,
    ...over,
  } as InstallResult;
}

let calls: Call[];
let output: OutputInterface;

beforeEach(() => {
  ({ output, calls } = recordingOutput());
});

/** All arguments of every call to `method`, flattened for substring checks. */
function textOf(method: string): string {
  return calls
    .filter((c) => c[0] === method)
    .map((c) => c.slice(1).join(' | '))
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
  it('reports the skipped count', () => {
    printSummary([result({ skipped: true })], config('react'), output);
    expect(textOf('info')).toContain('Skipped 1 existing component(s)');
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

  it('reports nothing added when everything was skipped', () => {
    printSummary([result({ skipped: true })], config('react'), output);
    expect(textOf('outro')).toContain('No new components added');
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
        result({ name: 'Input', skipped: true }),
        result({ name: 'Select', success: false, error: 'boom' }),
      ],
      config('vue'),
      output
    );

    expect(textOf('success')).toContain('Added 1 component(s)');
    expect(textOf('success')).toContain('Staged 1 component(s)');
    expect(textOf('warn')).toContain('Button: Button.tsx');
    expect(textOf('info')).toContain('Skipped 1 existing component(s)');
    expect(textOf('error')).toContain('Select: boom');
    expect(textOf('outro')).toContain('✓ Done');
  });
});
