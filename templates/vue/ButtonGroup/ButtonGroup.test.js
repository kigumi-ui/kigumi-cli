import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import ButtonGroup from './ButtonGroup.vue';

describe('ButtonGroup', () => {
  it('renders without crashing', () => {
    const { container } = mount(ButtonGroup);
    expect(container.querySelector('wa-button-group')).toBeTruthy();
  });
});
