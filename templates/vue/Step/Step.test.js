import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Step from './Step.vue';

describe('Step', () => {
  it('renders without crashing', () => {
    const { container } = render(Step);
    expect(container.querySelector('wa-step')).toBeTruthy();
  });
});
