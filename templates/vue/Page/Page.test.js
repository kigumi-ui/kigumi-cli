import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Page from './Page.vue';

describe('Page', () => {
  it('renders without crashing', () => {
    const { container } = mount(Page);
    expect(container.querySelector('wa-page')).toBeTruthy();
  });
});
