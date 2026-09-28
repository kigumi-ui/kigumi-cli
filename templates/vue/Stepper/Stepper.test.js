import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Stepper from './Stepper.vue';

describe('Stepper', () => {
  it('renders without crashing', () => {
    const { container } = render(Stepper);
    expect(container.querySelector('wa-stepper')).toBeTruthy();
  });
});
