import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { beforeAll, describe, expect, it } from 'vitest';
import { THEME_AGENT_MODEL, themeAgentTurn } from '../trigger/theme-agent-turn';
import { acceptedProposals, SCENARIOS } from './theme-agent-scenarios';

// The Theme Agent prompt eval against the real model: `pnpm eval:theme-agent`
// in docs/, before every `pnpm deploy:task`. It costs API tokens, so it
// never runs in CI. See src/kigumi-studio/AGENTS.md, "Deploying the task".

/** How much of the reply the report shows; the reply is never judged. */
const REPLY_PREVIEW = 300;

describe(`Theme Agent prompt eval (${THEME_AGENT_MODEL})`, () => {
  beforeAll(() => {
    // A run without a key verified nothing; it fails, it never passes.
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set, so no scenario ran. Export it, or put it in docs/.env (gitignored).'
      );
    }
  });

  for (const scenario of SCENARIOS) {
    it(scenario.description, async () => {
      const errors: unknown[] = [];
      const result = themeAgentTurn({
        streamText,
        model: anthropic(THEME_AGENT_MODEL),
        messages: scenario.messages,
        snapshot: scenario.snapshot,
      });
      await result.consumeStream({ onError: (error) => errors.push(error) });
      if (errors.length > 0) throw errors[0];

      const steps = await result.steps;
      const proposals = acceptedProposals(
        steps.flatMap((step) => step.toolResults)
      );
      const verdict = scenario.judge(proposals, scenario.snapshot);
      const reply = (await result.text).replace(/\s+/g, ' ').trim();
      console.log(
        [
          `${verdict.pass ? 'PASS' : 'FAIL'} ${scenario.id}: ${verdict.reason}`,
          `  reply (not judged): ${reply.slice(0, REPLY_PREVIEW)}${
            reply.length > REPLY_PREVIEW ? '…' : ''
          }`,
        ].join('\n')
      );
      expect(verdict.pass, verdict.reason).toBe(true);
    });
  }
});
