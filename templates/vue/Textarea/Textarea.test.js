import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Textarea from './Textarea.vue';

describe('Textarea', () => {
  it('renders without crashing', () => {
    const { container } = render(Textarea);
    expect(container.querySelector('wa-textarea')).toBeTruthy();
  });
});
