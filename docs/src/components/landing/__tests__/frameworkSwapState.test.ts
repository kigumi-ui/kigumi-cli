import { describe, expect, it } from 'vitest';
import {
  frameworkSwapReducer,
  initialFrameworkSwapState,
  type FrameworkSwapState,
} from '../frameworkSwapState';

const COUNT = 4;
const reduce = (state: FrameworkSwapState, type: 'tick' | 'snap' | 'resume') =>
  frameworkSwapReducer(COUNT, state, { type });

describe('frameworkSwapReducer', () => {
  it('starts on the first framework in the middle copy of the rail', () => {
    expect(initialFrameworkSwapState(COUNT)).toEqual({
      step: 0,
      railPos: COUNT,
      railAnimated: true,
    });
  });

  it('moves the rail one chip per tick while the framework does not wrap', () => {
    let state = initialFrameworkSwapState(COUNT);
    for (let i = 1; i < COUNT; i++) {
      state = reduce(state, 'tick');
      expect(state.step % COUNT).toBe(i);
      expect(state.railPos).toBe(COUNT + i);
    }
  });

  it('slides on into the third copy when the framework wraps, then snaps back', () => {
    let state = initialFrameworkSwapState(COUNT);
    for (let i = 0; i < COUNT; i++) state = reduce(state, 'tick');

    expect(state.step % COUNT).toBe(0);
    expect(state.railPos).toBe(2 * COUNT);
    expect(state.railAnimated).toBe(true);

    state = reduce(state, 'snap');
    expect(state.railPos).toBe(COUNT);
    expect(state.railAnimated).toBe(false);

    state = reduce(state, 'resume');
    expect(state.railAnimated).toBe(true);

    state = reduce(state, 'tick');
    expect(state.railPos).toBe(COUNT + 1);
  });

  it('keeps the active chip on the same framework across the snap', () => {
    let state = initialFrameworkSwapState(COUNT);
    for (let i = 0; i < COUNT; i++) state = reduce(state, 'tick');
    const before = state.railPos % COUNT;
    state = reduce(state, 'snap');
    expect(state.railPos % COUNT).toBe(before);
    expect(state.railPos % COUNT).toBe(state.step % COUNT);
  });

  it('ignores a snap or resume that has nothing to do', () => {
    const state = reduce(initialFrameworkSwapState(COUNT), 'tick');
    expect(reduce(state, 'snap')).toBe(state);
    expect(reduce(state, 'resume')).toBe(state);
  });
});
