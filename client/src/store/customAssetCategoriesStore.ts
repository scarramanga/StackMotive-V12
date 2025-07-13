// Block 73: Custom Asset Categories - Store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  AssetCategory, 
  AssetCategoryAssignment, 
  AssetCategoryRule,
  AssetClassificationSuggestion, 
  CategoryTaxonomy,
  CategoryAnalytics,
  CategoryPerformanceMetrics,
  CategoryBulkOperation,
  CategoryFilter,
  CustomAssetCategoriesState
} from '../types/customAssetCategories';

interface CustomAssetCategoriesActions {
  // Category management
  addCategory: (category: AssetCategory) => void;
  updateCategory: (id: string, updates: Partial<AssetCategory>) => void;
  removeCategory: (id: string) => void;
  setCategories: (categories: AssetCategory[]) => void;
  
  // Assignment management
  addAssignment: (assignment: AssetCategoryAssignment) => void;
  updateAssignment: (id: string, updates: Partial<AssetCategoryAssignment>) => void;
  removeAssignment: (id: string) => void;
  setAssignments: (assignments: AssetCategoryAssignment[]) => void;
  
  // Rule management
  addRule: (rule: AssetCategoryRule) => void;
  updateRule: (id: string, updates: Partial<AssetCategoryRule>) => void;
  removeRule: (id: string) => void;
  setRules: (rules: AssetCategoryRule[]) => void;
  
  // Suggestion management
  addSuggestion: (suggestion: AssetClassificationSuggestion) => void;
  updateSuggestion: (id: string, updates: Partial<AssetClassificationSuggestion>) => void;
  removeSuggestion: (id: string) => void;
  setSuggestions: (suggestions: AssetClassificationSuggestion[]) => void;
  
  // Taxonomy management
  addTaxonomy: (taxonomy: CategoryTaxonomy) => void;
  updateTaxonomy: (id: string, updates: Partial<CategoryTaxonomy>) => void;
  removeTaxonomy: (id: string) => void;
  setTaxonomies: (taxonomies: CategoryTaxonomy[]) => void;
  
  // Analytics and performance
  setAnalytics: (categoryId: string, analytics: CategoryAnalytics) => void;
  setPerformanceMetrics: (categoryId: string, metrics: CategoryPerformanceMetrics) => void;
  
  // Bulk operations
  addBulkOperation: (operation: CategoryBulkOperation) => void;
  updateBulkOperation: (id: string, updates: Partial<CategoryBulkOperation>) => void;
  removeBulkOperation: (id: string) => void;
  
  // UI state management
  setSelectedCategory: (categoryId: string | null) => void;
  toggleExpandedCategory: (categoryId: string) => void;
  setActiveFilters: (filters: CategoryFilter) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'list' | 'hierarchy' | 'grid') => void;
  
  // Loading states
  setLoadingState: (operation: string, isLoading: boolean) => void;
  
  // Cache management
  updateLastUpdated: (key: string) => void;
  isExpired: (key: string) => boolean;
  clearExpiredCache: () => void;
  
  // Error handling
  setError: (key: string, error: string) => void;
  clearError: (key?: string) => void;
  clearAllErrors: () => void;
  
  // State reset
  reset: () => void;
  resetCategories: () => void;
  resetAssignments: () => void;
}

type CustomAssetCategoriesStore = CustomAssetCategoriesState & CustomAssetCategoriesActions;

const initialState: CustomAssetCategoriesState = {
  // Data
  categories: {},
  assignments: {},
  rules: {},
  suggestions: {},
  taxonomies: {},
  analytics: {},
  performanceMetrics: {},
  bulkOperations: {},
  
  // UI state
  selectedCategoryId: null,
  expandedCategories: new Set(),
  activeFilters: {},
  searchQuery: '',
  viewMode: 'list',
  
  // Loading states
  loadingStates: {},
  
  // Cache management
  lastUpdated: {},
  cacheExpiry: 30 * 60 * 1000, // 30 minutes
  
  // Error handling
  errors: {}
};

export const useCustomAssetCategoriesStore = create<CustomAssetCategoriesStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Category management
      addCategory: (category) => {
        set((state) => ({
          categories: {
            ...state.categories,
            [category.id]: category
          }
        }));
        get().updateLastUpdated('categories');
      },
      
      updateCategory: (id, updates) => {
        set((state) => ({
          categories: {
            ...state.categories,
            [id]: {
              ...state.categories[id],
              ...updates,
              updatedAt: new Date()
            }
          }
        }));
        get().updateLastUpdated('categories');
      },
      
      removeCategory: (id) => {
        set((state) => {
          const { [id]: removed, ...categories } = state.categories;
          return { categories };
        });
        get().updateLastUpdated('categories');
      },
      
      setCategories: (categories) => {
        const categoryMap = categories.reduce((acc, category) => {
          acc[category.id] = category;
          return acc;
        }, {} as Record<string, AssetCategory>);
        
        set({ categories: categoryMap });
        get().updateLastUpdated('categories');
      },
      
      // Assignment management
      addAssignment: (assignment) => {
        set((state) => ({
          assignments: {
            ...state.assignments,
            [assignment.id]: assignment
          }
        }));
        get().updateLastUpdated('assignments');
      },
      
      updateAssignment: (id, updates) => {
        set((state) => ({
          assignments: {
            ...state.assignments,
            [id]: {
              ...state.assignments[id],
              ...updates,
              updatedAt: new Date()
            }
          }
        }));
        get().updateLastUpdated('assignments');
      },
      
      removeAssignment: (id) => {
        set((state) => {
          const { [id]: removed, ...assignments } = state.assignments;
          return { assignments };
        });
        get().updateLastUpdated('assignments');
      },
      
      setAssignments: (assignments) => {
        const assignmentMap = assignments.reduce((acc, assignment) => {
          acc[assignment.id] = assignment;
          return acc;
        }, {} as Record<string, AssetCategoryAssignment>);
        
        set({ assignments: assignmentMap });
        get().updateLastUpdated('assignments');
      },
      
      // Rule management
      addRule: (rule) => {
        set((state) => ({
          rules: {
            ...state.rules,
            [rule.id]: rule
          }
        }));
        get().updateLastUpdated('rules');
      },
      
      updateRule: (id, updates) => {
        set((state) => ({
          rules: {
            ...state.rules,
            [id]: {
              ...state.rules[id],
              ...updates,
              updatedAt: new Date()
            }
          }
        }));
        get().updateLastUpdated('rules');
      },
      
      removeRule: (id) => {
        set((state) => {
          const { [id]: removed, ...rules } = state.rules;
          return { rules };
        });
        get().updateLastUpdated('rules');
      },
      
      setRules: (rules) => {
        const ruleMap = rules.reduce((acc, rule) => {
          acc[rule.id] = rule;
          return acc;
        }, {} as Record<string, AssetCategoryRule>);
        
        set({ rules: ruleMap });
        get().updateLastUpdated('rules');
      },
      
      // Suggestion management
      addSuggestion: (suggestion) => {
        set((state) => ({
          suggestions: {
            ...state.suggestions,
            [suggestion.id]: suggestion
          }
        }));
        get().updateLastUpdated('suggestions');
      },
      
      updateSuggestion: (id, updates) => {
        set((state) => ({
          suggestions: {
            ...state.suggestions,
            [id]: {
              ...state.suggestions[id],
              ...updates
            }
          }
        }));
        get().updateLastUpdated('suggestions');
      },
      
      removeSuggestion: (id) => {
        set((state) => {
          const { [id]: removed, ...suggestions } = state.suggestions;
          return { suggestions };
        });
        get().updateLastUpdated('suggestions');
      },
      
      setSuggestions: (suggestions) => {
        const suggestionMap = suggestions.reduce((acc, suggestion) => {
          acc[suggestion.id] = suggestion;
          return acc;
        }, {} as Record<string, AssetClassificationSuggestion>);
        
        set({ suggestions: suggestionMap });
        get().updateLastUpdated('suggestions');
      },
      
      // Taxonomy management
      addTaxonomy: (taxonomy) => {
        set((state) => ({
          taxonomies: {
            ...state.taxonomies,
            [taxonomy.id]: taxonomy
          }
        }));
        get().updateLastUpdated('taxonomies');
      },
      
      updateTaxonomy: (id, updates) => {
        set((state) => ({
          taxonomies: {
            ...state.taxonomies,
            [id]: {
              ...state.taxonomies[id],
              ...updates,
              updatedAt: new Date()
            }
          }
        }));
        get().updateLastUpdated('taxonomies');
      },
      
      removeTaxonomy: (id) => {
        set((state) => {
          const { [id]: removed, ...taxonomies } = state.taxonomies;
          return { taxonomies };
        });
        get().updateLastUpdated('taxonomies');
      },
      
      setTaxonomies: (taxonomies) => {
        const taxonomyMap = taxonomies.reduce((acc, taxonomy) => {
          acc[taxonomy.id] = taxonomy;
          return acc;
        }, {} as Record<string, CategoryTaxonomy>);
        
        set({ taxonomies: taxonomyMap });
        get().updateLastUpdated('taxonomies');
      },
      
      // Analytics and performance
      setAnalytics: (categoryId, analytics) => {
        set((state) => ({
          analytics: {
            ...state.analytics,
            [categoryId]: analytics
          }
        }));
        get().updateLastUpdated(`analytics_${categoryId}`);
      },
      
      setPerformanceMetrics: (categoryId, metrics) => {
        set((state) => ({
          performanceMetrics: {
            ...state.performanceMetrics,
            [categoryId]: metrics
          }
        }));
        get().updateLastUpdated(`performance_${categoryId}`);
      },
      
      // Bulk operations
      addBulkOperation: (operation) => {
        set((state) => ({
          bulkOperations: {
            ...state.bulkOperations,
            [operation.id]: operation
          }
        }));
        get().updateLastUpdated('bulkOperations');
      },
      
      updateBulkOperation: (id, updates) => {
        set((state) => ({
          bulkOperations: {
            ...state.bulkOperations,
            [id]: {
              ...state.bulkOperations[id],
              ...updates,
              updatedAt: new Date()
            }
          }
        }));
        get().updateLastUpdated('bulkOperations');
      },
      
      removeBulkOperation: (id) => {
        set((state) => {
          const { [id]: removed, ...bulkOperations } = state.bulkOperations;
          return { bulkOperations };
        });
        get().updateLastUpdated('bulkOperations');
      },
      
      // UI state management
      setSelectedCategory: (categoryId) => {
        set({ selectedCategoryId: categoryId });
      },
      
      toggleExpandedCategory: (categoryId) => {
        set((state) => {
          const expandedCategories = new Set(state.expandedCategories);
          if (expandedCategories.has(categoryId)) {
            expandedCategories.delete(categoryId);
          } else {
            expandedCategories.add(categoryId);
          }
          return { expandedCategories };
        });
      },
      
      setActiveFilters: (filters) => {
        set({ activeFilters: filters });
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },
      
      // Loading states
      setLoadingState: (operation, isLoading) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [operation]: isLoading
          }
        }));
      },
      
      // Cache management
      updateLastUpdated: (key) => {
        set((state) => ({
          lastUpdated: {
            ...state.lastUpdated,
            [key]: new Date()
          }
        }));
      },
      
      isExpired: (key) => {
        const state = get();
        const lastUpdate = state.lastUpdated[key];
        if (!lastUpdate) return true;
        
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdate.getTime();
        return timeDiff > state.cacheExpiry;
      },
      
      clearExpiredCache: () => {
        const state = get();
        const now = new Date();
        
        Object.entries(state.lastUpdated).forEach(([key, lastUpdate]) => {
          const timeDiff = now.getTime() - lastUpdate.getTime();
          if (timeDiff > state.cacheExpiry) {
            // Clear specific cache based on key
            if (key.startsWith('analytics_')) {
              const categoryId = key.replace('analytics_', '');
              set((state) => {
                const { [categoryId]: removed, ...analytics } = state.analytics;
                return { analytics };
              });
            } else if (key.startsWith('performance_')) {
              const categoryId = key.replace('performance_', '');
              set((state) => {
                const { [categoryId]: removed, ...performanceMetrics } = state.performanceMetrics;
                return { performanceMetrics };
              });
            }
          }
        });
      },
      
      // Error handling
      setError: (key, error) => {
        set((state) => ({
          errors: {
            ...state.errors,
            [key]: error
          }
        }));
      },
      
      clearError: (key) => {
        if (key) {
          set((state) => {
            const { [key]: removed, ...errors } = state.errors;
            return { errors };
          });
        } else {
          // Clear all errors if no key specified
          set({ errors: {} });
        }
      },
      
      clearAllErrors: () => {
        set({ errors: {} });
      },
      
      // State reset
      reset: () => {
        set(initialState);
      },
      
      resetCategories: () => {
        set({ categories: {} });
        get().updateLastUpdated('categories');
      },
      
      resetAssignments: () => {
        set({ assignments: {} });
        get().updateLastUpdated('assignments');
      }
    }),
    {
      name: 'custom-asset-categories-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist core data, not UI state or loading states
        categories: state.categories,
        assignments: state.assignments,
        rules: state.rules,
        taxonomies: state.taxonomies,
        selectedCategoryId: state.selectedCategoryId,
        activeFilters: state.activeFilters,
        viewMode: state.viewMode,
        lastUpdated: state.lastUpdated
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert Set back from array if needed
          if (Array.isArray(state.expandedCategories)) {
            state.expandedCategories = new Set(state.expandedCategories);
          }
          
          // Convert date strings back to Date objects
          Object.keys(state.lastUpdated).forEach(key => {
            if (typeof state.lastUpdated[key] === 'string') {
              state.lastUpdated[key] = new Date(state.lastUpdated[key]);
            }
          });
          
          // Clear expired cache on rehydration
          state.clearExpiredCache?.();
        }
      }
    }
  )
);

// Selectors for computed values
export const selectCategoriesList = (state: CustomAssetCategoriesStore) => 
  Object.values(state.categories);

export const selectAssignmentsList = (state: CustomAssetCategoriesStore) => 
  Object.values(state.assignments);

export const selectRulesList = (state: CustomAssetCategoriesStore) => 
  Object.values(state.rules);

export const selectSuggestionsList = (state: CustomAssetCategoriesStore) => 
  Object.values(state.suggestions);

export const selectTaxonomiesList = (state: CustomAssetCategoriesStore) => 
  Object.values(state.taxonomies);

export const selectCategoryById = (id: string) => (state: CustomAssetCategoriesStore) => 
  state.categories[id];

export const selectAssignmentsByCategory = (categoryId: string) => (state: CustomAssetCategoriesStore) => 
  Object.values(state.assignments).filter(assignment => assignment.categoryId === categoryId);

export const selectAssignmentsByAsset = (assetSymbol: string) => (state: CustomAssetCategoriesStore) => 
  Object.values(state.assignments).filter(assignment => assignment.assetSymbol === assetSymbol);

export const selectActiveCategories = (state: CustomAssetCategoriesStore) => 
  Object.values(state.categories).filter(category => category.isActive);

export const selectCategoriesByType = (type: AssetCategory['categoryType']) => (state: CustomAssetCategoriesStore) => 
  Object.values(state.categories).filter(category => category.categoryType === type);

export const selectIsLoading = (operation: string) => (state: CustomAssetCategoriesStore) => 
  state.loadingStates[operation] || false;

export const selectHasError = (key: string) => (state: CustomAssetCategoriesStore) => 
  Boolean(state.errors[key]);

export const selectError = (key: string) => (state: CustomAssetCategoriesStore) => 
  state.errors[key];

export default useCustomAssetCategoriesStore; 