import React from 'react';

/**
 * Block 24: Vault Integration (Obsidian)
 * Placeholder for sovereign asset vault tracking and Obsidian/local markdown integration.
 */
export const VaultPanel: React.FC = () => {
  // TODO: Integrate with backend table for vault entries
  // TODO: Support Obsidian/local markdown sync
  // TODO: Implement import logic for JSON/markdown files

  return (
    <section className="rounded-xl bg-card dark:bg-card/80 p-4 shadow-lg border border-border max-w-2xl mx-auto my-6 transition-colors">
      <h2 className="text-lg font-semibold mb-2">Sovereign Asset Vault (Obsidian Integration)</h2>
      <p className="text-sm text-muted-foreground mb-4">
        This panel will allow you to track sovereign assets in cold storage, with optional integration to Obsidian vaults or local markdown files.<br />
        <span className="font-medium">Coming soon:</span> Import, sync, and audit your sovereign asset records with full sovereignty and privacy.
      </p>
      <form className="mb-4">
        <label htmlFor="vault-import" className="block text-xs font-medium mb-1">Import Vault Records (JSON or Markdown)</label>
        <input
          id="vault-import"
          type="file"
          accept=".json,.md,.markdown,.txt"
          className="block w-full text-xs border rounded p-2 bg-background/80 dark:bg-background/60"
          disabled
          aria-disabled="true"
        />
        <span className="text-xs text-muted-foreground">(Import coming soon)</span>
      </form>
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Sovereign Asset Records</h3>
        <div className="text-xs text-muted-foreground">No records yet. (Future: List imported or synced assets here.)</div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-1">Vault History & Notes</h3>
        <div className="text-xs text-muted-foreground">No history or notes yet. (Future: Show vault change log and user notes.)</div>
      </div>
    </section>
  );
}; 