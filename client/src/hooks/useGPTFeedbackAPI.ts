// Block 95b Implementation
import { useAuth } from './useAuth';
import { usePortfolio } from '../contexts/PortfolioContext';

function hasUserId(user: any): user is { userId: string } {
  return user && typeof user.userId === 'string';
}

export function useGPTFeedbackAPI() {
  // Block 95b Implementation
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();

  const submitFeedbackForDecision = async (
    decisionId: string,
    feedback: 'approved' | 'rejected'
  ): Promise<boolean> => {
    if (typeof window === 'undefined' || !user || !activeVaultId) return false;
    try {
      const res = await fetch('/api/gpt/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(hasUserId(user) ? { Authorization: user.userId } : {}),
        },
        body: JSON.stringify({ decisionId, feedback, vaultId: activeVaultId }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  };

  return { submitFeedbackForDecision };
} 