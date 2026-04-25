import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Combobox from './Combobox.vue';

describe('Combobox', () => {
  it('renders without crashing', () => {
    const { container } = mount(Combobox);
    expect(container.querySelector('wa-combobox')).toBeTruthy();
  });
});
