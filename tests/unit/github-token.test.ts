/**
 * GitHub Token Resolution Tests
 *
 * Tests the fallback chain for GitHub token resolution:
 * 1. GITHUB_TOKEN env var
 * 2. KIGUMI_GITHUB_TOKEN env var
 * 3. `gh auth token` CLI output
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGitHubToken } from '../../src/utils/github-token.js';
import { execa } from 'execa';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

const mockedExeca = vi.mocked(execa);

describe('getGitHubToken', () => {
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      KIGUMI_GITHUB_TOKEN: process.env.KIGUMI_GITHUB_TOKEN,
    };
    delete process.env.GITHUB_TOKEN;
    delete process.env.KIGUMI_GITHUB_TOKEN;
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (savedEnv.GITHUB_TOKEN !== undefined) {
      process.env.GITHUB_TOKEN = savedEnv.GITHUB_TOKEN;
    } else {
      delete process.env.GITHUB_TOKEN;
    }
    if (savedEnv.KIGUMI_GITHUB_TOKEN !== undefined) {
      process.env.KIGUMI_GITHUB_TOKEN = savedEnv.KIGUMI_GITHUB_TOKEN;
    } else {
      delete process.env.KIGUMI_GITHUB_TOKEN;
    }
  });

  it('should return GITHUB_TOKEN when set', async () => {
    process.env.GITHUB_TOKEN = 'ghp_abc123';

    const token = await getGitHubToken();
    expect(token).toBe('ghp_abc123');
    expect(mockedExeca).not.toHaveBeenCalled();
  });

  it('should fall back to KIGUMI_GITHUB_TOKEN when GITHUB_TOKEN is not set', async () => {
    process.env.KIGUMI_GITHUB_TOKEN = 'ghp_kigumi456';

    const token = await getGitHubToken();
    expect(token).toBe('ghp_kigumi456');
    expect(mockedExeca).not.toHaveBeenCalled();
  });

  it('should fall back to gh auth token when no env vars are set', async () => {
    mockedExeca.mockResolvedValue({
      stdout: 'ghp_cli789',
    } as never);

    const token = await getGitHubToken();
    expect(token).toBe('ghp_cli789');
    expect(mockedExeca).toHaveBeenCalledWith('gh', ['auth', 'token']);
  });

  it('should return undefined when all sources fail', async () => {
    mockedExeca.mockRejectedValue(new Error('gh not found'));

    const token = await getGitHubToken();
    expect(token).toBeUndefined();
  });

  it('should trim whitespace and newlines from env var tokens', async () => {
    process.env.GITHUB_TOKEN = '  ghp_whitespace  \n';

    const token = await getGitHubToken();
    expect(token).toBe('ghp_whitespace');
  });

  it('should prioritize GITHUB_TOKEN over KIGUMI_GITHUB_TOKEN', async () => {
    process.env.GITHUB_TOKEN = 'ghp_primary';
    process.env.KIGUMI_GITHUB_TOKEN = 'ghp_fallback';

    const token = await getGitHubToken();
    expect(token).toBe('ghp_primary');
  });

  it('should skip empty string GITHUB_TOKEN and try next source', async () => {
    process.env.GITHUB_TOKEN = '';
    process.env.KIGUMI_GITHUB_TOKEN = 'ghp_nonempty';

    const token = await getGitHubToken();
    expect(token).toBe('ghp_nonempty');
  });
});
