import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import AccordionItem from './AccordionItem.vue';

describe('AccordionItem', () => {
  it('renders without crashing', () => {
    const { container } = render(AccordionItem);
    expect(container.querySelector('wa-accordion-item')).toBeTruthy();
  });
});
