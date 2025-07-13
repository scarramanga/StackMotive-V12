import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { usePortfolio } from '../../../contexts/PortfolioContext';
import VaultSwitcher from '../../../components/ui/VaultSwitcher';
import JournalPanel from '../../../components/ui/JournalPanel';
import SignalPanel from '../../../components/ui/SignalPanel';
import GPTSignalInsights from '../../../components/ui/GPTSignalInsights';
import GPTSignalChart from '../../../components/ui/GPTSignalChart';
import VaultGPTInteractionLog from '../../../components/ui/VaultGPTInteractionLog';

const VaultRequired: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
    <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mb-2">Vault Required</h2>
    <p className="text-gray-500 dark:text-gray-400 max-w-md">
      You must create or select a Vault to access the dashboard.
    </p>
  </div>
);

const VaultDashboardPage: React.FC = () => {
  // Block 87 Implementation
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();

  if (typeof window === 'undefined' || !user) return null;
  if (!activeVaultId) return <VaultRequired />;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-2 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mb-4">
          {/* Reserved: VaultSwitcher, GPTSignalInsights */}
          <div className="flex-1" />
          <div className="flex-1" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="flex flex-col gap-8">
            {/* Reserved: GPTSignalCard, GPTSignalManualLogger */}
            <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-300 dark:border-gray-700">
              {/* GPTSignalCard (Block 88) */}
              <span>GPTSignalCard</span>
            </div>
            <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-300 dark:border-gray-700">
              {/* GPTSignalManualLogger (Block 92) */}
              <span>GPTSignalManualLogger</span>
            </div>
          </section>
          <section className="flex flex-col gap-8">
            {/* Reserved: GPTSignalChart, VaultGPTInteractionLog */}
            <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-300 dark:border-gray-700">
              {/* GPTSignalChart (Block 89) */}
              <span>GPTSignalChart</span>
            </div>
            <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-300 dark:border-gray-700">
              {/* VaultGPTInteractionLog (Block 91) */}
              <span>VaultGPTInteractionLog</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default VaultDashboardPage; 