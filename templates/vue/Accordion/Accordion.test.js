import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Accordion from './Accordion.vue';

describe('Accordion', () => {
  it('renders without crashing', () => {
    const { container } = render(Accordion);
    expect(container.querySelector('wa-accordion')).toBeTruthy();
  });
});
