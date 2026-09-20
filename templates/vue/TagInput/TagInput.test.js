import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import TagInput from './TagInput.vue';

describe('TagInput', () => {
  it('renders without crashing', () => {
    const { container } = render(TagInput);
    expect(container.querySelector('wa-tag-input')).toBeTruthy();
  });
});
