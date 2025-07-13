// Block 73: Custom Asset Categories - Hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AssetCategory, 
  AssetCategoryAssignment, 
  AssetClassificationSuggestion, 
  CategoryTaxonomy,
  CategoryAnalytics,
  CategoryPerformanceMetrics,
  CategoryValidationResult,
  CategoryBulkOperation,
  CategoryImportTemplate,
  CategoryFilter,
  AssetAssignmentFilter,
  CategoryHierarchyNode,
  UseCustomAssetCategoriesReturn
} from '../types/customAssetCategories';
import CustomAssetCategoriesEngine from '../engines/CustomAssetCategoriesEngine';

// Temporary store state - will be replaced with actual store
const useTemporaryStore = () => {
  const [storeCategories] = useState<Record<string, AssetCategory>>({});
  const [storeAssignments] = useState<Record<string, AssetCategoryAssignment>>({});
  const [storeSuggestions] = useState<Record<string, AssetClassificationSuggestion>>({});
  const [storeTaxonomies] = useState<Record<string, CategoryTaxonomy>>({});
  const [activeFilters, setActiveFilters] = useState<CategoryFilter>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategory] = useState<string | null>(null);
  const [errors] = useState<Record<string, string>>({});

  return {
    categories: storeCategories,
    assignments: storeAssignments,
    suggestions: storeSuggestions,
    taxonomies: storeTaxonomies,
    activeFilters,
    searchQuery,
    selectedCategoryId,
    setActiveFilters,
    setSearchQuery,
    setSelectedCategory,
    addCategory: (category: AssetCategory) => {},
    updateCategory: (id: string, category: AssetCategory) => {},
    removeCategory: (id: string) => {},
    addAssignment: (assignment: AssetCategoryAssignment) => {},
    removeAssignment: (id: string) => {},
    addSuggestion: (suggestion: AssetClassificationSuggestion) => {},
    clearError: () => {},
    errors
  };
};

export const useCustomAssetCategories = (): UseCustomAssetCategoriesReturn => {
  const engine = CustomAssetCategoriesEngine.getInstance();
  const queryClient = useQueryClient();
  
  // Store integration (temporary implementation)
  const {
    categories: storeCategories,
    assignments: storeAssignments,
    suggestions: storeSuggestions,
    taxonomies: storeTaxonomies,
    activeFilters,
    searchQuery,
    selectedCategoryId,
    setActiveFilters,
    setSearchQuery,
    setSelectedCategory,
    addCategory,
    updateCategory,
    removeCategory,
    addAssignment,
    removeAssignment,
    addSuggestion,
    clearError,
    errors
  } = useTemporaryStore();

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Query keys
  const QUERY_KEYS = {
    categories: ['categories', activeFilters, searchQuery],
    assignments: ['assignments', activeFilters],
    suggestions: ['suggestions'],
    taxonomies: ['taxonomies'],
    hierarchy: ['categoryHierarchy'],
    analytics: (id: string, period?: { start: Date; end: Date }) => ['analytics', id, period],
    performance: (id: string, period?: { start: Date; end: Date }) => ['performance', id, period],
    bulkOperations: ['bulkOperations']
  };

  // Categories query
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => engine.getCategories(activeFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Assignments query
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    error: assignmentsError
  } = useQuery({
    queryKey: QUERY_KEYS.assignments,
    queryFn: () => engine.getAssetAssignments(activeFilters),
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Taxonomies query
  const {
    data: taxonomiesData,
    isLoading: taxonomiesLoading,
    error: taxonomiesError
  } = useQuery({
    queryKey: QUERY_KEYS.taxonomies,
    queryFn: () => engine.getTaxonomies(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });

  // Derived data
  const categories = useMemo(() => {
    return categoriesData?.categories || Object.values(storeCategories) as AssetCategory[];
  }, [categoriesData, storeCategories]);

  const assignments = useMemo(() => {
    return assignmentsData?.assignments || Object.values(storeAssignments) as AssetCategoryAssignment[];
  }, [assignmentsData, storeAssignments]);

  const suggestions = useMemo(() => {
    return Object.values(storeSuggestions) as AssetClassificationSuggestion[];
  }, [storeSuggestions]);

  const taxonomies = useMemo(() => {
    return taxonomiesData || Object.values(storeTaxonomies) as CategoryTaxonomy[];
  }, [taxonomiesData, storeTaxonomies]);

  const isLoading = categoriesLoading || assignmentsLoading || taxonomiesLoading;

  // Category operations
  const createCategoryMutation = useMutation({
    mutationFn: (categoryData: Omit<AssetCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => 
      engine.createCategory(categoryData),
    onMutate: () => setIsCreating(true),
    onSuccess: (newCategory) => {
      addCategory(newCategory);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categoryHierarchy'] });
    },
    onError: (error) => {
      console.error('Error creating category:', error);
    },
    onSettled: () => setIsCreating(false)
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AssetCategory> }) => 
      engine.updateCategory(id, updates),
    onMutate: () => setIsUpdating(true),
    onSuccess: (updatedCategory) => {
      updateCategory(updatedCategory.id, updatedCategory);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categoryHierarchy'] });
    },
    onError: (error) => {
      console.error('Error updating category:', error);
    },
    onSettled: () => setIsUpdating(false)
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => engine.deleteCategory(categoryId),
    onMutate: () => setIsDeleting(true),
    onSuccess: (_, categoryId) => {
      removeCategory(categoryId);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categoryHierarchy'] });
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
    },
    onSettled: () => setIsDeleting(false)
  });

  // Assignment operations
  const assignAssetMutation = useMutation({
    mutationFn: ({ 
      assetSymbol, 
      categoryId, 
      assignment 
    }: { 
      assetSymbol: string; 
      categoryId: string; 
      assignment: Partial<AssetCategoryAssignment> 
    }) => engine.assignAssetToCategory(assetSymbol, categoryId, assignment),
    onSuccess: (newAssignment) => {
      addAssignment(newAssignment);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (error) => {
      console.error('Error assigning asset:', error);
    }
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => engine.removeAssetFromCategory(assignmentId),
    onSuccess: (_, assignmentId) => {
      removeAssignment(assignmentId);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (error) => {
      console.error('Error removing assignment:', error);
    }
  });

  const bulkAssignMutation = useMutation({
    mutationFn: ({ assetSymbols, categoryId }: { assetSymbols: string[]; categoryId: string }) => 
      engine.bulkAssignAssets(assetSymbols, categoryId),
    onSuccess: (newAssignments) => {
      newAssignments.forEach(assignment => addAssignment(assignment));
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (error) => {
      console.error('Error bulk assigning assets:', error);
    }
  });

  // Category hierarchy
  const {
    data: hierarchyData,
    isLoading: hierarchyLoading
  } = useQuery({
    queryKey: QUERY_KEYS.hierarchy,
    queryFn: () => engine.getCategoryHierarchy(),
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Utility functions
  const createCategory = useCallback(
    (category: Omit<AssetCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      return createCategoryMutation.mutateAsync(category);
    },
    [createCategoryMutation]
  );

  const updateCategoryData = useCallback(
    (id: string, updates: Partial<AssetCategory>) => {
      return updateCategoryMutation.mutateAsync({ id, updates });
    },
    [updateCategoryMutation]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      return deleteCategoryMutation.mutateAsync(id);
    },
    [deleteCategoryMutation]
  );

  const assignAssetToCategory = useCallback(
    (assetSymbol: string, categoryId: string, assignment: Partial<AssetCategoryAssignment>) => {
      return assignAssetMutation.mutateAsync({ assetSymbol, categoryId, assignment });
    },
    [assignAssetMutation]
  );

  const removeAssetFromCategory = useCallback(
    (assignmentId: string) => {
      return removeAssignmentMutation.mutateAsync(assignmentId);
    },
    [removeAssignmentMutation]
  );

  const bulkAssignAssets = useCallback(
    (assetSymbols: string[], categoryId: string) => {
      return bulkAssignMutation.mutateAsync({ assetSymbols, categoryId });
    },
    [bulkAssignMutation]
  );

  // Rules and automation
  const createRule = useCallback(
    async (rule: any) => {
      try {
        const newRule = await engine.createRule(rule);
        queryClient.invalidateQueries({ queryKey: ['rules'] });
        return newRule;
      } catch (error) {
        console.error('Error creating rule:', error);
        throw error;
      }
    },
    [engine, queryClient]
  );

  const executeRule = useCallback(
    async (ruleId: string) => {
      try {
        const assignments = await engine.executeRule(ruleId);
        assignments.forEach(assignment => addAssignment(assignment));
        queryClient.invalidateQueries({ queryKey: ['assignments'] });
        return assignments;
      } catch (error) {
        console.error('Error executing rule:', error);
        throw error;
      }
    },
    [engine, addAssignment, queryClient]
  );

  const getSuggestions = useCallback(
    async (assetSymbol: string) => {
      try {
        const suggestion = await engine.getSuggestions(assetSymbol);
        addSuggestion(suggestion);
        return suggestion;
      } catch (error) {
        console.error('Error getting suggestions:', error);
        throw error;
      }
    },
    [engine, addSuggestion]
  );

  // Validation and analysis
  const validateCategory = useCallback(
    async (categoryId: string): Promise<CategoryValidationResult> => {
      try {
        return await engine.validateCategory(categoryId);
      } catch (error) {
        console.error('Error validating category:', error);
        throw error;
      }
    },
    [engine]
  );

  const getCategoryAnalytics = useCallback(
    async (categoryId: string, period?: { start: Date; end: Date }): Promise<CategoryAnalytics> => {
      try {
        return await engine.getCategoryAnalytics(categoryId, period);
      } catch (error) {
        console.error('Error getting analytics:', error);
        throw error;
      }
    },
    [engine]
  );

  const getCategoryPerformance = useCallback(
    async (categoryId: string, period?: { start: Date; end: Date }): Promise<CategoryPerformanceMetrics> => {
      try {
        return await engine.getCategoryPerformance(categoryId, period);
      } catch (error) {
        console.error('Error getting performance:', error);
        throw error;
      }
    },
    [engine]
  );

  // Bulk operations
  const executeBulkOperation = useCallback(
    async (operation: Omit<CategoryBulkOperation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<CategoryBulkOperation> => {
      try {
        const bulkOp = await engine.executeBulkOperation(operation);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulkOperations });
        return bulkOp;
      } catch (error) {
        console.error('Error executing bulk operation:', error);
        throw error;
      }
    },
    [engine, queryClient]
  );

  // Filtering and search
  const filterCategories = useCallback(
    (filter: CategoryFilter) => {
      setActiveFilters(filter);
    },
    [setActiveFilters]
  );

  const filterAssignments = useCallback(
    (filter: AssetAssignmentFilter) => {
      setActiveFilters(filter);
    },
    [setActiveFilters]
  );

  const searchCategories = useCallback(
    (query: string) => {
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  // Hierarchy operations
  const getCategoryHierarchy = useCallback(
    (rootCategoryId?: string): CategoryHierarchyNode[] => {
      if (hierarchyData) {
        if (rootCategoryId) {
          return hierarchyData.filter(node => node.category.id === rootCategoryId);
        }
        return hierarchyData;
      }
      return [];
    },
    [hierarchyData]
  );

  const moveCategory = useCallback(
    async (categoryId: string, newParentId?: string): Promise<AssetCategory> => {
      try {
        const movedCategory = await engine.moveCategory(categoryId, newParentId);
        updateCategory(categoryId, movedCategory);
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['categoryHierarchy'] });
        return movedCategory;
      } catch (error) {
        console.error('Error moving category:', error);
        throw error;
      }
    },
    [engine, updateCategory, queryClient]
  );

  // Import/Export
  const importCategories = useCallback(
    async (template: CategoryImportTemplate, data: any[]): Promise<CategoryBulkOperation> => {
      try {
        const importOp = await engine.importCategories(template, data);
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['categoryHierarchy'] });
        return importOp;
      } catch (error) {
        console.error('Error importing categories:', error);
        throw error;
      }
    },
    [engine, queryClient]
  );

  const exportCategories = useCallback(
    async (categoryIds: string[], format: 'csv' | 'excel' | 'json'): Promise<Blob> => {
      try {
        return await engine.exportCategories(categoryIds, format);
      } catch (error) {
        console.error('Error exporting categories:', error);
        throw error;
      }
    },
    [engine]
  );

  // Error handling
  const error = useMemo(() => {
    const apiError = categoriesError?.message || 
                    assignmentsError?.message || 
                    taxonomiesError?.message;
    
    const storeError = Object.values(errors)[0];
    
    return apiError || storeError || null;
  }, [categoriesError, assignmentsError, taxonomiesError, errors]);

  // Cleanup and refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['assignments'] });
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [isLoading, queryClient]);

  return {
    // Data
    categories,
    assignments,
    suggestions,
    taxonomies,

    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,

    // Operations
    createCategory,
    updateCategory: updateCategoryData,
    deleteCategory,

    // Assignments
    assignAssetToCategory,
    removeAssetFromCategory,
    bulkAssignAssets,

    // Rules and automation
    createRule,
    executeRule,
    getSuggestions,

    // Validation and analysis
    validateCategory,
    getCategoryAnalytics,
    getCategoryPerformance,

    // Bulk operations
    executeBulkOperation,

    // Filtering and search
    filterCategories,
    filterAssignments,
    searchCategories,

    // Hierarchy operations
    getCategoryHierarchy,
    moveCategory,

    // Import/Export
    importCategories,
    exportCategories,

    // Error handling
    error,
    clearError
  };
};

export default useCustomAssetCategories; 