import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import CopyButton from './CopyButton.vue';

describe('CopyButton', () => {
  it('renders without crashing', () => {
    const { container } = render(CopyButton);
    expect(container.querySelector('wa-copy-button')).toBeTruthy();
  });
});
