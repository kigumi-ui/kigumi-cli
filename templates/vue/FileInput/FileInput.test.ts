import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import FileInput from './FileInput.vue';

describe('FileInput', () => {
  it('renders without crashing', () => {
    const { container } = render(FileInput);
    expect(container.querySelector('wa-file-input')).toBeTruthy();
  });
});
