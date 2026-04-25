import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Tab } from './Tab';

describe('Tab', () => {
  it('renders without crashing', () => {
    const { container } = render(<Tab />);
    expect(container.querySelector('wa-tab')).toBeTruthy();
  });
});
