import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Popup } from './Popup';

describe('Popup', () => {
  it('renders without crashing', () => {
    const { container } = render(<Popup>Content</Popup>);
    expect(container.querySelector('wa-popup')).toBeInTheDocument();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(<Popup ref={ref}>Content</Popup>);
    expect(ref.current).toHaveProperty('reposition');
  });
});
