// Block 46: GPT Explanation Log - Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  GPTExplanation,
  ExplanationContext,
  GPTModel,
  ExplanationTemplate,
  ExplanationFeedback,
  ExplanationAnalysis,
  ExplanationFilter,
  ExplanationStats,
  ExplanationAudit
} from '../types/gptExplanationLog';
import { gptExplanationLogEngine } from '../engines/GPTExplanationLogEngine';

interface GPTExplanationLogStore {
  // State
  explanations: GPTExplanation[];
  templates: ExplanationTemplate[];
  feedback: ExplanationFeedback[];
  analysis: ExplanationAnalysis[];
  selectedExplanation: GPTExplanation | null;
  selectedTemplate: ExplanationTemplate | null;
  filter: ExplanationFilter;
  isLoading: boolean;
  error: string | null;
  stats: ExplanationStats | null;
  models: GPTModel[];
  
  // Actions
  initialize: () => Promise<void>;
  generateExplanation: (context: ExplanationContext, prompt: string, model?: GPTModel, templateId?: string) => Promise<GPTExplanation>;
  validateExplanation: (explanationId: string, validatorId: string, accuracy: number) => Promise<boolean>;
  provideFeedback: (explanationId: string, feedback: Omit<ExplanationFeedback, 'explanationId' | 'timestamp'>) => Promise<ExplanationFeedback>;
  createTemplate: (template: Omit<ExplanationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'rating'>) => Promise<ExplanationTemplate>;
  updateTemplate: (templateId: string, updates: Partial<ExplanationTemplate>) => Promise<boolean>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  searchExplanations: (query: string, filters?: ExplanationFilter) => Promise<GPTExplanation[]>;
  exportExplanations: (explanationIds?: string[], format?: 'json' | 'csv' | 'pdf') => Promise<string>;
  analyzeExplanation: (explanationId: string, analysisType: ExplanationAnalysis['analysisType']) => Promise<ExplanationAnalysis>;
  generateAuditReport: (period: { start: Date; end: Date }) => Promise<ExplanationAudit | null>;
  refreshData: () => Promise<void>;
  
  // Getters
  getExplanation: (explanationId: string) => GPTExplanation | undefined;
  getTemplate: (templateId: string) => ExplanationTemplate | undefined;
  getFilteredExplanations: () => GPTExplanation[];
  getFilteredTemplates: () => ExplanationTemplate[];
  getExplanationsByType: (type: string) => GPTExplanation[];
  getExplanationsByUser: (userId: string) => GPTExplanation[];
  getRecentExplanations: (hours?: number) => GPTExplanation[];
  getHighConfidenceExplanations: (threshold?: number) => GPTExplanation[];
  getValidatedExplanations: () => GPTExplanation[];
  getExplanationsWithFeedback: () => GPTExplanation[];
  getFeedbackForExplanation: (explanationId: string) => ExplanationFeedback[];
  getAnalysisForExplanation: (explanationId: string) => ExplanationAnalysis[];
  getUsageSummary: () => any;
  
  // Filters
  setFilter: (filter: ExplanationFilter) => void;
  clearFilter: () => void;
  setSelectedExplanation: (explanation: GPTExplanation | null) => void;
  setSelectedTemplate: (template: ExplanationTemplate | null) => void;
  
  // Bulk operations
  bulkValidateExplanations: (explanationIds: string[], validatorId: string, accuracy: number) => Promise<number>;
  bulkExportExplanations: (explanationIds: string[], format?: 'json' | 'csv' | 'pdf') => Promise<string>;
  bulkAnalyzeExplanations: (explanationIds: string[], analysisType: ExplanationAnalysis['analysisType']) => Promise<ExplanationAnalysis[]>;
  
  // Utilities
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGPTExplanationLogStore = create<GPTExplanationLogStore>()(
  persist(
    (set, get) => ({
      // Initial state
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
      models: [],
      
      // Initialize store
      initialize: async () => {
        try {
          set({ isLoading: true });
          await get().refreshData();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize',
            isLoading: false
          });
        }
      },
      
      // Generate explanation
      generateExplanation: async (context: ExplanationContext, prompt: string, model?: GPTModel, templateId?: string) => {
        try {
          set({ isLoading: true });
          const explanation = await gptExplanationLogEngine.generateExplanation(context, prompt, model, templateId);
          await get().refreshData();
          return explanation;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to generate explanation',
            isLoading: false
          });
          throw error;
        }
      },
      
      // Validate explanation
      validateExplanation: async (explanationId: string, validatorId: string, accuracy: number) => {
        try {
          set({ isLoading: true });
          const success = await gptExplanationLogEngine.validateExplanation(explanationId, validatorId, accuracy);
          if (success) {
            await get().refreshData();
          }
          return success;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to validate explanation',
            isLoading: false
          });
          return false;
        }
      },
      
      // Provide feedback
      provideFeedback: async (explanationId: string, feedbackData: Omit<ExplanationFeedback, 'explanationId' | 'timestamp'>) => {
        try {
          set({ isLoading: true });
          const feedback = await gptExplanationLogEngine.provideFeedback(explanationId, feedbackData);
          await get().refreshData();
          return feedback;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to provide feedback',
            isLoading: false
          });
          throw error;
        }
      },
      
      // Create template
      createTemplate: async (template: Omit<ExplanationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'rating'>) => {
        try {
          set({ isLoading: true });
          const newTemplate = await gptExplanationLogEngine.createTemplate(template);
          await get().refreshData();
          return newTemplate;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create template',
            isLoading: false
          });
          throw error;
        }
      },
      
      // Update template
      updateTemplate: async (templateId: string, updates: Partial<ExplanationTemplate>) => {
        try {
          set({ isLoading: true });
          const success = await gptExplanationLogEngine.updateTemplate(templateId, updates);
          if (success) {
            await get().refreshData();
          }
          return success;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update template',
            isLoading: false
          });
          return false;
        }
      },
      
      // Delete template
      deleteTemplate: async (templateId: string) => {
        try {
          set({ isLoading: true });
          const success = await gptExplanationLogEngine.deleteTemplate(templateId);
          if (success) {
            set(state => ({
              selectedTemplate: state.selectedTemplate?.id === templateId ? null : state.selectedTemplate
            }));
            await get().refreshData();
          }
          return success;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete template',
            isLoading: false
          });
          return false;
        }
      },
      
      // Search explanations
      searchExplanations: async (query: string, filters?: ExplanationFilter) => {
        try {
          const results = await gptExplanationLogEngine.searchExplanations(query, filters);
          return results;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to search explanations'
          });
          return [];
        }
      },
      
      // Export explanations
      exportExplanations: async (explanationIds?: string[], format: 'json' | 'csv' | 'pdf' = 'json') => {
        try {
          const exportData = await gptExplanationLogEngine.exportExplanations(explanationIds, format);
          return exportData;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to export explanations'
          });
          return '';
        }
      },
      
      // Analyze explanation
      analyzeExplanation: async (explanationId: string, analysisType: ExplanationAnalysis['analysisType']) => {
        try {
          const analysis = await gptExplanationLogEngine.analyzeExplanation(explanationId, analysisType);
          set(state => ({
            analysis: [...state.analysis, analysis]
          }));
          return analysis;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to analyze explanation'
          });
          throw error;
        }
      },
      
      // Generate audit report
      generateAuditReport: async (period: { start: Date; end: Date }) => {
        try {
          const audit = await gptExplanationLogEngine.generateAuditReport(period);
          return audit;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to generate audit report'
          });
          return null;
        }
      },
      
      // Refresh data
      refreshData: async () => {
        try {
          set({ isLoading: true });
          
          const explanations = gptExplanationLogEngine.getAllExplanations();
          const templates = gptExplanationLogEngine.getAllTemplates();
          const feedback = gptExplanationLogEngine.getAllFeedback();
          const models = gptExplanationLogEngine.getAvailableModels();
          const stats = await gptExplanationLogEngine.getUsageStats();
          
          set({
            explanations,
            templates,
            feedback,
            models,
            stats,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh data',
            isLoading: false
          });
        }
      },
      
      // Get explanation by ID
      getExplanation: (explanationId: string) => {
        return gptExplanationLogEngine.getExplanation(explanationId);
      },
      
      // Get template by ID
      getTemplate: (templateId: string) => {
        return gptExplanationLogEngine.getTemplate(templateId);
      },
      
      // Get filtered explanations
      getFilteredExplanations: () => {
        const { explanations, filter } = get();
        let filtered = [...explanations];

        if (filter.type) {
          filtered = filtered.filter(exp => exp.type === filter.type);
        }

        if (filter.category) {
          filtered = filtered.filter(exp => exp.category === filter.category);
        }

        if (filter.model) {
          filtered = filtered.filter(exp => exp.model.name === filter.model);
        }

        if (filter.userId) {
          filtered = filtered.filter(exp => exp.userId === filter.userId);
        }

        if (filter.sessionId) {
          filtered = filtered.filter(exp => exp.sessionId === filter.sessionId);
        }

        if (filter.validated !== undefined) {
          filtered = filtered.filter(exp => exp.validated === filter.validated);
        }

        if (filter.minConfidence !== undefined) {
          filtered = filtered.filter(exp => exp.confidence >= filter.minConfidence!);
        }

        if (filter.maxConfidence !== undefined) {
          filtered = filtered.filter(exp => exp.confidence <= filter.maxConfidence!);
        }

        if (filter.minAccuracy !== undefined) {
          filtered = filtered.filter(exp => exp.accuracy !== undefined && exp.accuracy >= filter.minAccuracy!);
        }

        if (filter.language) {
          filtered = filtered.filter(exp => exp.context.language === filter.language);
        }

        if (filter.hasErrors !== undefined) {
          filtered = filtered.filter(exp => 
            filter.hasErrors ? exp.metadata.errorCount > 0 : exp.metadata.errorCount === 0
          );
        }

        if (filter.tags && filter.tags.length > 0) {
          filtered = filtered.filter(exp =>
            filter.tags!.some(tag => exp.tags.includes(tag))
          );
        }

        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter(exp =>
            exp.response.toLowerCase().includes(query) ||
            exp.prompt.toLowerCase().includes(query) ||
            exp.context.subject.toLowerCase().includes(query) ||
            exp.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }

        if (filter.dateFrom || filter.dateTo) {
          filtered = filtered.filter(exp => {
            if (filter.dateFrom && exp.timestamp < filter.dateFrom) return false;
            if (filter.dateTo && exp.timestamp > filter.dateTo) return false;
            return true;
          });
        }

        return filtered;
      },
      
      // Get filtered templates
      getFilteredTemplates: () => {
        const { templates, filter } = get();
        let filtered = [...templates];

        if (filter.type) {
          filtered = filtered.filter(template => template.type === filter.type);
        }

        if (filter.category) {
          filtered = filtered.filter(template => template.category === filter.category);
        }

        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter(template =>
            template.name.toLowerCase().includes(query) ||
            template.description.toLowerCase().includes(query) ||
            template.promptTemplate.toLowerCase().includes(query)
          );
        }

        return filtered.sort((a, b) => b.usage - a.usage);
      },
      
      // Get explanations by type
      getExplanationsByType: (type: string) => {
        const { explanations } = get();
        return explanations.filter(exp => exp.type === type);
      },
      
      // Get explanations by user
      getExplanationsByUser: (userId: string) => {
        const { explanations } = get();
        return explanations.filter(exp => exp.userId === userId);
      },
      
      // Get recent explanations
      getRecentExplanations: (hours: number = 24) => {
        const { explanations } = get();
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return explanations.filter(exp => exp.timestamp >= cutoff);
      },
      
      // Get high-confidence explanations
      getHighConfidenceExplanations: (threshold: number = 0.8) => {
        const { explanations } = get();
        return explanations.filter(exp => exp.confidence >= threshold);
      },
      
      // Get validated explanations
      getValidatedExplanations: () => {
        const { explanations } = get();
        return explanations.filter(exp => exp.validated);
      },
      
      // Get explanations with feedback
      getExplanationsWithFeedback: () => {
        const { explanations, feedback } = get();
        const feedbackExplanationIds = new Set(feedback.map(f => f.explanationId));
        return explanations.filter(exp => feedbackExplanationIds.has(exp.id));
      },
      
      // Get feedback for explanation
      getFeedbackForExplanation: (explanationId: string) => {
        const { feedback } = get();
        return feedback.filter(f => f.explanationId === explanationId);
      },
      
      // Get analysis for explanation
      getAnalysisForExplanation: (explanationId: string) => {
        const { analysis } = get();
        return analysis.filter(a => a.explanationId === explanationId);
      },
      
      // Get usage summary
      getUsageSummary: () => {
        const { explanations, feedback, templates, models } = get();
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
          feedbackCount: feedback.length,
          templatesCount: templates.length,
          modelsCount: models.length
        };
      },
      
      // Set filter
      setFilter: (filter: ExplanationFilter) => {
        set({ filter });
      },
      
      // Clear filter
      clearFilter: () => {
        set({ filter: {} });
      },
      
      // Set selected explanation
      setSelectedExplanation: (explanation: GPTExplanation | null) => {
        set({ selectedExplanation: explanation });
      },
      
      // Set selected template
      setSelectedTemplate: (template: ExplanationTemplate | null) => {
        set({ selectedTemplate: template });
      },
      
      // Bulk validate explanations
      bulkValidateExplanations: async (explanationIds: string[], validatorId: string, accuracy: number) => {
        let successCount = 0;
        for (const id of explanationIds) {
          if (await get().validateExplanation(id, validatorId, accuracy)) {
            successCount++;
          }
        }
        return successCount;
      },
      
      // Bulk export explanations
      bulkExportExplanations: async (explanationIds: string[], format: 'json' | 'csv' | 'pdf' = 'json') => {
        return await get().exportExplanations(explanationIds, format);
      },
      
      // Bulk analyze explanations
      bulkAnalyzeExplanations: async (explanationIds: string[], analysisType: ExplanationAnalysis['analysisType']) => {
        const results: ExplanationAnalysis[] = [];
        for (const id of explanationIds) {
          try {
            const analysis = await get().analyzeExplanation(id, analysisType);
            results.push(analysis);
          } catch (error) {
            console.error(`Failed to analyze explanation ${id}:`, error);
          }
        }
        return results;
      },
      
      // Set loading
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      // Set error
      setError: (error: string | null) => {
        set({ error });
      },
      
      // Reset store
      reset: () => {
        set({
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
      }
    }),
    {
      name: 'gpt-explanation-log-store',
      partialize: (state) => ({
        filter: state.filter,
        selectedExplanation: state.selectedExplanation,
        selectedTemplate: state.selectedTemplate
      })
    }
  )
);

// Auto-refresh data every 10 minutes to update stats
let autoRefreshInterval: NodeJS.Timeout;

// Start auto-refresh
export const startAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setInterval(() => {
    const store = useGPTExplanationLogStore.getState();
    store.refreshData();
  }, 10 * 60 * 1000); // Refresh every 10 minutes
};

// Stop auto-refresh
export const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
};

// Initialize auto-refresh on store creation
startAutoRefresh(); 