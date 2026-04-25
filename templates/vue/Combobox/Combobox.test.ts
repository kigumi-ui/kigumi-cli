import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Combobox from './Combobox.vue';

describe('Combobox', () => {
  it('renders without crashing', () => {
    const { container } = render(Combobox);
    expect(container.querySelector('wa-combobox')).toBeTruthy();
  });
});
