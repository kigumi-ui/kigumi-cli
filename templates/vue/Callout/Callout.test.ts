import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Callout from './Callout.vue';

describe('Callout', () => {
  it('renders without crashing', () => {
    const { container } = mount(Callout);
    expect(container.querySelector('wa-callout')).toBeTruthy();
  });
});
