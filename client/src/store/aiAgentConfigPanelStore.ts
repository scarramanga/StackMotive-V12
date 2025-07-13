// Block 96: AI Agent Config Panel - Store
// Zustand State Management for AI Agent Configuration

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AIAgentConfigPanel,
  AgentConfiguration,
  ValidationResult,
  TestResult,
  BacktestResult,
  DeploymentResult,
  AIAgentConfigPanelState,
  AgentStatus,
  ValidationError
} from '../types/aiAgentConfigPanel';

interface AIAgentConfigPanelStore extends AIAgentConfigPanelState {
  // Panel Management
  addPanel: (panel: AIAgentConfigPanel) => void;
  updatePanel: (id: string, updates: Partial<AIAgentConfigPanel>) => void;
  removePanel: (id: string) => void;
  setCurrentPanel: (id: string | null) => void;
  
  // Agent Configuration Management
  addAgentConfig: (panelId: string, config: AgentConfiguration) => void;
  updateAgentConfig: (panelId: string, agentId: string, updates: Partial<AgentConfiguration>) => void;
  removeAgentConfig: (panelId: string, agentId: string) => void;
  cloneAgentConfig: (panelId: string, agentId: string, newName: string) => AgentConfiguration | null;
  
  // Configuration State Management
  setActiveConfiguration: (agentId: string, config: AgentConfiguration) => void;
  removeActiveConfiguration: (agentId: string) => void;
  
  // Validation Management
  setValidationResult: (agentId: string, result: ValidationResult) => void;
  clearValidationResult: (agentId: string) => void;
  addValidationError: (agentId: string, error: ValidationError) => void;
  removeValidationError: (agentId: string, field: string) => void;
  
  // Test Results Management
  setTestResult: (agentId: string, result: TestResult) => void;
  clearTestResult: (agentId: string) => void;
  setBacktestResult: (agentId: string, result: BacktestResult) => void;
  clearBacktestResult: (agentId: string) => void;
  
  // Deployment Management
  setDeploymentResult: (agentId: string, result: DeploymentResult) => void;
  clearDeploymentResult: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  
  // UI State Management
  toggleSectionExpanded: (section: string) => void;
  setSectionExpanded: (section: string, expanded: boolean) => void;
  setSelectedTab: (panelId: string, tab: string) => void;
  
  // Agent Selection
  toggleAgentSelection: (agentId: string) => void;
  selectMultipleAgents: (agentIds: string[]) => void;
  clearSelection: () => void;
  
  // Cache Management
  updateCacheTimestamp: (panelId: string) => void;
  isCacheValid: (panelId: string) => boolean;
  invalidateCache: (panelId: string) => void;
  
  // Error Handling
  setError: (panelId: string, error: string) => void;
  clearError: (panelId: string) => void;
  clearAllErrors: () => void;
  
  // Utility
  getPanelById: (id: string) => AIAgentConfigPanel | undefined;
  getAgentConfigById: (panelId: string, agentId: string) => AgentConfiguration | undefined;
  getActiveAgentConfigs: () => AgentConfiguration[];
  getDeployedAgentConfigs: () => AgentConfiguration[];
  
  // Cleanup
  cleanup: () => void;
  resetStore: () => void;
}

const initialState: AIAgentConfigPanelState = {
  panels: {},
  currentPanelId: null,
  selectedAgentIds: [],
  activeConfigurations: {},
  expandedSections: {},
  selectedTabs: {},
  lastUpdated: {},
  cacheExpiry: 10 * 60 * 1000, // 10 minutes
  errors: {},
  validationErrors: {}
};

export const useAIAgentConfigPanelStore = create<AIAgentConfigPanelStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // Panel Management
        addPanel: (panel) => {
          set((state) => {
            state.panels[panel.id] = panel;
            state.lastUpdated[panel.id] = new Date();
            
            // Set as current panel if it's the first one
            if (Object.keys(state.panels).length === 1) {
              state.currentPanelId = panel.id;
            }
          });
        },
        
        updatePanel: (id, updates) => {
          set((state) => {
            if (state.panels[id]) {
              state.panels[id] = { ...state.panels[id], ...updates, updatedAt: new Date() };
              state.lastUpdated[id] = new Date();
            }
          });
        },
        
        removePanel: (id) => {
          set((state) => {
            delete state.panels[id];
            delete state.lastUpdated[id];
            delete state.errors[id];
            delete state.selectedTabs[id];
            
            // Remove agent configurations from active configurations
            if (state.panels[id]) {
              state.panels[id].agentConfigurations.forEach(config => {
                delete state.activeConfigurations[config.id];
                delete state.validationErrors[config.id];
              });
            }
            
            // Remove from selection
            state.selectedAgentIds = state.selectedAgentIds.filter(agentId => {
              const panel = Object.values(state.panels).find(p => 
                p.agentConfigurations.some(c => c.id === agentId)
              );
              return panel;
            });
            
            // Clear current panel if it's the one being removed
            if (state.currentPanelId === id) {
              const remainingPanelIds = Object.keys(state.panels);
              state.currentPanelId = remainingPanelIds.length > 0 ? remainingPanelIds[0] : null;
            }
          });
        },
        
        setCurrentPanel: (id) => {
          set((state) => {
            state.currentPanelId = id;
            
            // Update last accessed time
            if (id && state.panels[id]) {
              state.panels[id].lastAccessed = new Date();
              state.lastUpdated[id] = new Date();
            }
          });
        },
        
        // Agent Configuration Management
        addAgentConfig: (panelId, config) => {
          set((state) => {
            if (state.panels[panelId]) {
              state.panels[panelId].agentConfigurations.push(config);
              state.activeConfigurations[config.id] = config;
              state.lastUpdated[panelId] = new Date();
            }
          });
        },
        
        updateAgentConfig: (panelId, agentId, updates) => {
          set((state) => {
            if (state.panels[panelId]) {
              const configIndex = state.panels[panelId].agentConfigurations.findIndex(
                config => config.id === agentId
              );
              if (configIndex !== -1) {
                state.panels[panelId].agentConfigurations[configIndex] = {
                  ...state.panels[panelId].agentConfigurations[configIndex],
                  ...updates,
                  updatedAt: new Date(),
                  lastModified: new Date(),
                  version: state.panels[panelId].agentConfigurations[configIndex].version + 1
                };
                state.activeConfigurations[agentId] = state.panels[panelId].agentConfigurations[configIndex];
                state.lastUpdated[panelId] = new Date();
              }
            }
          });
        },
        
        removeAgentConfig: (panelId, agentId) => {
          set((state) => {
            if (state.panels[panelId]) {
              state.panels[panelId].agentConfigurations = state.panels[panelId].agentConfigurations.filter(
                config => config.id !== agentId
              );
              delete state.activeConfigurations[agentId];
              delete state.validationErrors[agentId];
              
              // Remove from selection
              state.selectedAgentIds = state.selectedAgentIds.filter(id => id !== agentId);
              
              state.lastUpdated[panelId] = new Date();
            }
          });
        },
        
        cloneAgentConfig: (panelId, agentId, newName) => {
          const state = get();
          const panel = state.panels[panelId];
          if (!panel) return null;
          
          const sourceConfig = panel.agentConfigurations.find(config => config.id === agentId);
          if (!sourceConfig) return null;
          
          const clonedConfig: AgentConfiguration = {
            ...sourceConfig,
            id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            agentName: newName,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastModified: new Date(),
            version: 1,
            status: 'inactive'
          };
          
          set((state) => {
            if (state.panels[panelId]) {
              state.panels[panelId].agentConfigurations.push(clonedConfig);
              state.activeConfigurations[clonedConfig.id] = clonedConfig;
              state.lastUpdated[panelId] = new Date();
            }
          });
          
          return clonedConfig;
        },
        
        // Configuration State Management
        setActiveConfiguration: (agentId, config) => {
          set((state) => {
            state.activeConfigurations[agentId] = config;
          });
        },
        
        removeActiveConfiguration: (agentId) => {
          set((state) => {
            delete state.activeConfigurations[agentId];
          });
        },
        
        // Validation Management
        setValidationResult: (agentId, result) => {
          set((state) => {
            if (result.errors.length > 0) {
              state.validationErrors[agentId] = result.errors;
            } else {
              delete state.validationErrors[agentId];
            }
          });
        },
        
        clearValidationResult: (agentId) => {
          set((state) => {
            delete state.validationErrors[agentId];
          });
        },
        
        addValidationError: (agentId, error) => {
          set((state) => {
            if (!state.validationErrors[agentId]) {
              state.validationErrors[agentId] = [];
            }
            
            // Check if error already exists for this field
            const existingIndex = state.validationErrors[agentId].findIndex(
              e => e.field === error.field
            );
            
            if (existingIndex !== -1) {
              state.validationErrors[agentId][existingIndex] = error;
            } else {
              state.validationErrors[agentId].push(error);
            }
          });
        },
        
        removeValidationError: (agentId, field) => {
          set((state) => {
            if (state.validationErrors[agentId]) {
              state.validationErrors[agentId] = state.validationErrors[agentId].filter(
                error => error.field !== field
              );
              
              if (state.validationErrors[agentId].length === 0) {
                delete state.validationErrors[agentId];
              }
            }
          });
        },
        
        // Test Results Management (in a real app, these would be stored separately)
        setTestResult: (agentId, result) => {
          // Store test results in configuration metadata for simplicity
          set((state) => {
            const config = state.activeConfigurations[agentId];
            if (config) {
              state.activeConfigurations[agentId] = {
                ...config,
                // Store in custom parameters for this example
                coreConfig: {
                  ...config.coreConfig,
                  customParameters: [
                    ...(config.coreConfig?.customParameters?.filter(p => p.name !== 'lastTestResult') || []),
                    {
                      name: 'lastTestResult',
                      type: 'object',
                      value: result,
                      description: 'Last test result',
                      isRequired: false,
                      validation: { type: 'none', parameters: {}, errorMessage: '' }
                    }
                  ]
                }
              };
            }
          });
        },
        
        clearTestResult: (agentId) => {
          set((state) => {
            const config = state.activeConfigurations[agentId];
            if (config && config.coreConfig?.customParameters) {
              state.activeConfigurations[agentId] = {
                ...config,
                coreConfig: {
                  ...config.coreConfig,
                  customParameters: config.coreConfig.customParameters.filter(p => p.name !== 'lastTestResult')
                }
              };
            }
          });
        },
        
        setBacktestResult: (agentId, result) => {
          set((state) => {
            const config = state.activeConfigurations[agentId];
            if (config) {
              state.activeConfigurations[agentId] = {
                ...config,
                coreConfig: {
                  ...config.coreConfig,
                  customParameters: [
                    ...(config.coreConfig?.customParameters?.filter(p => p.name !== 'lastBacktestResult') || []),
                    {
                      name: 'lastBacktestResult',
                      type: 'object',
                      value: result,
                      description: 'Last backtest result',
                      isRequired: false,
                      validation: { type: 'none', parameters: {}, errorMessage: '' }
                    }
                  ]
                }
              };
            }
          });
        },
        
        clearBacktestResult: (agentId) => {
          set((state) => {
            const config = state.activeConfigurations[agentId];
            if (config && config.coreConfig?.customParameters) {
              state.activeConfigurations[agentId] = {
                ...config,
                coreConfig: {
                  ...config.coreConfig,
                  customParameters: config.coreConfig.customParameters.filter(p => p.name !== 'lastBacktestResult')
                }
              };
            }
          });
        },
        
        // Deployment Management
        setDeploymentResult: (agentId, result) => {
          set((state) => {
            const config = state.activeConfigurations[agentId];
            if (config) {
              state.activeConfigurations[agentId] = {
                ...config,
                coreConfig: {
                  ...config.coreConfig,
                  customParameters: [
                    ...(config.coreConfig?.customParameters?.filter(p => p.name !== 'lastDeploymentResult') || []),
                    {
                      name: 'lastDeploymentResult',
                      type: 'object',
                      value: result,
                      description: 'Last deployment result',
                      isRequired: false,
                      validation: { type: 'none', parameters: {}, errorMessage: '' }
                    }
                  ]
                }
              };
            }
          });
        },
        
        clearDeploymentResult: (agentId) => {
          set((state) => {
            const config = state.activeConfigurations[agentId];
            if (config && config.coreConfig?.customParameters) {
              state.activeConfigurations[agentId] = {
                ...config,
                coreConfig: {
                  ...config.coreConfig,
                  customParameters: config.coreConfig.customParameters.filter(p => p.name !== 'lastDeploymentResult')
                }
              };
            }
          });
        },
        
        updateAgentStatus: (agentId, status) => {
          set((state) => {
            // Update in active configurations
            if (state.activeConfigurations[agentId]) {
              state.activeConfigurations[agentId] = {
                ...state.activeConfigurations[agentId],
                status,
                updatedAt: new Date(),
                lastModified: new Date()
              };
            }
            
            // Update in panels
            Object.keys(state.panels).forEach(panelId => {
              const configIndex = state.panels[panelId].agentConfigurations.findIndex(
                config => config.id === agentId
              );
              if (configIndex !== -1) {
                state.panels[panelId].agentConfigurations[configIndex] = {
                  ...state.panels[panelId].agentConfigurations[configIndex],
                  status,
                  updatedAt: new Date(),
                  lastModified: new Date()
                };
                state.lastUpdated[panelId] = new Date();
              }
            });
          });
        },
        
        // UI State Management
        toggleSectionExpanded: (section) => {
          set((state) => {
            state.expandedSections[section] = !state.expandedSections[section];
          });
        },
        
        setSectionExpanded: (section, expanded) => {
          set((state) => {
            state.expandedSections[section] = expanded;
          });
        },
        
        setSelectedTab: (panelId, tab) => {
          set((state) => {
            state.selectedTabs[panelId] = tab;
          });
        },
        
        // Agent Selection
        toggleAgentSelection: (agentId) => {
          set((state) => {
            const index = state.selectedAgentIds.indexOf(agentId);
            if (index === -1) {
              state.selectedAgentIds.push(agentId);
            } else {
              state.selectedAgentIds.splice(index, 1);
            }
          });
        },
        
        selectMultipleAgents: (agentIds) => {
          set((state) => {
            // Only select agents that actually exist
            const validAgentIds = agentIds.filter(agentId => {
              return Object.values(state.panels).some(panel =>
                panel.agentConfigurations.some(config => config.id === agentId)
              );
            });
            state.selectedAgentIds = validAgentIds;
          });
        },
        
        clearSelection: () => {
          set((state) => {
            state.selectedAgentIds = [];
          });
        },
        
        // Cache Management
        updateCacheTimestamp: (panelId) => {
          set((state) => {
            state.lastUpdated[panelId] = new Date();
          });
        },
        
        isCacheValid: (panelId) => {
          const state = get();
          const lastUpdated = state.lastUpdated[panelId];
          
          if (!lastUpdated) return false;
          
          const now = new Date();
          const age = now.getTime() - lastUpdated.getTime();
          
          return age < state.cacheExpiry;
        },
        
        invalidateCache: (panelId) => {
          set((state) => {
            delete state.lastUpdated[panelId];
          });
        },
        
        // Error Handling
        setError: (panelId, error) => {
          set((state) => {
            state.errors[panelId] = error;
          });
        },
        
        clearError: (panelId) => {
          set((state) => {
            delete state.errors[panelId];
          });
        },
        
        clearAllErrors: () => {
          set((state) => {
            state.errors = {};
          });
        },
        
        // Utility
        getPanelById: (id) => {
          const state = get();
          return state.panels[id];
        },
        
        getAgentConfigById: (panelId, agentId) => {
          const state = get();
          const panel = state.panels[panelId];
          if (!panel) return undefined;
          
          return panel.agentConfigurations.find(config => config.id === agentId);
        },
        
        getActiveAgentConfigs: () => {
          const state = get();
          return Object.values(state.activeConfigurations).filter(config => config.isEnabled);
        },
        
        getDeployedAgentConfigs: () => {
          const state = get();
          return Object.values(state.activeConfigurations).filter(config => config.status === 'active');
        },
        
        // Cleanup
        cleanup: () => {
          set((state) => {
            const now = new Date();
            const cutoffTime = now.getTime() - 24 * 60 * 60 * 1000; // 24 hours ago
            
            // Clean up old cache entries
            Object.keys(state.lastUpdated).forEach(panelId => {
              if (state.lastUpdated[panelId].getTime() < cutoffTime) {
                delete state.lastUpdated[panelId];
              }
            });
            
            // Clean up orphaned active configurations
            const allAgentIds = new Set<string>();
            Object.values(state.panels).forEach(panel => {
              panel.agentConfigurations.forEach(config => {
                allAgentIds.add(config.id);
              });
            });
            
            Object.keys(state.activeConfigurations).forEach(agentId => {
              if (!allAgentIds.has(agentId)) {
                delete state.activeConfigurations[agentId];
                delete state.validationErrors[agentId];
              }
            });
            
            // Clean up selection
            state.selectedAgentIds = state.selectedAgentIds.filter(agentId => allAgentIds.has(agentId));
            
            // Clean up errors for non-existent panels
            Object.keys(state.errors).forEach(panelId => {
              if (!state.panels[panelId]) {
                delete state.errors[panelId];
              }
            });
          });
        },
        
        resetStore: () => {
          set(() => ({ ...initialState }));
        }
      })),
      {
        name: 'ai-agent-config-panel-store',
        version: 1,
        partialize: (state) => ({
          panels: state.panels,
          currentPanelId: state.currentPanelId,
          selectedAgentIds: state.selectedAgentIds,
          expandedSections: state.expandedSections,
          selectedTabs: state.selectedTabs,
          cacheExpiry: state.cacheExpiry
        }),
        onRehydrateStorage: () => (state) => {
          // Clean up after rehydration
          if (state) {
            state.cleanup();
          }
        }
      }
    )
  )
);

// Selectors for optimized performance
export const selectCurrentPanel = (state: AIAgentConfigPanelStore) => 
  state.currentPanelId ? state.panels[state.currentPanelId] : null;

export const selectCurrentPanelAgents = (state: AIAgentConfigPanelStore) => {
  const currentPanel = selectCurrentPanel(state);
  return currentPanel ? currentPanel.agentConfigurations : [];
};

export const selectActivePanelCount = (state: AIAgentConfigPanelStore) => 
  Object.values(state.panels).filter(panel => panel.isActive).length;

export const selectPanelsByStatus = (isActive: boolean) => (state: AIAgentConfigPanelStore) => 
  Object.values(state.panels).filter(panel => panel.isActive === isActive);

export const selectAgentConfigsByStatus = (status: AgentStatus) => (state: AIAgentConfigPanelStore) => 
  Object.values(state.activeConfigurations).filter(config => config.status === status);

export const selectPanelErrors = (state: AIAgentConfigPanelStore) => state.errors;

export const selectSelectedAgents = (state: AIAgentConfigPanelStore) => 
  state.selectedAgentIds.map(id => state.activeConfigurations[id]).filter(Boolean);

export const selectAgentValidationErrors = (agentId: string) => (state: AIAgentConfigPanelStore) => 
  state.validationErrors[agentId] || [];

export const selectHasValidationErrors = (state: AIAgentConfigPanelStore) => 
  Object.keys(state.validationErrors).length > 0;

// Computed selectors
export const selectTotalAgentCount = (state: AIAgentConfigPanelStore) => 
  Object.values(state.panels).reduce((count, panel) => count + panel.agentConfigurations.length, 0);

export const selectActiveAgentCount = (state: AIAgentConfigPanelStore) => 
  Object.values(state.activeConfigurations).filter(config => config.status === 'active').length;

export const selectPanelsByAgentType = (agentType: string) => (state: AIAgentConfigPanelStore) => 
  Object.values(state.panels).filter(panel => 
    panel.agentConfigurations.some(config => config.agentType === agentType)
  );

export const selectAgentsByStrategy = (strategyType: string) => (state: AIAgentConfigPanelStore) => 
  Object.values(state.activeConfigurations).filter(config => 
    config.strategyParams?.strategyType === strategyType
  );

export const selectDeploymentStatus = (state: AIAgentConfigPanelStore) => {
  const totalAgents = Object.keys(state.activeConfigurations).length;
  const deployedAgents = Object.values(state.activeConfigurations).filter(
    config => config.status === 'active'
  ).length;
  const testingAgents = Object.values(state.activeConfigurations).filter(
    config => config.status === 'testing'
  ).length;
  const errorAgents = Object.values(state.activeConfigurations).filter(
    config => config.status === 'error'
  ).length;
  
  return {
    totalAgents,
    deployedAgents,
    testingAgents,
    errorAgents,
    deploymentRate: totalAgents > 0 ? (deployedAgents / totalAgents) * 100 : 0
  };
};

// Action creators for common operations
export const createPanelActions = (store: typeof useAIAgentConfigPanelStore) => ({
  
  // Bulk operations
  createMultiplePanels: (panels: Omit<AIAgentConfigPanel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => {
    panels.forEach(panelConfig => {
      const newPanel: AIAgentConfigPanel = {
        ...panelConfig,
        id: `panel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'user_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessed: new Date()
      };
      store.getState().addPanel(newPanel);
    });
  },
  
  // Batch agent operations
  updateMultipleAgents: (updates: Array<{ panelId: string; agentId: string; updates: Partial<AgentConfiguration> }>) => {
    updates.forEach(({ panelId, agentId, updates }) => {
      store.getState().updateAgentConfig(panelId, agentId, updates);
    });
  },
  
  // Configuration templates
  createFromTemplate: (panelId: string, templateType: string) => {
    const templates = {
      'momentum_trader': {
        agentName: 'Momentum Trader',
        agentType: 'trading' as const,
        // ... template configuration
      },
      'risk_manager': {
        agentName: 'Risk Manager',
        agentType: 'risk_management' as const,
        // ... template configuration
      }
      // ... more templates
    };
    
    const template = templates[templateType as keyof typeof templates];
    if (template) {
      const config = {
        ...template,
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModified: new Date(),
        version: 1,
        status: 'inactive' as AgentStatus,
        isEnabled: true,
        // Add default configurations
        coreConfig: {
          name: template.agentName,
          description: '',
          version: '1.0.0',
          executionMode: 'manual' as const,
          executionFrequency: '1h' as const,
          marketScope: { exchanges: [], instruments: [], sectors: [], regions: [], marketCap: [] },
          assetScope: { assetClasses: [], symbols: [], excludeSymbols: [], filters: [] },
          tradingConfig: {
            tradingHours: { timezone: 'UTC', marketOpen: '09:00', marketClose: '17:00', extendedHours: false, holidays: [] },
            orderTypes: [],
            executionSettings: { slippage: 0.001, maxSlippage: 0.005, timeInForce: 'DAY', minimumQuantity: 1 },
            brokerSettings: { brokerId: '', accountId: '', apiSettings: {} }
          },
          dataSources: [],
          integrations: [],
          customParameters: []
        }
        // ... other required fields would be filled with defaults
      } as AgentConfiguration;
      
      store.getState().addAgentConfig(panelId, config);
      return config;
    }
    return null;
  },
  
  // Health monitoring
  getSystemHealth: () => {
    const state = store.getState();
    const totalPanels = Object.keys(state.panels).length;
    const activePanels = Object.values(state.panels).filter(panel => panel.isActive).length;
    const panelsWithErrors = Object.keys(state.errors).length;
    const validationErrorCount = Object.keys(state.validationErrors).length;
    
    const deploymentStatus = selectDeploymentStatus(state);
    
    return {
      totalPanels,
      activePanels,
      panelsWithErrors,
      validationErrorCount,
      ...deploymentStatus,
      healthScore: totalPanels > 0 ? 
        ((activePanels - panelsWithErrors) / totalPanels) * 
        ((deploymentStatus.totalAgents - deploymentStatus.errorAgents) / Math.max(deploymentStatus.totalAgents, 1)) * 100 
        : 100
    };
  }
});

// Subscribe to store changes for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  useAIAgentConfigPanelStore.subscribe(
    (state) => state.panels,
    (panels) => {
      console.log('AI Agent Config Panels updated:', Object.keys(panels).length);
    }
  );
  
  useAIAgentConfigPanelStore.subscribe(
    (state) => state.activeConfigurations,
    (configs) => {
      console.log('Active Agent Configurations updated:', Object.keys(configs).length);
    }
  );
}

export default useAIAgentConfigPanelStore; 