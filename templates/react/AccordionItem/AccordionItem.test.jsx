import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AccordionItem } from './AccordionItem';

describe('AccordionItem', () => {
  it('renders without crashing', () => {
    const { container } = render(<AccordionItem />);
    expect(container.querySelector('wa-accordion-item')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-accordion-item', () => {
    const { container } = render(<AccordionItem className="custom-class" />);
    const element = container.querySelector('wa-accordion-item');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
