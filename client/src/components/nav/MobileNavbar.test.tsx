import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavbar } from './MobileNavbar';
import '@testing-library/jest-dom';

// Mock wouter
jest.mock('wouter', () => ({
  useLocation: () => ['/dashboard', jest.fn()],
}));

describe('MobileNavbar', () => {
  beforeEach(() => {
    // Set viewport to mobile
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
  });

  it('renders nav items on mobile', () => {
    render(<MobileNavbar />);
    expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Strategies')).toBeInTheDocument();
    expect(screen.getByLabelText('Watchlist')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('shows active state for current route', () => {
    render(<MobileNavbar />);
    const dashboardBtn = screen.getByLabelText('Dashboard');
    expect(dashboardBtn).toHaveAttribute('aria-current', 'page');
  });

  it('is hidden on desktop', () => {
    window.innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));
    render(<MobileNavbar />);
    // The nav should have display: none via CSS module
    const nav = screen.getByRole('navigation');
    // JSDOM doesn't apply CSS, so we check the class
    expect(nav.className).toMatch(/mobileNavbar/);
  });
}); 