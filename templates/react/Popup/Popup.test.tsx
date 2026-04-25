import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Popup } from './Popup';

describe('Popup', () => {
  it('renders without crashing', () => {
    const { container } = render(<Popup />);
    expect(container.querySelector('wa-popup')).toBeTruthy();
  });
});
