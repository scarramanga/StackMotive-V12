import { renderHook } from '@testing-library/react-hooks';
import { PortfolioProvider } from '@/contexts/PortfolioContext';
import { useJournalAPI } from '@/hooks/useJournalAPI';

test('useJournalAPI returns stable methods with null vault', () => {
  const { result } = renderHook(() => useJournalAPI(), {
    wrapper: ({ children }) => (
      <PortfolioProvider>{children}</PortfolioProvider>
    )
  });

  expect(typeof result.current.fetchJournalForSessionVault).toBe('function');
  expect(typeof result.current.addJournalEntryForSessionVault).toBe('function');
  expect(typeof result.current.deleteJournalEntryForSessionVault).toBe('function');
}); 