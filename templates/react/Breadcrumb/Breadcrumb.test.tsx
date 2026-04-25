import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb', () => {
  it('renders without crashing', () => {
    const { container } = render(<Breadcrumb />);
    expect(container.querySelector('wa-breadcrumb')).toBeTruthy();
  });
});
