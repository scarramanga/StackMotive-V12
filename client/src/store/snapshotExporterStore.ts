// Block 12: Snapshot Exporter - Store
// Zustand store for snapshot export state management

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SnapshotExporterEngine } from '../engines/SnapshotExporterEngine';
import {
  DashboardSnapshot,
  SnapshotTemplate,
  SnapshotState,
  SnapshotActions,
  SnapshotSettings,
  SnapshotFilters,
  SnapshotExportRequest,
  SnapshotImportRequest
} from '../types/snapshotExporter';

interface SnapshotExporterStore extends SnapshotState {
  actions: SnapshotActions;
  
  // Additional store methods
  setCurrentSnapshot: (snapshot: DashboardSnapshot | null) => void;
  setSelectedSnapshots: (ids: string[]) => void;
  addSelectedSnapshot: (id: string) => void;
  removeSelectedSnapshot: (id: string) => void;
  clearSelectedSnapshots: () => void;
  setFilters: (filters: Partial<SnapshotFilters>) => void;
  setSorting: (sortBy: 'name' | 'createdAt' | 'size', order: 'asc' | 'desc') => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Computed selectors
  getSnapshotById: (id: string) => DashboardSnapshot | undefined;
  getFilteredSnapshots: () => DashboardSnapshot[];
  getSortedSnapshots: (snapshots: DashboardSnapshot[]) => DashboardSnapshot[];
  getSelectedSnapshots: () => DashboardSnapshot[];
  getSnapshotStats: () => {
    total: number;
    shared: number;
    withData: number;
    withImages: number;
    totalSize: number;
  };
}

export const useSnapshotExporterStore = create<SnapshotExporterStore>()(
  persist(
    (set, get) => ({
      // Initial state
      snapshots: [],
      templates: [],
      currentSnapshot: null,
      selectedSnapshotIds: [],
      
      // UI state
      isExporting: false,
      isImporting: false,
      exportProgress: 0,
      importProgress: 0,
      
      // Filters and sorting
      filters: {
        formats: [],
        tags: [],
        searchQuery: '',
        dateFrom: undefined,
        dateTo: undefined,
        isPublic: undefined,
        hasData: undefined,
        hasImages: undefined
      },
      sortBy: 'createdAt',
      sortOrder: 'desc',
      
      // Settings
      settings: {
        autoSave: true,
        autoSaveInterval: 5,
        maxSnapshots: 100,
        defaultFormat: 'json',
        includeDataByDefault: true,
        includeImagesByDefault: false,
        compressionEnabled: true,
        retentionDays: 30
      },
      
      // Error handling
      error: null,
      isLoading: false,
      
      // Actions
      actions: {
        createSnapshot: async (config) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            set({ isLoading: true, error: null });
            
            const newSnapshot = engine.createSnapshot(config);
            
            set(state => ({
              snapshots: [...state.snapshots, newSnapshot],
              currentSnapshot: newSnapshot,
              isLoading: false
            }));
            
            return newSnapshot;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create snapshot';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        updateSnapshot: async (id, updates) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            set({ isLoading: true, error: null });
            
            const updatedSnapshot = engine.updateSnapshot(id, updates);
            
            set(state => ({
              snapshots: state.snapshots.map(snapshot =>
                snapshot.id === id ? updatedSnapshot : snapshot
              ),
              currentSnapshot: state.currentSnapshot?.id === id ? updatedSnapshot : state.currentSnapshot,
              isLoading: false
            }));
            
            return updatedSnapshot;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update snapshot';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        deleteSnapshot: async (id) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            set({ isLoading: true, error: null });
            
            const success = engine.deleteSnapshot(id);
            
            if (success) {
              set(state => ({
                snapshots: state.snapshots.filter(snapshot => snapshot.id !== id),
                currentSnapshot: state.currentSnapshot?.id === id ? null : state.currentSnapshot,
                selectedSnapshotIds: state.selectedSnapshotIds.filter(selectedId => selectedId !== id),
                isLoading: false
              }));
            } else {
              set({ isLoading: false });
            }
            
            return success;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete snapshot';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        exportSnapshot: async (request) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            set({ isExporting: true, exportProgress: 0, error: null });
            
            // Simulate progress updates
            const progressInterval = setInterval(() => {
              set(state => ({ 
                exportProgress: Math.min(state.exportProgress + 10, 90) 
              }));
            }, 200);
            
            const fileInfo = await engine.exportSnapshot(request);
            
            clearInterval(progressInterval);
            set({ exportProgress: 100 });
            
            // Update snapshot with file info
            const updatedSnapshot = engine.getSnapshot(request.snapshotId);
            if (updatedSnapshot) {
              set(state => ({
                snapshots: state.snapshots.map(snapshot =>
                  snapshot.id === request.snapshotId ? updatedSnapshot : snapshot
                )
              }));
            }
            
            set({ isExporting: false, exportProgress: 0 });
            return fileInfo;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to export snapshot';
            set({ error: errorMessage, isExporting: false, exportProgress: 0 });
            throw error;
          }
        },
        
        importSnapshot: async (request) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            set({ isImporting: true, importProgress: 0, error: null });
            
            // Simulate progress updates
            const progressInterval = setInterval(() => {
              set(state => ({ 
                importProgress: Math.min(state.importProgress + 15, 90) 
              }));
            }, 300);
            
            const importedSnapshots = await engine.importSnapshot(request);
            
            clearInterval(progressInterval);
            set({ importProgress: 100 });
            
            // Add imported snapshots to state
            set(state => ({
              snapshots: [...state.snapshots, ...importedSnapshots],
              isImporting: false,
              importProgress: 0
            }));
            
            return importedSnapshots;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to import snapshot';
            set({ error: errorMessage, isImporting: false, importProgress: 0 });
            throw error;
          }
        },
        
        duplicateSnapshot: async (id, newName) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            set({ isLoading: true, error: null });
            
            const duplicatedSnapshot = engine.duplicateSnapshot(id, newName);
            
            set(state => ({
              snapshots: [...state.snapshots, duplicatedSnapshot],
              isLoading: false
            }));
            
            return duplicatedSnapshot;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate snapshot';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        shareSnapshot: async (id, isPublic) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            set({ isLoading: true, error: null });
            
            const shareUrl = engine.shareSnapshot(id, isPublic);
            
            // Update snapshot in state
            const updatedSnapshot = engine.getSnapshot(id);
            if (updatedSnapshot) {
              set(state => ({
                snapshots: state.snapshots.map(snapshot =>
                  snapshot.id === id ? updatedSnapshot : snapshot
                ),
                currentSnapshot: state.currentSnapshot?.id === id ? updatedSnapshot : state.currentSnapshot
              }));
            }
            
            set({ isLoading: false });
            return shareUrl;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to share snapshot';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        compareSnapshots: async (idA, idB) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            set({ isLoading: true, error: null });
            
            const comparison = await engine.compareSnapshots(idA, idB);
            
            set({ isLoading: false });
            return comparison;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to compare snapshots';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        applySnapshot: async (id) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            set({ isLoading: true, error: null });
            
            const success = await engine.applySnapshot(id);
            
            if (success) {
              const appliedSnapshot = engine.getSnapshot(id);
              if (appliedSnapshot) {
                set({ currentSnapshot: appliedSnapshot });
              }
            }
            
            set({ isLoading: false });
            return success;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to apply snapshot';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        createTemplate: async (snapshotId, templateName) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            set({ isLoading: true, error: null });
            
            const template = engine.createTemplate(snapshotId, templateName);
            
            set(state => ({
              templates: [...state.templates, template],
              isLoading: false
            }));
            
            return template;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create template';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        getSnapshotStats: async () => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            return await engine.getSnapshotStats();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to get snapshot stats';
            set({ error: errorMessage });
            throw error;
          }
        },
        
        updateSettings: async (newSettings) => {
          try {
            set(state => ({
              settings: { ...state.settings, ...newSettings }
            }));
            
            // In real implementation, would persist to backend
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
            set({ error: errorMessage });
            throw error;
          }
        },
        
        cleanupExpired: async () => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            const cleanedCount = engine.cleanupExpired();
            
            // Refresh snapshots
            const allSnapshots = engine.getSnapshots();
            set({ snapshots: allSnapshots });
            
            return cleanedCount;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup expired snapshots';
            set({ error: errorMessage });
            throw error;
          }
        },
        
        searchSnapshots: async (query) => {
          const engine = SnapshotExporterEngine.getInstance();
          
          try {
            return engine.searchSnapshots(query);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to search snapshots';
            set({ error: errorMessage });
            throw error;
          }
        }
      },
      
      // Store methods
      setCurrentSnapshot: (snapshot) => {
        set({ currentSnapshot: snapshot });
      },
      
      setSelectedSnapshots: (ids) => {
        set({ selectedSnapshotIds: ids });
      },
      
      addSelectedSnapshot: (id) => {
        set(state => ({
          selectedSnapshotIds: [...state.selectedSnapshotIds, id]
        }));
      },
      
      removeSelectedSnapshot: (id) => {
        set(state => ({
          selectedSnapshotIds: state.selectedSnapshotIds.filter(selectedId => selectedId !== id)
        }));
      },
      
      clearSelectedSnapshots: () => {
        set({ selectedSnapshotIds: [] });
      },
      
      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },
      
      setSorting: (sortBy, order) => {
        set({ sortBy, sortOrder: order });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      // Computed selectors
      getSnapshotById: (id) => {
        const { snapshots } = get();
        return snapshots.find(snapshot => snapshot.id === id);
      },
      
      getFilteredSnapshots: () => {
        const { snapshots, filters } = get();
        
        return snapshots.filter(snapshot => {
          // Format filter
          if (filters.formats.length > 0 && !filters.formats.includes(snapshot.exportFormat)) {
            return false;
          }
          
          // Date filters
          if (filters.dateFrom && snapshot.createdAt < filters.dateFrom) {
            return false;
          }
          
          if (filters.dateTo && snapshot.createdAt > filters.dateTo) {
            return false;
          }
          
          // Tags filter
          if (filters.tags.length > 0 && !filters.tags.some(tag => snapshot.tags.includes(tag))) {
            return false;
          }
          
          // Search query
          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            if (!snapshot.name.toLowerCase().includes(query) &&
                !snapshot.description?.toLowerCase().includes(query)) {
              return false;
            }
          }
          
          // Public filter
          if (filters.isPublic !== undefined && snapshot.isPublic !== filters.isPublic) {
            return false;
          }
          
          // Data filter
          if (filters.hasData !== undefined && snapshot.includeData !== filters.hasData) {
            return false;
          }
          
          // Images filter
          if (filters.hasImages !== undefined && snapshot.includeImages !== filters.hasImages) {
            return false;
          }
          
          return true;
        });
      },
      
      getSortedSnapshots: (snapshots) => {
        const { sortBy, sortOrder } = get();
        
        return [...snapshots].sort((a, b) => {
          let aVal: any, bVal: any;
          
          switch (sortBy) {
            case 'name':
              aVal = a.name.toLowerCase();
              bVal = b.name.toLowerCase();
              break;
            case 'createdAt':
              aVal = a.createdAt.getTime();
              bVal = b.createdAt.getTime();
              break;
            case 'size':
              aVal = a.fileInfo?.fileSize || 0;
              bVal = b.fileInfo?.fileSize || 0;
              break;
            default:
              return 0;
          }
          
          if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      },
      
      getSelectedSnapshots: () => {
        const { snapshots, selectedSnapshotIds } = get();
        return snapshots.filter(snapshot => selectedSnapshotIds.includes(snapshot.id));
      },
      
      getSnapshotStats: () => {
        const { snapshots } = get();
        
        return {
          total: snapshots.length,
          shared: snapshots.filter(s => s.isPublic).length,
          withData: snapshots.filter(s => s.includeData).length,
          withImages: snapshots.filter(s => s.includeImages).length,
          totalSize: snapshots.reduce((sum, s) => sum + (s.fileInfo?.fileSize || 0), 0)
        };
      }
    }),
    {
      name: 'snapshot-exporter-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only essential state
        selectedSnapshotIds: state.selectedSnapshotIds,
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        settings: state.settings
      })
    }
  )
); 