import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import ButtonGroup from './ButtonGroup.vue';

describe('ButtonGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(ButtonGroup);
    expect(container.querySelector('wa-button-group')).toBeTruthy();
  });
});
