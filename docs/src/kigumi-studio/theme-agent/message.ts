import type { UIMessage } from 'ai';
import { THEME_AGENT_PROPOSE_TOOL } from './constants';
import type { ProposeThemeOutput, ThemeProposalInput } from './proposal';

/** A chat message of the Theme Agent: its status steps and `propose_theme` calls. */
export type ThemeAgentMessage = UIMessage<
  unknown,
  { status: { step: string } },
  {
    [THEME_AGENT_PROPOSE_TOOL]: {
      input: ThemeProposalInput;
      output: ProposeThemeOutput;
    };
  }
>;
