import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Dialog from './Dialog.vue';

describe('Dialog', () => {
  it('renders without crashing', () => {
    const { container } = render(Dialog);
    expect(container.querySelector('wa-dialog')).toBeTruthy();
  });
});
