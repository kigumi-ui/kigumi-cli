import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Spinner from './Spinner.vue';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(Spinner);
    expect(container.querySelector('wa-spinner')).toBeTruthy();
  });
});
