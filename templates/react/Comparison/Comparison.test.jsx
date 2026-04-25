import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Comparison } from './Comparison';

describe('Comparison', () => {
  it('renders without crashing', () => {
    const { container } = render(<Comparison />);
    expect(container.querySelector('wa-comparison')).toBeInTheDocument();
  });

  it('renders slot content', () => {
    const { container } = render(
      <Comparison>
        <div slot="before">Before</div>
        <div slot="after">After</div>
      </Comparison>
    );
    expect(container.querySelector('[slot="before"]')).toBeInTheDocument();
    expect(container.querySelector('[slot="after"]')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Comparison className="custom-class" />);
    const element = container.querySelector('wa-comparison');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
