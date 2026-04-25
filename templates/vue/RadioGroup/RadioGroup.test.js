import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import RadioGroup from './RadioGroup.vue';

describe('RadioGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(RadioGroup);
    expect(container.querySelector('wa-radio-group')).toBeTruthy();
  });
});
