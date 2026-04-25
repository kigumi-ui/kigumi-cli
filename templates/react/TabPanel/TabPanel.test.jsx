import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { TabPanel } from './TabPanel';

describe('TabPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<TabPanel name="panel-1">Content</TabPanel>);
    expect(container.querySelector('wa-tab-panel')).toBeInTheDocument();
  });
});
