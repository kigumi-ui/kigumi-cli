import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Page from './Page.vue';

describe('Page', () => {
  it('renders without crashing', () => {
    const { container } = render(Page);
    expect(container.querySelector('wa-page')).toBeTruthy();
  });
});
