// Block 74: Data Import Wizard - Store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DataImportWizardEngine } from '../engines/DataImportWizardEngine';
import {
  DataImportWizard,
  ImportTemplate,
  ImportHistory,
  DataImportWizardState,
  WizardFilter,
  TemplateFilter
} from '../types/dataImportWizard';

interface DataImportWizardStore extends DataImportWizardState {
  // Actions
  initializeStore: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Wizard management
  setCurrentWizard: (wizard: DataImportWizard | null) => void;
  addWizard: (wizard: DataImportWizard) => void;
  updateWizard: (id: string, updates: Partial<DataImportWizard>) => void;
  removeWizard: (id: string) => void;
  selectWizard: (id: string) => void;
  
  // Template management
  addTemplate: (template: ImportTemplate) => void;
  updateTemplate: (id: string, updates: Partial<ImportTemplate>) => void;
  removeTemplate: (id: string) => void;
  
  // Import history
  addImportHistory: (history: ImportHistory) => void;
  clearImportHistory: () => void;
  
  // Filtering and search
  setWizardFilter: (filter: WizardFilter) => void;
  setTemplateFilter: (filter: TemplateFilter) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  
  // UI state
  setSelectedWizardIds: (ids: string[]) => void;
  toggleWizardSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Step management
  setCurrentStep: (stepId: string) => void;
  setProcessingStep: (stepId: string, isProcessing: boolean) => void;
  setImportProgress: (wizardId: string, progress: number) => void;
  
  // Error handling
  setError: (wizardId: string, error: string) => void;
  clearError: (wizardId: string) => void;
  clearAllErrors: () => void;
  
  // Cache management
  updateLastRefresh: (dataType: string) => void;
  isCacheExpired: (dataType: string) => boolean;
  setCacheExpiry: (minutes: number) => void;
  
  // Statistics and analytics
  getWizardStats: () => {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
    draft: number;
  };
  getTemplateStats: () => {
    total: number;
    public: number;
    system: number;
    personal: number;
  };
  getImportStats: () => {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
  };
}

export const useDataImportWizardStore = create<DataImportWizardStore>()(
  persist(
    (set, get) => ({
      // Initial state
      wizards: {},
      templates: {},
      importHistory: {},
      
      // Current wizard state
      currentWizardId: null,
      currentStepId: null,
      
      // UI state
      activeFilters: {},
      templateFilters: {},
      searchQuery: '',
      selectedWizardIds: [],
      
      // Processing state
      processingSteps: {},
      importProgress: {},
      
      // Cache management
      lastUpdated: {},
      cacheExpiry: 5, // 5 minutes
      
      // Error handling
      errors: {},
      
      // Actions
      initializeStore: async () => {
        const engine = DataImportWizardEngine.getInstance();
        
        try {
          // Load initial data
          const wizards = engine.getWizards();
          const templates = engine.getTemplates();
          const history = engine.getImportHistory();
          
          const wizardMap: Record<string, DataImportWizard> = {};
          wizards.forEach(wizard => {
            wizardMap[wizard.id] = wizard;
          });
          
          const templateMap: Record<string, ImportTemplate> = {};
          templates.forEach(template => {
            templateMap[template.id] = template;
          });
          
          const historyMap: Record<string, ImportHistory> = {};
          history.forEach(item => {
            historyMap[item.id] = item;
          });
          
          set({
            wizards: wizardMap,
            templates: templateMap,
            importHistory: historyMap,
            lastUpdated: {
              wizards: new Date(),
              templates: new Date(),
              history: new Date()
            }
          });
        } catch (error) {
          console.error('Failed to initialize store:', error);
          get().setError('store', 'Failed to initialize store');
        }
      },
      
      refreshData: async () => {
        const engine = DataImportWizardEngine.getInstance();
        
        try {
          // Check cache expiry
          const state = get();
          const needsRefresh = {
            wizards: state.isCacheExpired('wizards'),
            templates: state.isCacheExpired('templates'),
            history: state.isCacheExpired('history')
          };
          
          if (needsRefresh.wizards) {
            const wizards = engine.getWizards();
            const wizardMap: Record<string, DataImportWizard> = {};
            wizards.forEach(wizard => {
              wizardMap[wizard.id] = wizard;
            });
            
            set(state => ({
              wizards: wizardMap,
              lastUpdated: { ...state.lastUpdated, wizards: new Date() }
            }));
          }
          
          if (needsRefresh.templates) {
            const templates = engine.getTemplates();
            const templateMap: Record<string, ImportTemplate> = {};
            templates.forEach(template => {
              templateMap[template.id] = template;
            });
            
            set(state => ({
              templates: templateMap,
              lastUpdated: { ...state.lastUpdated, templates: new Date() }
            }));
          }
          
          if (needsRefresh.history) {
            const history = engine.getImportHistory();
            const historyMap: Record<string, ImportHistory> = {};
            history.forEach(item => {
              historyMap[item.id] = item;
            });
            
            set(state => ({
              importHistory: historyMap,
              lastUpdated: { ...state.lastUpdated, history: new Date() }
            }));
          }
        } catch (error) {
          console.error('Failed to refresh data:', error);
          get().setError('store', 'Failed to refresh data');
        }
      },
      
      // Wizard management
      setCurrentWizard: (wizard: DataImportWizard | null) => {
        set({
          currentWizardId: wizard?.id || null,
          currentStepId: wizard?.currentStepId || null
        });
      },
      
      addWizard: (wizard: DataImportWizard) => {
        set(state => ({
          wizards: {
            ...state.wizards,
            [wizard.id]: wizard
          }
        }));
      },
      
      updateWizard: (id: string, updates: Partial<DataImportWizard>) => {
        set(state => ({
          wizards: {
            ...state.wizards,
            [id]: state.wizards[id] ? { ...state.wizards[id], ...updates } : state.wizards[id]
          }
        }));
      },
      
      removeWizard: (id: string) => {
        set(state => {
          const newWizards = { ...state.wizards };
          delete newWizards[id];
          
          return {
            wizards: newWizards,
            currentWizardId: state.currentWizardId === id ? null : state.currentWizardId,
            selectedWizardIds: state.selectedWizardIds.filter(wizardId => wizardId !== id)
          };
        });
      },
      
      selectWizard: (id: string) => {
        const wizard = get().wizards[id];
        if (wizard) {
          get().setCurrentWizard(wizard);
        }
      },
      
      // Template management
      addTemplate: (template: ImportTemplate) => {
        set(state => ({
          templates: {
            ...state.templates,
            [template.id]: template
          }
        }));
      },
      
      updateTemplate: (id: string, updates: Partial<ImportTemplate>) => {
        set(state => ({
          templates: {
            ...state.templates,
            [id]: state.templates[id] ? { ...state.templates[id], ...updates } : state.templates[id]
          }
        }));
      },
      
      removeTemplate: (id: string) => {
        set(state => {
          const newTemplates = { ...state.templates };
          delete newTemplates[id];
          return { templates: newTemplates };
        });
      },
      
      // Import history
      addImportHistory: (history: ImportHistory) => {
        set(state => ({
          importHistory: {
            ...state.importHistory,
            [history.id]: history
          }
        }));
      },
      
      clearImportHistory: () => {
        set({ importHistory: {} });
      },
      
      // Filtering and search
      setWizardFilter: (filter: WizardFilter) => {
        set({ activeFilters: filter });
      },
      
      setTemplateFilter: (filter: TemplateFilter) => {
        set({ templateFilters: filter });
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },
      
      clearFilters: () => {
        set({
          activeFilters: {},
          templateFilters: {},
          searchQuery: ''
        });
      },
      
      // UI state
      setSelectedWizardIds: (ids: string[]) => {
        set({ selectedWizardIds: ids });
      },
      
      toggleWizardSelection: (id: string) => {
        set(state => ({
          selectedWizardIds: state.selectedWizardIds.includes(id)
            ? state.selectedWizardIds.filter(wizardId => wizardId !== id)
            : [...state.selectedWizardIds, id]
        }));
      },
      
      clearSelection: () => {
        set({ selectedWizardIds: [] });
      },
      
      // Step management
      setCurrentStep: (stepId: string) => {
        set({ currentStepId: stepId });
      },
      
      setProcessingStep: (stepId: string, isProcessing: boolean) => {
        set(state => ({
          processingSteps: {
            ...state.processingSteps,
            [stepId]: isProcessing
          }
        }));
      },
      
      setImportProgress: (wizardId: string, progress: number) => {
        set(state => ({
          importProgress: {
            ...state.importProgress,
            [wizardId]: progress
          }
        }));
      },
      
      // Error handling
      setError: (wizardId: string, error: string) => {
        set(state => ({
          errors: {
            ...state.errors,
            [wizardId]: error
          }
        }));
      },
      
      clearError: (wizardId: string) => {
        set(state => {
          const newErrors = { ...state.errors };
          delete newErrors[wizardId];
          return { errors: newErrors };
        });
      },
      
      clearAllErrors: () => {
        set({ errors: {} });
      },
      
      // Cache management
      updateLastRefresh: (dataType: string) => {
        set(state => ({
          lastUpdated: {
            ...state.lastUpdated,
            [dataType]: new Date()
          }
        }));
      },
      
      isCacheExpired: (dataType: string) => {
        const state = get();
        const lastUpdate = state.lastUpdated[dataType];
        if (!lastUpdate) return true;
        
        const now = new Date();
        const diffMs = now.getTime() - lastUpdate.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        
        return diffMinutes > state.cacheExpiry;
      },
      
      setCacheExpiry: (minutes: number) => {
        set({ cacheExpiry: minutes });
      },
      
      // Statistics and analytics
      getWizardStats: () => {
        const wizards = Object.values(get().wizards);
        
        return {
          total: wizards.length,
          completed: wizards.filter(w => w.status === 'completed').length,
          inProgress: wizards.filter(w => w.status === 'in_progress').length,
          failed: wizards.filter(w => w.status === 'failed').length,
          draft: wizards.filter(w => w.status === 'draft').length
        };
      },
      
      getTemplateStats: () => {
        const templates = Object.values(get().templates);
        
        return {
          total: templates.length,
          public: templates.filter(t => t.isPublic).length,
          system: templates.filter(t => t.isSystem).length,
          personal: templates.filter(t => !t.isPublic && !t.isSystem).length
        };
      },
      
      getImportStats: () => {
        const history = Object.values(get().importHistory);
        
        const successful = history.filter(h => h.success).length;
        const failed = history.filter(h => !h.success).length;
        const totalDuration = history.reduce((sum, h) => sum + h.duration, 0);
        const averageDuration = history.length > 0 ? totalDuration / history.length : 0;
        
        return {
          total: history.length,
          successful,
          failed,
          averageDuration
        };
      }
    }),
    {
      name: 'data-import-wizard-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only essential state
        wizards: state.wizards,
        templates: state.templates,
        importHistory: state.importHistory,
        activeFilters: state.activeFilters,
        templateFilters: state.templateFilters,
        searchQuery: state.searchQuery,
        cacheExpiry: state.cacheExpiry,
        lastUpdated: state.lastUpdated
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize store after rehydration
        if (state) {
          // Auto-refresh data on store rehydration
          setTimeout(() => {
            state.refreshData();
          }, 100);
        }
      }
    }
  )
);

// Auto-refresh hook
let refreshInterval: NodeJS.Timeout | null = null;

export const startAutoRefresh = (intervalMs: number = 30000) => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(() => {
    const store = useDataImportWizardStore.getState();
    store.refreshData();
  }, intervalMs);
};

export const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// Selectors for computed state
export const useFilteredWizards = () => {
  return useDataImportWizardStore((state) => {
    const wizards = Object.values(state.wizards);
    const engine = DataImportWizardEngine.getInstance();
    
    let filtered = wizards;
    
    // Apply active filters
    if (Object.keys(state.activeFilters).length > 0) {
      filtered = engine.filterWizards(filtered, state.activeFilters);
    }
    
    // Apply search query
    if (state.searchQuery) {
      const searchLower = state.searchQuery.toLowerCase();
      filtered = filtered.filter(wizard => 
        wizard.name.toLowerCase().includes(searchLower) ||
        wizard.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  });
};

export const useFilteredTemplates = () => {
  return useDataImportWizardStore((state) => {
    const templates = Object.values(state.templates);
    const engine = DataImportWizardEngine.getInstance();
    
    let filtered = templates;
    
    // Apply template filters
    if (Object.keys(state.templateFilters).length > 0) {
      filtered = engine.filterTemplates(filtered, state.templateFilters);
    }
    
    // Apply search query
    if (state.searchQuery) {
      const searchLower = state.searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  });
};

export const useCurrentWizard = () => {
  return useDataImportWizardStore((state) => {
    return state.currentWizardId ? state.wizards[state.currentWizardId] : null;
  });
};

export const useWizardProgress = (wizardId: string) => {
  return useDataImportWizardStore((state) => {
    const wizard = state.wizards[wizardId];
    const progress = state.importProgress[wizardId];
    
    return {
      wizard,
      progress: progress || wizard?.progress || 0,
      isProcessing: Object.values(state.processingSteps).some(Boolean)
    };
  });
};

export const useWizardErrors = (wizardId: string) => {
  return useDataImportWizardStore((state) => {
    return state.errors[wizardId] || null;
  });
};

// Initialize store on module load
if (typeof window !== 'undefined') {
  const store = useDataImportWizardStore.getState();
  store.initializeStore();
  
  // Start auto-refresh
  startAutoRefresh();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
  });
} 