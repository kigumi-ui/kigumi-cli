import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Breadcrumb>
        <div>Item</div>
      </Breadcrumb>
    );
    expect(container.querySelector('wa-breadcrumb')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Breadcrumb className="custom-class">
        <div>Item</div>
      </Breadcrumb>
    );
    const element = container.querySelector('wa-breadcrumb');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });

  it('passes label prop', () => {
    const { container } = render(
      <Breadcrumb label="Navigation">
        <div>Item</div>
      </Breadcrumb>
    );
    const element = container.querySelector('wa-breadcrumb');
    expect(element?.getAttribute('label')).toBe('Navigation');
  });
});
