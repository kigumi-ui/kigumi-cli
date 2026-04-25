import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Tab } from './Tab';

describe('Tab', () => {
  it('renders without crashing', () => {
    const { container } = render(<Tab panel="panel-1">Tab 1</Tab>);
    expect(container.querySelector('wa-tab')).toBeInTheDocument();
  });
});
