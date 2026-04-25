import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import FileInput from './FileInput.vue';

describe('FileInput', () => {
  it('renders without crashing', () => {
    const { container } = mount(FileInput);
    expect(container.querySelector('wa-file-input')).toBeTruthy();
  });
});
