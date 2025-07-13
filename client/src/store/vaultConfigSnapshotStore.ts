// Block 29: Vault Config Snapshot - Store
// Zustand store for vault configuration snapshot management

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { VaultConfigSnapshot } from '../types/vaultConfigSnapshot';

interface VaultConfigSnapshotState {
  // Data
  snapshots: VaultConfigSnapshot[];
  
  // Selection
  selectedSnapshot: string | null;
  
  // View state
  view: 'list' | 'timeline' | 'tree' | 'comparison';
  
  // Filter state
  filter: {
    vault: string | 'all';
    status: 'all' | 'active' | 'inactive' | 'valid' | 'invalid';
    timeRange: 'all' | 'today' | 'week' | 'month' | 'quarter';
    tags: string[];
    search: string;
  };
  
  // Sort state
  sort: {
    field: 'createdAt' | 'name' | 'version' | 'vault';
    direction: 'asc' | 'desc';
  };
  
  // Settings
  settings: {
    autoValidate: boolean;
    showInvalidSnapshots: boolean;
    enableVersioning: boolean;
    retentionDays: number;
    maxSnapshotsPerVault: number;
  };
  
  // Actions
  setSnapshots: (snapshots: VaultConfigSnapshot[]) => void;
  addSnapshot: (snapshot: VaultConfigSnapshot) => void;
  updateSnapshot: (id: string, updates: Partial<VaultConfigSnapshot>) => void;
  removeSnapshot: (id: string) => void;
  setSelectedSnapshot: (id: string | null) => void;
  
  setView: (view: 'list' | 'timeline' | 'tree' | 'comparison') => void;
  setFilter: (filter: Partial<VaultConfigSnapshotState['filter']>) => void;
  setSort: (sort: VaultConfigSnapshotState['sort']) => void;
  setSettings: (settings: Partial<VaultConfigSnapshotState['settings']>) => void;
  
  // Computed getters
  getSnapshot: (id: string) => VaultConfigSnapshot | undefined;
  getSnapshotsByVault: (vaultId: string) => VaultConfigSnapshot[];
  getFilteredSnapshots: () => VaultConfigSnapshot[];
  getSortedSnapshots: () => VaultConfigSnapshot[];
  getActiveSnapshots: () => VaultConfigSnapshot[];
  getValidSnapshots: () => VaultConfigSnapshot[];
  
  // Utilities
  clearOldSnapshots: () => void;
  exportSnapshots: () => string;
  importSnapshots: (data: string) => void;
}

export const useVaultConfigSnapshotStore = create<VaultConfigSnapshotState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial data
        snapshots: [],
        
        // Initial selection
        selectedSnapshot: null,
        
        // Initial view state
        view: 'list',
        
        // Initial filter state
        filter: {
          vault: 'all',
          status: 'all',
          timeRange: 'all',
          tags: [],
          search: ''
        },
        
        // Initial sort state
        sort: {
          field: 'createdAt',
          direction: 'desc'
        },
        
        // Initial settings
        settings: {
          autoValidate: true,
          showInvalidSnapshots: true,
          enableVersioning: true,
          retentionDays: 90,
          maxSnapshotsPerVault: 50
        },
        
        // Snapshot actions
        setSnapshots: (snapshots) => set({ snapshots }),
        addSnapshot: (snapshot) => set((state) => ({ 
          snapshots: [...state.snapshots, snapshot] 
        })),
        updateSnapshot: (id, updates) => set((state) => ({
          snapshots: state.snapshots.map(s => 
            s.id === id ? { ...s, ...updates } : s
          )
        })),
        removeSnapshot: (id) => set((state) => ({
          snapshots: state.snapshots.filter(s => s.id !== id),
          selectedSnapshot: state.selectedSnapshot === id ? null : state.selectedSnapshot
        })),
        setSelectedSnapshot: (id) => set({ selectedSnapshot: id }),
        
        // View actions
        setView: (view) => set({ view }),
        setFilter: (filter) => set((state) => ({
          filter: { ...state.filter, ...filter }
        })),
        setSort: (sort) => set({ sort }),
        setSettings: (settings) => set((state) => ({
          settings: { ...state.settings, ...settings }
        })),
        
        // Computed getters
        getSnapshot: (id) => {
          const state = get();
          return state.snapshots.find(s => s.id === id);
        },
        
        getSnapshotsByVault: (vaultId) => {
          const state = get();
          return state.snapshots.filter(s => s.vaultId === vaultId);
        },
        
        getFilteredSnapshots: () => {
          const state = get();
          let filtered = state.snapshots;
          
          // Filter by vault
          if (state.filter.vault !== 'all') {
            filtered = filtered.filter(s => s.vaultId === state.filter.vault);
          }
          
          // Filter by status
          if (state.filter.status !== 'all') {
            filtered = filtered.filter(s => {
              switch (state.filter.status) {
                case 'active': return s.isActive;
                case 'inactive': return !s.isActive;
                case 'valid': return s.isValid;
                case 'invalid': return !s.isValid;
                default: return true;
              }
            });
          }
          
          // Filter by time range
          if (state.filter.timeRange !== 'all') {
            const now = new Date();
            let cutoff: Date;
            
            switch (state.filter.timeRange) {
              case 'today':
                cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
              case 'week':
                cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
              case 'month':
                cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
              case 'quarter':
                cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
              default:
                cutoff = new Date(0);
            }
            
            filtered = filtered.filter(s => s.createdAt >= cutoff);
          }
          
          // Filter by tags
          if (state.filter.tags.length > 0) {
            filtered = filtered.filter(s => 
              state.filter.tags.some(tag => s.tags.includes(tag))
            );
          }
          
          // Filter by search
          if (state.filter.search) {
            const search = state.filter.search.toLowerCase();
            filtered = filtered.filter(s => 
              s.name.toLowerCase().includes(search) ||
              s.description.toLowerCase().includes(search) ||
              s.vaultId.toLowerCase().includes(search) ||
              s.tags.some(tag => tag.toLowerCase().includes(search))
            );
          }
          
          return filtered;
        },
        
        getSortedSnapshots: () => {
          const state = get();
          const filtered = state.getFilteredSnapshots();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.sort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'createdAt':
                aValue = a.createdAt;
                bValue = b.createdAt;
                break;
              case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
              case 'version':
                aValue = a.version;
                bValue = b.version;
                break;
              case 'vault':
                aValue = a.vaultId;
                bValue = b.vaultId;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        getActiveSnapshots: () => {
          const state = get();
          return state.snapshots.filter(s => s.isActive);
        },
        
        getValidSnapshots: () => {
          const state = get();
          return state.snapshots.filter(s => s.isValid);
        },
        
        // Utilities
        clearOldSnapshots: () => set((state) => {
          const cutoff = new Date(Date.now() - state.settings.retentionDays * 24 * 60 * 60 * 1000);
          return {
            snapshots: state.snapshots.filter(s => s.createdAt >= cutoff || s.isActive)
          };
        }),
        
        exportSnapshots: () => {
          const state = get();
          return JSON.stringify({
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            snapshots: state.snapshots
          }, null, 2);
        },
        
        importSnapshots: (data) => {
          try {
            const imported = JSON.parse(data);
            if (imported.snapshots && Array.isArray(imported.snapshots)) {
              set((state) => ({
                snapshots: [...state.snapshots, ...imported.snapshots]
              }));
            }
          } catch (error) {
            console.error('Failed to import snapshots:', error);
          }
        }
      }),
      {
        name: 'vault-config-snapshot-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist UI preferences and settings only
          view: state.view,
          filter: state.filter,
          sort: state.sort,
          settings: state.settings
        }),
        version: 1
      }
    )
  )
);

// Selector hooks for specific data
export const useSnapshotData = () => useVaultConfigSnapshotStore(state => ({
  snapshots: state.snapshots,
  selectedSnapshot: state.selectedSnapshot,
  getSnapshot: state.getSnapshot,
  getSortedSnapshots: state.getSortedSnapshots
}));

export const useSnapshotFilters = () => useVaultConfigSnapshotStore(state => ({
  filter: state.filter,
  sort: state.sort,
  setFilter: state.setFilter,
  setSort: state.setSort,
  getFilteredSnapshots: state.getFilteredSnapshots
}));

export const useSnapshotSettings = () => useVaultConfigSnapshotStore(state => ({
  settings: state.settings,
  setSettings: state.setSettings
})); 