import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Markdown from './Markdown.vue';

describe('Markdown', () => {
  it('renders without crashing', () => {
    const { container } = render(Markdown);
    expect(container.querySelector('wa-markdown')).toBeTruthy();
  });
});
