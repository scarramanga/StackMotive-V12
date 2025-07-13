// Block 46: GPT Explanation Log - Hook
import { useState, useEffect, useCallback } from 'react';
import { 
  GPTExplanation,
  ExplanationContext,
  GPTModel,
  ExplanationTemplate,
  ExplanationFeedback,
  ExplanationAnalysis,
  GPTExplanationLogState,
  ExplanationFilter,
  ExplanationStats,
  ExplanationAudit
} from '../types/gptExplanationLog';
import { gptExplanationLogEngine } from '../engines/GPTExplanationLogEngine';

export function useGPTExplanationLog() {
  const [state, setState] = useState<GPTExplanationLogState>({
    explanations: [],
    templates: [],
    feedback: [],
    analysis: [],
    selectedExplanation: null,
    selectedTemplate: null,
    filter: {},
    isLoading: false,
    error: null,
    stats: null,
    models: []
  });

  // Initialize data
  useEffect(() => {
    refreshData();
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const explanations = gptExplanationLogEngine.getAllExplanations();
      const templates = gptExplanationLogEngine.getAllTemplates();
      const feedback = gptExplanationLogEngine.getAllFeedback();
      const models = gptExplanationLogEngine.getAvailableModels();
      const stats = await gptExplanationLogEngine.getUsageStats();

      setState(prev => ({
        ...prev,
        explanations,
        templates,
        feedback,
        models,
        stats,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh data'
      }));
    }
  }, []);

  // Generate explanation
  const generateExplanation = useCallback(async (
    context: ExplanationContext,
    prompt: string,
    model?: GPTModel,
    templateId?: string
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const explanation = await gptExplanationLogEngine.generateExplanation(context, prompt, model, templateId);
      await refreshData();
      return explanation;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate explanation'
      }));
      throw error;
    }
  }, [refreshData]);

  // Validate explanation
  const validateExplanation = useCallback(async (explanationId: string, validatorId: string, accuracy: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const success = await gptExplanationLogEngine.validateExplanation(explanationId, validatorId, accuracy);
      if (success) {
        await refreshData();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to validate explanation'
      }));
      return false;
    }
  }, [refreshData]);

  // Provide feedback
  const provideFeedback = useCallback(async (
    explanationId: string,
    feedbackData: Omit<ExplanationFeedback, 'explanationId' | 'timestamp'>
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const feedback = await gptExplanationLogEngine.provideFeedback(explanationId, feedbackData);
      await refreshData();
      return feedback;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to provide feedback'
      }));
      throw error;
    }
  }, [refreshData]);

  // Create template
  const createTemplate = useCallback(async (
    template: Omit<ExplanationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'rating'>
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const newTemplate = await gptExplanationLogEngine.createTemplate(template);
      await refreshData();
      return newTemplate;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create template'
      }));
      throw error;
    }
  }, [refreshData]);

  // Update template
  const updateTemplate = useCallback(async (templateId: string, updates: Partial<ExplanationTemplate>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const success = await gptExplanationLogEngine.updateTemplate(templateId, updates);
      if (success) {
        await refreshData();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update template'
      }));
      return false;
    }
  }, [refreshData]);

  // Delete template
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const success = await gptExplanationLogEngine.deleteTemplate(templateId);
      if (success) {
        setState(prev => ({
          ...prev,
          selectedTemplate: prev.selectedTemplate?.id === templateId ? null : prev.selectedTemplate
        }));
        await refreshData();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete template'
      }));
      return false;
    }
  }, [refreshData]);

  // Search explanations
  const searchExplanations = useCallback(async (query: string, filters?: ExplanationFilter) => {
    try {
      const results = await gptExplanationLogEngine.searchExplanations(query, filters);
      return results;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to search explanations'
      }));
      return [];
    }
  }, []);

  // Export explanations
  const exportExplanations = useCallback(async (explanationIds?: string[], format: 'json' | 'csv' | 'pdf' = 'json') => {
    try {
      const exportData = await gptExplanationLogEngine.exportExplanations(explanationIds, format);
      return exportData;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to export explanations'
      }));
      return '';
    }
  }, []);

  // Analyze explanation
  const analyzeExplanation = useCallback(async (
    explanationId: string,
    analysisType: ExplanationAnalysis['analysisType']
  ) => {
    try {
      const analysis = await gptExplanationLogEngine.analyzeExplanation(explanationId, analysisType);
      setState(prev => ({
        ...prev,
        analysis: [...prev.analysis, analysis]
      }));
      return analysis;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to analyze explanation'
      }));
      throw error;
    }
  }, []);

  // Generate audit report
  const generateAuditReport = useCallback(async (period: { start: Date; end: Date }) => {
    try {
      const audit = await gptExplanationLogEngine.generateAuditReport(period);
      return audit;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate audit report'
      }));
      return null;
    }
  }, []);

  // Get filtered explanations
  const getFilteredExplanations = useCallback(() => {
    let filtered = [...state.explanations];

    if (state.filter.type) {
      filtered = filtered.filter(exp => exp.type === state.filter.type);
    }

    if (state.filter.category) {
      filtered = filtered.filter(exp => exp.category === state.filter.category);
    }

    if (state.filter.model) {
      filtered = filtered.filter(exp => exp.model.name === state.filter.model);
    }

    if (state.filter.userId) {
      filtered = filtered.filter(exp => exp.userId === state.filter.userId);
    }

    if (state.filter.sessionId) {
      filtered = filtered.filter(exp => exp.sessionId === state.filter.sessionId);
    }

    if (state.filter.validated !== undefined) {
      filtered = filtered.filter(exp => exp.validated === state.filter.validated);
    }

    if (state.filter.minConfidence !== undefined) {
      filtered = filtered.filter(exp => exp.confidence >= state.filter.minConfidence!);
    }

    if (state.filter.maxConfidence !== undefined) {
      filtered = filtered.filter(exp => exp.confidence <= state.filter.maxConfidence!);
    }

    if (state.filter.minAccuracy !== undefined) {
      filtered = filtered.filter(exp => exp.accuracy !== undefined && exp.accuracy >= state.filter.minAccuracy!);
    }

    if (state.filter.language) {
      filtered = filtered.filter(exp => exp.context.language === state.filter.language);
    }

    if (state.filter.hasErrors !== undefined) {
      filtered = filtered.filter(exp => 
        state.filter.hasErrors ? exp.metadata.errorCount > 0 : exp.metadata.errorCount === 0
      );
    }

    if (state.filter.tags && state.filter.tags.length > 0) {
      filtered = filtered.filter(exp =>
        state.filter.tags!.some(tag => exp.tags.includes(tag))
      );
    }

    if (state.filter.searchQuery) {
      const query = state.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(exp =>
        exp.response.toLowerCase().includes(query) ||
        exp.prompt.toLowerCase().includes(query) ||
        exp.context.subject.toLowerCase().includes(query) ||
        exp.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (state.filter.dateFrom || state.filter.dateTo) {
      filtered = filtered.filter(exp => {
        if (state.filter.dateFrom && exp.timestamp < state.filter.dateFrom) return false;
        if (state.filter.dateTo && exp.timestamp > state.filter.dateTo) return false;
        return true;
      });
    }

    return filtered;
  }, [state.explanations, state.filter]);

  // Get filtered templates
  const getFilteredTemplates = useCallback(() => {
    let filtered = [...state.templates];

    if (state.filter.type) {
      filtered = filtered.filter(template => template.type === state.filter.type);
    }

    if (state.filter.category) {
      filtered = filtered.filter(template => template.category === state.filter.category);
    }

    if (state.filter.searchQuery) {
      const query = state.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.promptTemplate.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => b.usage - a.usage);
  }, [state.templates, state.filter]);

  // Get explanations by type
  const getExplanationsByType = useCallback((type: string) => {
    return state.explanations.filter(exp => exp.type === type);
  }, [state.explanations]);

  // Get explanations by user
  const getExplanationsByUser = useCallback((userId: string) => {
    return state.explanations.filter(exp => exp.userId === userId);
  }, [state.explanations]);

  // Get recent explanations
  const getRecentExplanations = useCallback((hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return state.explanations.filter(exp => exp.timestamp >= cutoff);
  }, [state.explanations]);

  // Get high-confidence explanations
  const getHighConfidenceExplanations = useCallback((threshold: number = 0.8) => {
    return state.explanations.filter(exp => exp.confidence >= threshold);
  }, [state.explanations]);

  // Get validated explanations
  const getValidatedExplanations = useCallback(() => {
    return state.explanations.filter(exp => exp.validated);
  }, [state.explanations]);

  // Get explanations with feedback
  const getExplanationsWithFeedback = useCallback(() => {
    const feedbackExplanationIds = new Set(state.feedback.map(f => f.explanationId));
    return state.explanations.filter(exp => feedbackExplanationIds.has(exp.id));
  }, [state.explanations, state.feedback]);

  // Get explanation by ID
  const getExplanation = useCallback((explanationId: string) => {
    return gptExplanationLogEngine.getExplanation(explanationId);
  }, []);

  // Get template by ID
  const getTemplate = useCallback((templateId: string) => {
    return gptExplanationLogEngine.getTemplate(templateId);
  }, []);

  // Get feedback for explanation
  const getFeedbackForExplanation = useCallback((explanationId: string) => {
    return state.feedback.filter(f => f.explanationId === explanationId);
  }, [state.feedback]);

  // Get analysis for explanation
  const getAnalysisForExplanation = useCallback((explanationId: string) => {
    return state.analysis.filter(a => a.explanationId === explanationId);
  }, [state.analysis]);

  // Set filter
  const setFilter = useCallback((filter: ExplanationFilter) => {
    setState(prev => ({ ...prev, filter }));
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setState(prev => ({ ...prev, filter: {} }));
  }, []);

  // Set selected explanation
  const setSelectedExplanation = useCallback((explanation: GPTExplanation | null) => {
    setState(prev => ({ ...prev, selectedExplanation: explanation }));
  }, []);

  // Set selected template
  const setSelectedTemplate = useCallback((template: ExplanationTemplate | null) => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
  }, []);

  // Bulk operations
  const bulkValidateExplanations = useCallback(async (explanationIds: string[], validatorId: string, accuracy: number) => {
    let successCount = 0;
    for (const id of explanationIds) {
      if (await validateExplanation(id, validatorId, accuracy)) {
        successCount++;
      }
    }
    return successCount;
  }, [validateExplanation]);

  const bulkExportExplanations = useCallback(async (explanationIds: string[], format: 'json' | 'csv' | 'pdf' = 'json') => {
    return await exportExplanations(explanationIds, format);
  }, [exportExplanations]);

  const bulkAnalyzeExplanations = useCallback(async (
    explanationIds: string[],
    analysisType: ExplanationAnalysis['analysisType']
  ) => {
    const results: ExplanationAnalysis[] = [];
    for (const id of explanationIds) {
      try {
        const analysis = await analyzeExplanation(id, analysisType);
        results.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze explanation ${id}:`, error);
      }
    }
    return results;
  }, [analyzeExplanation]);

  // Get usage summary
  const getUsageSummary = useCallback(() => {
    const explanations = state.explanations;
    const totalTokens = explanations.reduce((sum, exp) => sum + exp.tokens.totalTokens, 0);
    const totalCost = explanations.reduce((sum, exp) => sum + (exp.tokens.cost || 0), 0);
    const averageConfidence = explanations.length > 0 
      ? explanations.reduce((sum, exp) => sum + exp.confidence, 0) / explanations.length 
      : 0;

    return {
      totalExplanations: explanations.length,
      totalTokens,
      totalCost,
      averageConfidence,
      validatedCount: explanations.filter(exp => exp.validated).length,
      feedbackCount: state.feedback.length,
      templatesCount: state.templates.length,
      modelsCount: state.models.length
    };
  }, [state.explanations, state.feedback, state.templates, state.models]);

  return {
    // State
    explanations: state.explanations,
    filteredExplanations: getFilteredExplanations(),
    templates: state.templates,
    filteredTemplates: getFilteredTemplates(),
    feedback: state.feedback,
    analysis: state.analysis,
    selectedExplanation: state.selectedExplanation,
    selectedTemplate: state.selectedTemplate,
    filter: state.filter,
    isLoading: state.isLoading,
    error: state.error,
    stats: state.stats,
    models: state.models,

    // Actions
    generateExplanation,
    validateExplanation,
    provideFeedback,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchExplanations,
    exportExplanations,
    analyzeExplanation,
    generateAuditReport,
    refreshData,

    // Getters
    getExplanation,
    getTemplate,
    getExplanationsByType,
    getExplanationsByUser,
    getRecentExplanations,
    getHighConfidenceExplanations,
    getValidatedExplanations,
    getExplanationsWithFeedback,
    getFeedbackForExplanation,
    getAnalysisForExplanation,
    getUsageSummary,

    // Filters
    setFilter,
    clearFilter,
    setSelectedExplanation,
    setSelectedTemplate,

    // Bulk operations
    bulkValidateExplanations,
    bulkExportExplanations,
    bulkAnalyzeExplanations
  };
} 