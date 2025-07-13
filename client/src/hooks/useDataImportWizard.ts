// Block 74: Data Import Wizard - Hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { DataImportWizardEngine } from '../engines/DataImportWizardEngine';
import {
  DataImportWizard,
  ImportTemplate,
  ImportHistory,
  ImportSourceData,
  DataSchema,
  ValidatedRecord,
  TransformedRecord,
  MappedRecord,
  ImportResults,
  WizardFilter,
  TemplateFilter,
  ImportProgressResponse,
  ImportDetail,
  FieldMapping,
  FieldTransformation,
  UseDataImportWizardReturn
} from '../types/dataImportWizard';

export function useDataImportWizard(): UseDataImportWizardReturn {
  const engine = useRef(DataImportWizardEngine.getInstance()).current;
  
  // State management
  const [wizards, setWizards] = useState<DataImportWizard[]>([]);
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [currentWizard, setCurrentWizard] = useState<DataImportWizard | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [wizardFilter, setWizardFilter] = useState<WizardFilter>({});
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>({});
  
  // Auto-refresh intervals
  const refreshInterval = useRef<NodeJS.Timeout>();
  const progressInterval = useRef<NodeJS.Timeout>();

  // Load initial data
  useEffect(() => {
    loadWizards();
    loadTemplates();
    loadImportHistory();
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    return () => {
      clearInterval(refreshInterval.current);
      clearInterval(progressInterval.current);
    };
  }, []);

  // Auto-refresh for active imports
  useEffect(() => {
    const activeImports = wizards.filter(w => w.status === 'in_progress');
    if (activeImports.length > 0) {
      startProgressTracking(activeImports);
    } else {
      clearInterval(progressInterval.current);
    }
  }, [wizards]);

  // Data loading functions
  const loadWizards = useCallback(async () => {
    try {
      setIsLoading(true);
      const wizardList = engine.getWizards();
      setWizards(wizardList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wizards');
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  const loadTemplates = useCallback(async () => {
    try {
      const templateList = engine.getTemplates();
      setTemplates(templateList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    }
  }, [engine]);

  const loadImportHistory = useCallback(async () => {
    try {
      const history = engine.getImportHistory();
      setImportHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load import history');
    }
  }, [engine]);

  // Wizard operations
  const createWizard = useCallback(async (config: Omit<DataImportWizard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<DataImportWizard> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const newWizard = await engine.createWizard(config);
      setWizards(prev => [...prev, newWizard]);
      setCurrentWizard(newWizard);
      
      return newWizard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wizard';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [engine]);

  const updateWizard = useCallback(async (id: string, updates: Partial<DataImportWizard>): Promise<DataImportWizard> => {
    try {
      setError(null);
      
      const updatedWizard = await engine.updateWizard(id, updates);
      setWizards(prev => prev.map(w => w.id === id ? updatedWizard : w));
      
      if (currentWizard?.id === id) {
        setCurrentWizard(updatedWizard);
      }
      
      return updatedWizard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update wizard';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentWizard]);

  const deleteWizard = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      await engine.deleteWizard(id);
      setWizards(prev => prev.filter(w => w.id !== id));
      
      if (currentWizard?.id === id) {
        setCurrentWizard(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete wizard';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentWizard]);

  const cloneWizard = useCallback(async (id: string): Promise<DataImportWizard> => {
    try {
      setError(null);
      
      const clonedWizard = await engine.cloneWizard(id);
      setWizards(prev => [...prev, clonedWizard]);
      
      return clonedWizard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clone wizard';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  // Step navigation
  const goToStep = useCallback(async (stepId: string): Promise<void> => {
    if (!currentWizard) throw new Error('No active wizard');
    
    try {
      setError(null);
      
      await engine.goToStep(currentWizard.id, stepId);
      const updatedWizard = await engine.getWizard(currentWizard.id);
      
      if (updatedWizard) {
        setCurrentWizard(updatedWizard);
        setWizards(prev => prev.map(w => w.id === currentWizard.id ? updatedWizard : w));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to navigate to step';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentWizard]);

  const nextStep = useCallback(async (): Promise<void> => {
    if (!currentWizard) throw new Error('No active wizard');
    
    try {
      setError(null);
      
      await engine.nextStep(currentWizard.id);
      const updatedWizard = await engine.getWizard(currentWizard.id);
      
      if (updatedWizard) {
        setCurrentWizard(updatedWizard);
        setWizards(prev => prev.map(w => w.id === currentWizard.id ? updatedWizard : w));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to go to next step';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentWizard]);

  const previousStep = useCallback(async (): Promise<void> => {
    if (!currentWizard) throw new Error('No active wizard');
    
    try {
      setError(null);
      
      await engine.previousStep(currentWizard.id);
      const updatedWizard = await engine.getWizard(currentWizard.id);
      
      if (updatedWizard) {
        setCurrentWizard(updatedWizard);
        setWizards(prev => prev.map(w => w.id === currentWizard.id ? updatedWizard : w));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to go to previous step';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentWizard]);

  const completeStep = useCallback(async (stepId: string, data: any): Promise<void> => {
    if (!currentWizard) throw new Error('No active wizard');
    
    try {
      setError(null);
      
      await engine.completeStep(currentWizard.id, stepId, data);
      const updatedWizard = await engine.getWizard(currentWizard.id);
      
      if (updatedWizard) {
        setCurrentWizard(updatedWizard);
        setWizards(prev => prev.map(w => w.id === currentWizard.id ? updatedWizard : w));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete step';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentWizard]);

  // Data processing
  const uploadFile = useCallback(async (file: File): Promise<ImportSourceData> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const sourceData = await engine.uploadFile(file);
      return sourceData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [engine]);

  const validateData = useCallback(async (data: any[], schema: DataSchema): Promise<ValidatedRecord[]> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const validatedRecords = await engine.validateData(data, schema);
      return validatedRecords;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [engine]);

  const transformData = useCallback(async (data: ValidatedRecord[], transformations: FieldTransformation[]): Promise<TransformedRecord[]> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const transformedRecords = await engine.transformData(data, transformations);
      return transformedRecords;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transform data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [engine]);

  const mapData = useCallback(async (data: TransformedRecord[], mappings: FieldMapping[]): Promise<MappedRecord[]> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const mappedRecords = await engine.mapData(data, mappings);
      return mappedRecords;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to map data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [engine]);

  // Import execution
  const executeImport = useCallback(async (wizardId: string): Promise<ImportResults> => {
    try {
      setIsImporting(true);
      setError(null);
      
      const results = await engine.executeImport(wizardId);
      
      // Refresh wizard data after import
      const updatedWizard = await engine.getWizard(wizardId);
      if (updatedWizard) {
        setWizards(prev => prev.map(w => w.id === wizardId ? updatedWizard : w));
        if (currentWizard?.id === wizardId) {
          setCurrentWizard(updatedWizard);
        }
      }
      
      // Refresh import history
      await loadImportHistory();
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute import';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsImporting(false);
    }
  }, [engine, currentWizard, loadImportHistory]);

  const cancelImport = useCallback(async (wizardId: string): Promise<void> => {
    try {
      setError(null);
      
      await engine.cancelImport(wizardId);
      
      // Refresh wizard data
      const updatedWizard = await engine.getWizard(wizardId);
      if (updatedWizard) {
        setWizards(prev => prev.map(w => w.id === wizardId ? updatedWizard : w));
        if (currentWizard?.id === wizardId) {
          setCurrentWizard(updatedWizard);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel import';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentWizard]);

  const getImportProgress = useCallback(async (wizardId: string): Promise<ImportProgressResponse> => {
    try {
      setError(null);
      
      const progress = await engine.getImportProgress(wizardId);
      return progress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get import progress';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  // Template operations
  const createTemplate = useCallback(async (template: Omit<ImportTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ImportTemplate> => {
    try {
      setError(null);
      
      const newTemplate = await engine.createTemplate(template);
      setTemplates(prev => [...prev, newTemplate]);
      
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<ImportTemplate>): Promise<ImportTemplate> => {
    try {
      setError(null);
      
      const updatedTemplate = await engine.updateTemplate(id, updates);
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
      
      return updatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      await engine.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const useTemplate = useCallback(async (templateId: string): Promise<DataImportWizard> => {
    try {
      setError(null);
      
      const newWizard = await engine.useTemplate(templateId);
      setWizards(prev => [...prev, newWizard]);
      setCurrentWizard(newWizard);
      
      return newWizard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to use template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  // Validation and preview
  const previewImport = useCallback(async (wizardId: string): Promise<ImportDetail[]> => {
    try {
      setError(null);
      
      const wizard = engine.getWizard(wizardId);
      if (!wizard) throw new Error('Wizard not found');
      
      // Return preview based on processed data
      const preview: ImportDetail[] = wizard.processedData.mappedData.slice(0, 10).map(record => ({
        rowIndex: record.rowIndex,
        status: 'success' as const,
        data: record.targetData,
        message: 'Preview - will be imported'
      }));
      
      return preview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to preview import';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const validateSchema = useCallback(async (schema: DataSchema) => {
    try {
      setError(null);
      
      const validation = await engine.validateSchema(schema);
      return validation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate schema';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const detectSchema = useCallback(async (data: any[]): Promise<DataSchema> => {
    try {
      setError(null);
      
      const schema = await engine.detectSchema(data);
      return schema;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect schema';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  // Filtering and search
  const filterWizards = useCallback((filter: WizardFilter) => {
    setWizardFilter(filter);
  }, []);

  const filterTemplates = useCallback((filter: TemplateFilter) => {
    setTemplateFilter(filter);
  }, []);

  const searchWizards = useCallback((query: string) => {
    setWizardFilter(prev => ({ ...prev, searchTerm: query }));
  }, []);

  const searchTemplates = useCallback((query: string) => {
    setTemplateFilter(prev => ({ ...prev, searchTerm: query }));
  }, []);

  // Export and reporting
  const exportResults = useCallback(async (wizardId: string, format: 'csv' | 'excel' | 'json'): Promise<Blob> => {
    try {
      setError(null);
      
      const wizard = engine.getWizard(wizardId);
      if (!wizard?.importResults) throw new Error('No import results to export');
      
      const data = wizard.importResults.details;
      let content: string;
      let mimeType: string;
      
      switch (format) {
        case 'csv':
          content = convertToCSV(data);
          mimeType = 'text/csv';
          break;
        case 'json':
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          break;
        case 'excel':
          content = convertToCSV(data); // Simplified - would need proper Excel export
          mimeType = 'application/vnd.ms-excel';
          break;
        default:
          throw new Error('Unsupported format');
      }
      
      return new Blob([content], { type: mimeType });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export results';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const generateReport = useCallback(async (wizardId: string): Promise<string> => {
    try {
      setError(null);
      
      const wizard = engine.getWizard(wizardId);
      if (!wizard?.importResults) throw new Error('No import results for report');
      
      const report = `
Import Report for ${wizard.name}
==============================

Import Summary:
- Total Records: ${wizard.importResults.summary.totalRecords}
- Successful: ${wizard.importResults.summary.successfulImports}
- Failed: ${wizard.importResults.summary.failedImports}
- Skipped: ${wizard.importResults.summary.skippedRecords}
- Duration: ${wizard.importResults.summary.importTime}ms

Status: ${wizard.importResults.status}
Completed: ${wizard.completedAt?.toISOString() || 'Not completed'}

Errors: ${wizard.importResults.errors.length}
Warnings: ${wizard.importResults.warnings.length}
`;
      
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  // Error handling
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Utility functions
  const setupAutoRefresh = useCallback(() => {
    refreshInterval.current = setInterval(() => {
      loadWizards();
      loadTemplates();
    }, 30000); // Refresh every 30 seconds
  }, [loadWizards, loadTemplates]);

  const startProgressTracking = useCallback((activeWizards: DataImportWizard[]) => {
    clearInterval(progressInterval.current);
    
    progressInterval.current = setInterval(async () => {
      for (const wizard of activeWizards) {
        try {
          const progress = await getImportProgress(wizard.id);
          if (progress.status !== 'in_progress') {
            // Import completed or failed, refresh data
            await loadWizards();
            await loadImportHistory();
          }
        } catch (err) {
          console.error('Failed to track progress:', err);
        }
      }
    }, 5000); // Check progress every 5 seconds
  }, [getImportProgress, loadWizards, loadImportHistory]);

  const convertToCSV = useCallback((data: ImportDetail[]): string => {
    const headers = ['Row Index', 'Status', 'Record ID', 'Message'];
    const rows = data.map(item => [
      item.rowIndex,
      item.status,
      item.recordId || '',
      item.message || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }, []);

  // Apply filters to data
  const filteredWizards = engine.filterWizards(wizards, wizardFilter);
  const filteredTemplates = engine.filterTemplates(templates, templateFilter);

  return {
    // Data
    wizards: filteredWizards,
    templates: filteredTemplates,
    currentWizard,
    importHistory,
    
    // Loading states
    isLoading,
    isCreating,
    isProcessing,
    isImporting,
    
    // Wizard operations
    createWizard,
    updateWizard,
    deleteWizard,
    cloneWizard,
    
    // Step navigation
    goToStep,
    nextStep,
    previousStep,
    completeStep,
    
    // Data processing
    uploadFile,
    validateData,
    transformData,
    mapData,
    
    // Import execution
    executeImport,
    cancelImport,
    getImportProgress,
    
    // Template operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    
    // Validation and preview
    previewImport,
    validateSchema,
    detectSchema,
    
    // Filtering and search
    filterWizards,
    filterTemplates,
    searchWizards,
    searchTemplates,
    
    // Export and reporting
    exportResults,
    generateReport,
    
    // Error handling
    error,
    clearError
  };
} 