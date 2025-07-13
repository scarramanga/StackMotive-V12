// ExportEngine.ts - Client-side export/archive utility (SSR-safe, frontend-only)

/**
 * exportArchive - Bundles selected app state into a downloadable JSON archive.
 * @param {Object} params
 * @param {any[]} params.vaultBeliefs - Vault beliefs array
 * @param {any[]} params.journalLogs - Journal entries array
 * @param {any} params.portfolioState - Portfolio state object
 * @param {('vault'|'journal'|'portfolio'|'all')} params.scope - What to export
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function exportArchive({ vaultBeliefs, journalLogs, portfolioState, scope }:{
  vaultBeliefs: any[],
  journalLogs: any[],
  portfolioState: any,
  scope: 'vault'|'journal'|'portfolio'|'all',
}): Promise<{success: boolean, error?: string}> {
  try {
    // Build export object based on scope
    const data: Record<string, any> = {};
    if (scope === 'vault' || scope === 'all') data.vaultBeliefs = vaultBeliefs;
    if (scope === 'journal' || scope === 'all') data.journalLogs = journalLogs;
    if (scope === 'portfolio' || scope === 'all') data.portfolioState = portfolioState;
    // Add export metadata
    data.exportedAt = new Date().toISOString();
    data.exportScope = scope;
    // Serialize to JSON
    const json = JSON.stringify(data, null, 2);
    // Create blob and trigger download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StackMotive_Export_${scope}_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    return { success: true };
  } catch (error:any) {
    return { success: false, error: error?.message || 'Export failed' };
  }
} 