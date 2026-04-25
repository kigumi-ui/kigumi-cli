import React from 'react';
import { render } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders without crashing', () => {
    render(<Toast />);
    expect(document.body.querySelector('wa-toast')).toBeInTheDocument();
  });
});
