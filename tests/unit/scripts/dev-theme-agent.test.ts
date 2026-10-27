import { describe, expect, it } from 'vitest';
import {
  envFileDirs,
  planLocalAgent,
} from '../../../scripts/dev-theme-agent.mjs';

const ACCESS = { THEME_AGENT_ACCESS_KEY: 'local-access' };
const DEV_KEY = { TRIGGER_SECRET_KEY: 'tr_dev_abc' };
const ANTHROPIC = { ANTHROPIC_API_KEY: 'sk-ant-test' };

describe('planLocalAgent', () => {
  it('runs the local task and Vite against the dev environment', () => {
    const plan = planLocalAgent({
      deployed: false,
      processEnv: {},
      envLocal: { ...ACCESS, ...DEV_KEY, ...ANTHROPIC },
      envFile: {},
    });

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.environment).toBe('dev');
    expect(plan.processes.map((p) => p.name)).toEqual(['trigger', 'vite']);
    const vite = plan.processes.find((p) => p.name === 'vite')!;
    expect(vite.env).toMatchObject({
      THEME_AGENT_LOCAL: '1',
      THEME_AGENT_ACCESS_KEY: 'local-access',
      TRIGGER_SECRET_KEY: 'tr_dev_abc',
    });
    // The trigger CLI authenticates with its login, not a secret key, and
    // hands its environment to the task: only what the task needs.
    const trigger = plan.processes.find((p) => p.name === 'trigger')!;
    expect(trigger.args).toEqual(['dev']);
    expect(trigger.env).toEqual({ ANTHROPIC_API_KEY: 'sk-ant-test' });
  });

  it('names every missing key at once', () => {
    const plan = planLocalAgent({
      deployed: false,
      processEnv: {},
      envLocal: {},
      envFile: {},
    });

    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.problems).toHaveLength(3);
    expect(plan.problems.join('\n')).toMatch(/THEME_AGENT_ACCESS_KEY/);
    expect(plan.problems.join('\n')).toMatch(/TRIGGER_SECRET_KEY/);
    expect(plan.problems.join('\n')).toMatch(/ANTHROPIC_API_KEY/);
  });

  it('refuses a Production key for the local task', () => {
    const plan = planLocalAgent({
      deployed: false,
      processEnv: {},
      envLocal: { ...ACCESS, ...ANTHROPIC, TRIGGER_SECRET_KEY: 'tr_prod_xyz' },
      envFile: {},
    });

    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.problems).toEqual([
      expect.stringMatching(/TRIGGER_SECRET_KEY.*tr_dev_/),
    ]);
  });

  it('takes the Anthropic key from docs/.env, where the eval reads it too', () => {
    const plan = planLocalAgent({
      deployed: false,
      processEnv: {},
      envLocal: { ...ACCESS, ...DEV_KEY },
      envFile: ANTHROPIC,
    });

    expect(plan.ok).toBe(true);
  });

  it('takes the Anthropic key from the shell too, which trigger dev hands to the task', () => {
    const plan = planLocalAgent({
      deployed: false,
      processEnv: { ...ANTHROPIC, PATH: '/bin' },
      envLocal: { ...ACCESS, ...DEV_KEY },
      envFile: {},
    });

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const trigger = plan.processes.find((p) => p.name === 'trigger')!;
    expect(trigger.env).toEqual({ ...ANTHROPIC, PATH: '/bin' });
  });

  it('keeps every other key from the files and the shell away from the local task', () => {
    const plan = planLocalAgent({
      deployed: false,
      processEnv: { TRIGGER_SECRET_KEY: 'tr_dev_shell' },
      envLocal: {
        ...ACCESS,
        ...ANTHROPIC,
        TRIGGER_PROD_SECRET_KEY: 'tr_prod_xyz',
      },
      envFile: {},
    });

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const trigger = plan.processes.find((p) => p.name === 'trigger')!;
    expect(trigger.env).toEqual(ANTHROPIC);
  });

  it('lets the shell override a key from the files', () => {
    const plan = planLocalAgent({
      deployed: false,
      processEnv: { THEME_AGENT_ACCESS_KEY: 'from-shell' },
      envLocal: { ...ACCESS, ...DEV_KEY, ...ANTHROPIC },
      envFile: {},
    });

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const vite = plan.processes.find((p) => p.name === 'vite')!;
    expect(vite.env.THEME_AGENT_ACCESS_KEY).toBe('from-shell');
  });

  describe('--deployed', () => {
    it('runs only Vite, against Production', () => {
      const plan = planLocalAgent({
        deployed: true,
        processEnv: {},
        envLocal: { ...ACCESS, TRIGGER_PROD_SECRET_KEY: 'tr_prod_xyz' },
        envFile: {},
      });

      expect(plan.ok).toBe(true);
      if (!plan.ok) return;
      expect(plan.environment).toBe('prod');
      expect(plan.processes.map((p) => p.name)).toEqual(['vite']);
      expect(plan.processes[0].env.TRIGGER_SECRET_KEY).toBe('tr_prod_xyz');
    });

    it('never falls back to the dev key', () => {
      const plan = planLocalAgent({
        deployed: true,
        processEnv: {},
        envLocal: { ...ACCESS, ...DEV_KEY },
        envFile: {},
      });

      expect(plan.ok).toBe(false);
      if (plan.ok) return;
      expect(plan.problems).toEqual([
        expect.stringMatching(/TRIGGER_PROD_SECRET_KEY/),
      ]);
    });

    it('refuses a dev key under the Production name', () => {
      const plan = planLocalAgent({
        deployed: true,
        processEnv: {},
        envLocal: { ...ACCESS, TRIGGER_PROD_SECRET_KEY: 'tr_dev_abc' },
        envFile: {},
      });

      expect(plan.ok).toBe(false);
    });
  });
});

describe('envFileDirs', () => {
  it('reads the main checkout first and the worktree over it', () => {
    expect(
      envFileDirs({
        docsDir: '/repo/.claude/worktrees/feature/docs',
        commonGitDir: '/repo/.git',
      })
    ).toEqual(['/repo/docs', '/repo/.claude/worktrees/feature/docs']);
  });

  it('reads one directory in the main checkout', () => {
    expect(
      envFileDirs({ docsDir: '/repo/docs', commonGitDir: '/repo/.git' })
    ).toEqual(['/repo/docs']);
  });

  it('reads only docs/ when git is not there to ask', () => {
    expect(
      envFileDirs({ docsDir: '/repo/docs', commonGitDir: undefined })
    ).toEqual(['/repo/docs']);
  });
});
