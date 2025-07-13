export async function getVaults() {
  // Mock: return a static list of vaults
  return [
    {
      vault_id: 'mock-vault-1',
      user_id: 'mock-user-1',
      beliefs: [
        { id: 'btc-sov-store', statement: 'BTC is the ultimate sovereign store of value.', confidence: 5 },
        { id: 'usd-debase', statement: 'The USD will structurally debase over time.', confidence: 4 },
      ],
      created_at: new Date().toISOString(),
    },
  ];
}

export async function saveVault(vault: any) {
  // Mock: pretend to save and return success
  return { success: true, vault };
}

export async function logEvent({ user_id, type, payload }: { user_id: string, type: string, payload: any }) {
  // Mock: pretend to log event
  return { success: true, log_id: 'mock-log-1', timestamp: new Date().toISOString() };
} 