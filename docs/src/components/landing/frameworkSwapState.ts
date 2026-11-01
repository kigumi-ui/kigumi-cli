/**
 * State for the hero's framework swap animation.
 *
 * `step` counts every swap since mount and never wraps, so the current framework is
 * `step % count`. The rail renders the framework list three times and keeps the active
 * chip in the middle copy. When the active framework wraps back to the first one, the
 * rail first slides on into the third copy (`railPos === 2 * count`) so the motion keeps
 * its direction, then `snap` jumps it back to the same chip in the middle copy without
 * a transition, and `resume` turns the transition back on.
 */
export interface FrameworkSwapState {
  step: number;
  railPos: number;
  railAnimated: boolean;
}

export type FrameworkSwapAction =
  { type: 'tick' } | { type: 'snap' } | { type: 'resume' };

export function initialFrameworkSwapState(count: number): FrameworkSwapState {
  return { step: 0, railPos: count, railAnimated: true };
}

export function frameworkSwapReducer(
  count: number,
  state: FrameworkSwapState,
  action: FrameworkSwapAction
): FrameworkSwapState {
  switch (action.type) {
    case 'tick': {
      const step = state.step + 1;
      const index = step % count;
      return {
        step,
        railPos: index === 0 ? 2 * count : count + index,
        railAnimated: true,
      };
    }
    case 'snap':
      if (state.railPos < 2 * count) return state;
      return { ...state, railPos: state.railPos - count, railAnimated: false };
    case 'resume':
      if (state.railAnimated) return state;
      return { ...state, railAnimated: true };
  }
}
