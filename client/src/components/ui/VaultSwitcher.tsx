import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';

const VaultSwitcher: React.FC = () => {
  const { vaultList, activeVaultId, setActiveVaultId } = usePortfolio();
  const [selected, setSelected] = useState<string | null>(activeVaultId);

  useEffect(() => {
    setSelected(activeVaultId);
  }, [activeVaultId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && selected) {
      window.localStorage.setItem('activeVaultId', selected);
    }
  }, [selected]);

  if (!vaultList || vaultList.length <= 1) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelected(e.target.value);
    setActiveVaultId(e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="vault-switcher" className="text-sm font-medium text-gray-700 dark:text-gray-200">Vault:</label>
      <select
        id="vault-switcher"
        value={selected || ''}
        onChange={handleChange}
        className="border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        {vaultList.map(vault => (
          <option key={vault.id} value={vault.id}>{vault.name}</option>
        ))}
      </select>
    </div>
  );
};

export default VaultSwitcher; 