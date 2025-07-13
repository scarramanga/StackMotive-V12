import React from 'react';
import { render, screen } from '@testing-library/react';
import { DiagnosticOverlay } from '@/components/dev/DiagnosticOverlay';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/hooks/useRequireVault', () => ({
  useRequireVault: jest.fn(),
}));
jest.mock('@/hooks/usePortfolio', () => ({
  usePortfolio: jest.fn(),
}));
jest.mock('@/hooks/useGPTSignalLogger', () => ({
  useGPTSignalLogger: jest.fn(() => ({ logGPTSignalForSessionVault: jest.fn() })),
}));
jest.mock('@/hooks/useDiagnosticOverlay', () => ({
  useDiagnosticOverlay: () => ({ isOverlayOpen: true, toggleOverlay: jest.fn() }),
}));
jest.mock('@/utils/isDev', () => ({ isDev: () => true }));

const { useAuth } = require('@/contexts/AuthContext');
const { useRequireVault } = require('@/hooks/useRequireVault');
const { usePortfolio } = require('@/hooks/usePortfolio');
const { useGPTSignalLogger } = require('@/hooks/useGPTSignalLogger');

describe('DiagnosticOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SSR: should render nothing if typeof window === undefined', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;
    useAuth.mockReturnValue({ session: { email: 'test@example.com', userId: '1' } });
    useRequireVault.mockReturnValue({ hasVault: true, loading: false });
    usePortfolio.mockReturnValue({ positions: [], totalEquity: 0, activeVaultId: 'vault-1' });
    const { container } = render(<DiagnosticOverlay />);
    expect(container.firstChild).toBeNull();
    global.window = originalWindow;
  });

  it('Auth/Vault: should render nothing if not authenticated', () => {
    useAuth.mockReturnValue({ session: null });
    useRequireVault.mockReturnValue({ hasVault: true, loading: false });
    usePortfolio.mockReturnValue({ positions: [], totalEquity: 0, activeVaultId: 'vault-1' });
    const { container } = render(<DiagnosticOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('Auth/Vault: should render nothing if vault missing', () => {
    useAuth.mockReturnValue({ session: { email: 'test@example.com', userId: '1' } });
    useRequireVault.mockReturnValue({ hasVault: false, loading: false });
    usePortfolio.mockReturnValue({ positions: [], totalEquity: 0, activeVaultId: null });
    const { container } = render(<DiagnosticOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('Signal: should not call logGPTSignalForSessionVault if vault is null', () => {
    const logSpy = jest.fn();
    useAuth.mockReturnValue({ session: { email: 'test@example.com', userId: '1' } });
    useRequireVault.mockReturnValue({ hasVault: true, loading: false });
    usePortfolio.mockReturnValue({ positions: [], totalEquity: 0, activeVaultId: null });
    useGPTSignalLogger.mockReturnValue({ logGPTSignalForSessionVault: logSpy });
    render(<DiagnosticOverlay />);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('Dev overlay: should render diagnostic content only in browser + Vault mode', () => {
    useAuth.mockReturnValue({ session: { email: 'test@example.com', userId: '1' } });
    useRequireVault.mockReturnValue({ hasVault: true, loading: false });
    usePortfolio.mockReturnValue({ positions: [{ symbol: 'BTC' }], totalEquity: 1000, activeVaultId: 'vault-1' });
    const { getByText } = render(<DiagnosticOverlay />);
    expect(getByText(/Diagnostic Overlay/)).toBeInTheDocument();
    expect(getByText(/Session:/)).toBeInTheDocument();
    expect(getByText(/Vault:/)).toBeInTheDocument();
    expect(getByText(/Positions:/)).toBeInTheDocument();
  });
}); 