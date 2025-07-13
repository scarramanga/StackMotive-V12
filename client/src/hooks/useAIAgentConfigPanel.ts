// Block 96: AI Agent Config Panel - Hook
// React Hook for AI Agent Configuration Management

import { useState, useEffect, useCallback, useRef } from 'react';
import { AIAgentConfigPanelEngine } from '../engines/AIAgentConfigPanelEngine';
import {
  AIAgentConfigPanel,
  AgentConfiguration,
  ValidationResult,
  TestResult,
  BacktestResult,
  DeploymentResult,
  BacktestParameters,
  ExportFormat,
  ImportFormat,
  UseAIAgentConfigPanelReturn
} from '../types/aiAgentConfigPanel';

export const useAIAgentConfigPanel = (): UseAIAgentConfigPanelReturn => {
  // State management
  const [panels, setPanels] = useState<AIAgentConfigPanel[]>([]);
  const [currentPanel, setCurrentPanel] = useState<AIAgentConfigPanel | null>(null);
  const [activeConfigurations, setActiveConfigurations] = useState<AgentConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const engineRef = useRef<AIAgentConfigPanelEngine | null>(null);
  const mountedRef = useRef(true);

  // Initialize engine and load data
  useEffect(() => {
    initializeEngine();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize engine
  const initializeEngine = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      engineRef.current = AIAgentConfigPanelEngine.getInstance();
      
      // Load existing panels
      const existingPanels = engineRef.current.getPanels();
      if (mountedRef.current) {
        setPanels(existingPanels);
        
        // Set current panel if there's one
        if (existingPanels.length > 0) {
          setCurrentPanel(existingPanels[0]);
          setActiveConfigurations(existingPanels[0].agentConfigurations);
        }
      }
      
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to initialize AI agent config engine');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Panel Operations
  const createPanel = useCallback(async (config: Omit<AIAgentConfigPanel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<AIAgentConfigPanel> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const newPanel = engineRef.current.createPanel(config);
      
      if (mountedRef.current) {
        setPanels(prevPanels => [...prevPanels, newPanel]);
        
        // Set as current panel if it's the first one
        if (panels.length === 0) {
          setCurrentPanel(newPanel);
          setActiveConfigurations(newPanel.agentConfigurations);
        }
      }
      
      return newPanel;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create panel';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [panels.length]);

  const updatePanel = useCallback(async (id: string, updates: Partial<AIAgentConfigPanel>): Promise<AIAgentConfigPanel> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedPanel = engineRef.current.updatePanel(id, updates);
      
      if (mountedRef.current) {
        setPanels(prevPanels => prevPanels.map(panel => 
          panel.id === id ? updatedPanel : panel
        ));
        
        // Update current panel if it's the one being updated
        if (currentPanel?.id === id) {
          setCurrentPanel(updatedPanel);
          setActiveConfigurations(updatedPanel.agentConfigurations);
        }
      }
      
      return updatedPanel;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update panel';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [currentPanel]);

  const deletePanel = useCallback(async (id: string): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      engineRef.current.deletePanel(id);
      
      if (mountedRef.current) {
        setPanels(prevPanels => prevPanels.filter(panel => panel.id !== id));
        
        // Clear current panel if it's the one being deleted
        if (currentPanel?.id === id) {
          const remainingPanels = panels.filter(panel => panel.id !== id);
          if (remainingPanels.length > 0) {
            setCurrentPanel(remainingPanels[0]);
            setActiveConfigurations(remainingPanels[0].agentConfigurations);
          } else {
            setCurrentPanel(null);
            setActiveConfigurations([]);
          }
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete panel';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPanel, panels]);

  // Agent Configuration Operations
  const createAgentConfig = useCallback(async (panelId: string, config: Omit<AgentConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentConfiguration> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const newConfig = engineRef.current.createAgentConfig(panelId, config);
      
      if (mountedRef.current) {
        // Update the panel in the list
        const updatedPanel = engineRef.current.getPanel(panelId);
        if (updatedPanel) {
          setPanels(prevPanels => prevPanels.map(panel => 
            panel.id === panelId ? updatedPanel : panel
          ));
          
          if (currentPanel?.id === panelId) {
            setCurrentPanel(updatedPanel);
            setActiveConfigurations(updatedPanel.agentConfigurations);
          }
        }
      }
      
      return newConfig;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create agent configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [currentPanel]);

  const updateAgentConfig = useCallback(async (panelId: string, agentId: string, updates: Partial<AgentConfiguration>): Promise<AgentConfiguration> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedConfig = engineRef.current.updateAgentConfig(panelId, agentId, updates);
      
      if (mountedRef.current) {
        // Update the panel in the list
        const updatedPanel = engineRef.current.getPanel(panelId);
        if (updatedPanel) {
          setPanels(prevPanels => prevPanels.map(panel => 
            panel.id === panelId ? updatedPanel : panel
          ));
          
          if (currentPanel?.id === panelId) {
            setCurrentPanel(updatedPanel);
            setActiveConfigurations(updatedPanel.agentConfigurations);
          }
        }
      }
      
      return updatedConfig;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [currentPanel]);

  const deleteAgentConfig = useCallback(async (panelId: string, agentId: string): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      engineRef.current.deleteAgentConfig(panelId, agentId);
      
      if (mountedRef.current) {
        // Update the panel in the list
        const updatedPanel = engineRef.current.getPanel(panelId);
        if (updatedPanel) {
          setPanels(prevPanels => prevPanels.map(panel => 
            panel.id === panelId ? updatedPanel : panel
          ));
          
          if (currentPanel?.id === panelId) {
            setCurrentPanel(updatedPanel);
            setActiveConfigurations(updatedPanel.agentConfigurations);
          }
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete agent configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [currentPanel]);

  // Configuration Management
  const saveConfiguration = useCallback(async (panelId: string, agentId: string): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsSaving(true);
      setError(null);
      
      // In a real implementation, this would save to a backend
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save time
      
      // For now, just trigger a re-render
      const panel = engineRef.current.getPanel(panelId);
      if (panel && mountedRef.current) {
        const updatedPanel = engineRef.current.updatePanel(panelId, { 
          updatedAt: new Date(),
          lastAccessed: new Date()
        });
        
        setPanels(prevPanels => prevPanels.map(p => 
          p.id === panelId ? updatedPanel : p
        ));
        
        if (currentPanel?.id === panelId) {
          setCurrentPanel(updatedPanel);
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [currentPanel]);

  const loadConfiguration = useCallback(async (panelId: string, agentId: string): Promise<AgentConfiguration> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const panel = engineRef.current.getPanel(panelId);
      if (!panel) {
        throw new Error(`Panel with id ${panelId} not found`);
      }
      
      const config = panel.agentConfigurations.find(c => c.id === agentId);
      if (!config) {
        throw new Error(`Agent configuration with id ${agentId} not found`);
      }
      
      return config;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const resetConfiguration = useCallback(async (panelId: string, agentId: string): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      // Reset to default configuration
      const panel = engineRef.current.getPanel(panelId);
      if (!panel) {
        throw new Error(`Panel with id ${panelId} not found`);
      }
      
      const configIndex = panel.agentConfigurations.findIndex(c => c.id === agentId);
      if (configIndex === -1) {
        throw new Error(`Agent configuration with id ${agentId} not found`);
      }
      
      // Create a reset configuration (simplified reset)
      const resetUpdates: Partial<AgentConfiguration> = {
        status: 'inactive',
        isEnabled: false,
        version: panel.agentConfigurations[configIndex].version + 1,
        updatedAt: new Date(),
        lastModified: new Date()
      };
      
      await updateAgentConfig(panelId, agentId, resetUpdates);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [updateAgentConfig]);

  const cloneConfiguration = useCallback(async (panelId: string, agentId: string, newName: string): Promise<AgentConfiguration> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const clonedConfig = engineRef.current.cloneConfiguration(panelId, agentId, newName);
      
      if (mountedRef.current) {
        // Update the panel in the list
        const updatedPanel = engineRef.current.getPanel(panelId);
        if (updatedPanel) {
          setPanels(prevPanels => prevPanels.map(panel => 
            panel.id === panelId ? updatedPanel : panel
          ));
          
          if (currentPanel?.id === panelId) {
            setCurrentPanel(updatedPanel);
            setActiveConfigurations(updatedPanel.agentConfigurations);
          }
        }
      }
      
      return clonedConfig;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clone configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [currentPanel]);

  // Validation
  const validateConfiguration = useCallback((config: AgentConfiguration): ValidationResult => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      return engineRef.current.validateConfiguration(config);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const validatePanel = useCallback((panel: AIAgentConfigPanel): ValidationResult => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      return engineRef.current.validatePanel(panel);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate panel';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Testing
  const testConfiguration = useCallback(async (config: AgentConfiguration): Promise<TestResult> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const testResult = await engineRef.current.testConfiguration(config);
      
      return testResult;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, []);

  const runBacktest = useCallback(async (config: AgentConfiguration, parameters: BacktestParameters): Promise<BacktestResult> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const backtestResult = await engineRef.current.runBacktest(config, parameters);
      
      return backtestResult;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run backtest';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, []);

  // Deployment
  const deployConfiguration = useCallback(async (config: AgentConfiguration): Promise<DeploymentResult> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const deploymentResult = await engineRef.current.deployConfiguration(config);
      
      // Update the configuration status
      if (currentPanel && mountedRef.current) {
        const configIndex = currentPanel.agentConfigurations.findIndex(c => c.id === config.id);
        if (configIndex !== -1) {
          await updateAgentConfig(currentPanel.id, config.id, { status: 'active' });
        }
      }
      
      return deploymentResult;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deploy configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [currentPanel, updateAgentConfig]);

  const undeployConfiguration = useCallback(async (agentId: string): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      await engineRef.current.undeployConfiguration(agentId);
      
      // Update the configuration status
      if (currentPanel && mountedRef.current) {
        const configIndex = currentPanel.agentConfigurations.findIndex(c => c.id === agentId);
        if (configIndex !== -1) {
          await updateAgentConfig(currentPanel.id, agentId, { status: 'inactive' });
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to undeploy configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [currentPanel, updateAgentConfig]);

  // Import/Export
  const exportConfiguration = useCallback(async (agentId: string, format: ExportFormat): Promise<string> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const exportedData = await engineRef.current.exportConfiguration(agentId, format);
      
      return exportedData;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, []);

  const importConfiguration = useCallback(async (panelId: string, data: string, format: ImportFormat): Promise<AgentConfiguration> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const importedConfig = await engineRef.current.importConfiguration(panelId, data, format);
      
      if (mountedRef.current) {
        // Update the panel in the list
        const updatedPanel = engineRef.current.getPanel(panelId);
        if (updatedPanel) {
          setPanels(prevPanels => prevPanels.map(panel => 
            panel.id === panelId ? updatedPanel : panel
          ));
          
          if (currentPanel?.id === panelId) {
            setCurrentPanel(updatedPanel);
            setActiveConfigurations(updatedPanel.agentConfigurations);
          }
        }
      }
      
      return importedConfig;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import configuration';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [currentPanel]);

  // Utility Functions
  const setCurrentPanelById = useCallback((panelId: string | null) => {
    if (!panelId) {
      setCurrentPanel(null);
      setActiveConfigurations([]);
      return;
    }

    const panel = panels.find(p => p.id === panelId);
    if (panel) {
      setCurrentPanel(panel);
      setActiveConfigurations(panel.agentConfigurations);
      
      // Update last accessed time
      if (engineRef.current) {
        try {
          engineRef.current.updatePanel(panelId, { lastAccessed: new Date() });
        } catch (err) {
          console.warn('Failed to update last accessed time:', err);
        }
      }
    }
  }, [panels]);

  const refreshData = useCallback(async (): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Refresh all panels
      const allPanels = engineRef.current.getPanels();
      if (mountedRef.current) {
        setPanels(allPanels);
        
        // Update current panel if it exists
        if (currentPanel) {
          const updatedCurrentPanel = allPanels.find(p => p.id === currentPanel.id);
          if (updatedCurrentPanel) {
            setCurrentPanel(updatedCurrentPanel);
            setActiveConfigurations(updatedCurrentPanel.agentConfigurations);
          }
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPanel]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    panels,
    currentPanel,
    activeConfigurations,
    
    // Loading states
    isLoading,
    isUpdating,
    isSaving,
    
    // Panel operations
    createPanel,
    updatePanel,
    deletePanel,
    
    // Agent configuration operations
    createAgentConfig,
    updateAgentConfig,
    deleteAgentConfig,
    
    // Configuration management
    saveConfiguration,
    loadConfiguration,
    resetConfiguration,
    cloneConfiguration,
    
    // Validation
    validateConfiguration,
    validatePanel,
    
    // Testing
    testConfiguration,
    runBacktest,
    
    // Deployment
    deployConfiguration,
    undeployConfiguration,
    
    // Import/Export
    exportConfiguration,
    importConfiguration,
    
    // Utility functions
    setCurrentPanel: setCurrentPanelById,
    refreshData,
    
    // Error handling
    error,
    clearError
  };
};

export default useAIAgentConfigPanel; 