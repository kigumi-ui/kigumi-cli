import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Divider from './Divider.vue';

describe('Divider', () => {
  it('renders without crashing', () => {
    const { container } = render(Divider);
    expect(container.querySelector('wa-divider')).toBeTruthy();
  });
});
