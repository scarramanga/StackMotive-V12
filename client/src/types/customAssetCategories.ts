// Block 73: Custom Asset Categories - Types

export interface AssetCategory {
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Category hierarchy
  parentCategoryId?: string;
  level: number;
  path: string; // e.g., "equity/tech/software"
  
  // Category type and classification
  categoryType: 'sector' | 'geography' | 'asset_class' | 'market_cap' | 'style' | 'custom';
  classification: 'primary' | 'secondary' | 'tertiary';
  
  // Display and UI
  color: string; // hex color code
  icon?: string;
  sortOrder: number;
  
  // Category properties
  isActive: boolean;
  isSystem: boolean;
  isPublic: boolean;
  
  // Risk and performance attributes
  riskScore?: number; // 0-1 scale
  volatilityEstimate?: number;
  expectedReturn?: number;
  correlation?: Record<string, number>;
  
  // Metadata and configuration
  tags: string[];
  metadata: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetCategoryRule {
  id: string;
  categoryId: string;
  
  // Rule definition
  ruleName: string;
  description?: string;
  ruleType: 'automatic' | 'manual' | 'ai_suggested';
  
  // Rule conditions
  conditions: CategoryCondition[];
  operator: 'AND' | 'OR';
  
  // Rule execution
  isActive: boolean;
  priority: number;
  confidence: number; // 0-100
  
  // Performance tracking
  applicationsCount: number;
  successRate: number;
  lastApplied?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryCondition {
  field: string; // e.g., 'symbol', 'sector', 'marketCap', 'name'
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'range' | 'in' | 'not_in';
  value: any;
  weight?: number; // for weighted scoring
}

export interface AssetCategoryAssignment {
  id: string;
  userId: string;
  assetSymbol: string;
  categoryId: string;
  
  // Assignment details
  assignmentType: 'automatic' | 'manual' | 'ai_suggested' | 'inherited';
  confidence: number; // 0-100
  weight: number; // 0-100, for multi-category assignments
  
  // Assignment metadata
  assignedBy: string; // user ID or 'system'
  assignmentReason?: string;
  ruleId?: string; // if assigned by rule
  
  // Status
  isActive: boolean;
  isValidated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  
  // Performance tracking
  performanceScore?: number;
  lastReviewed?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTaxonomy {
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Taxonomy structure
  taxonomyType: 'hierarchical' | 'flat' | 'multi_dimensional';
  maxDepth: number;
  allowMultipleParents: boolean;
  
  // Default category settings
  defaultCategoryType: AssetCategory['categoryType'];
  enforceUniqueNames: boolean;
  
  // Configuration
  isActive: boolean;
  isDefault: boolean;
  
  // Usage statistics
  categoriesCount: number;
  assetsCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryPerformanceMetrics {
  categoryId: string;
  
  // Time period
  periodStart: Date;
  periodEnd: Date;
  
  // Asset metrics
  totalAssets: number;
  totalValue: number;
  avgValue: number;
  
  // Performance metrics
  totalReturn: number;
  avgReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  
  // Risk metrics
  beta: number;
  alpha: number;
  correlationToMarket: number;
  
  // Sector/category specific metrics
  sectorWeight: number;
  relativePerformance: number;
  
  // Additional metrics
  metrics: Record<string, number>;
  
  calculatedAt: Date;
}

export interface CategoryAnalytics {
  categoryId: string;
  
  // Usage analytics
  assignmentCount: number;
  autoAssignmentRate: number;
  manualOverrideRate: number;
  validationRate: number;
  
  // Performance analytics
  avgPerformanceScore: number;
  consistencyScore: number;
  predictionAccuracy: number;
  
  // Trend data
  trendData: {
    date: Date;
    value: number;
    metric: string;
  }[];
  
  // Comparative analytics
  peerComparison: {
    categoryId: string;
    categoryName: string;
    relativePerformance: number;
  }[];
  
  lastUpdated: Date;
}

export interface AssetClassificationSuggestion {
  id: string;
  assetSymbol: string;
  
  // Suggested categories
  suggestions: {
    categoryId: string;
    categoryName: string;
    confidence: number;
    reasoning: string;
    sources: string[];
  }[];
  
  // Analysis metadata
  analysisType: 'rule_based' | 'ml_model' | 'similarity' | 'market_data';
  modelVersion?: string;
  analysisDate: Date;
  
  // Status
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  
  createdAt: Date;
}

export interface CategoryValidationResult {
  categoryId: string;
  
  // Validation checks
  checks: {
    checkType: 'naming_convention' | 'hierarchy_depth' | 'circular_reference' | 'duplicate_assignment' | 'performance_consistency';
    status: 'pass' | 'warning' | 'error';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  
  // Overall status
  overallStatus: 'valid' | 'warning' | 'invalid';
  score: number; // 0-100
  
  // Recommendations
  recommendations: {
    type: 'fix' | 'optimize' | 'review';
    description: string;
    priority: number;
  }[];
  
  validatedAt: Date;
}

export interface CategoryImportTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Template structure
  templateType: 'csv' | 'excel' | 'json' | 'api';
  fieldMappings: Record<string, string>;
  requiredFields: string[];
  optionalFields: string[];
  
  // Import configuration
  duplicateHandling: 'skip' | 'update' | 'merge';
  validationRules: CategoryCondition[];
  
  // Usage tracking
  usageCount: number;
  lastUsed?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryBulkOperation {
  id: string;
  userId: string;
  
  // Operation details
  operationType: 'create' | 'update' | 'delete' | 'assign' | 'validate' | 'import';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  
  // Target data
  targetCategories: string[];
  targetAssets: string[];
  
  // Operation parameters
  parameters: Record<string, any>;
  
  // Progress tracking
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  
  // Results
  results: {
    itemId: string;
    status: 'success' | 'error' | 'skipped';
    message?: string;
  }[];
  
  // Timing
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// Filter and search interfaces
export interface CategoryFilter {
  categoryTypes?: AssetCategory['categoryType'][];
  classifications?: AssetCategory['classification'][];
  isActive?: boolean;
  isSystem?: boolean;
  parentCategoryId?: string;
  level?: number;
  hasAssets?: boolean;
  riskScoreRange?: [number, number];
  tags?: string[];
  searchTerm?: string;
}

export interface AssetAssignmentFilter {
  categoryIds?: string[];
  assetSymbols?: string[];
  assignmentTypes?: AssetCategoryAssignment['assignmentType'][];
  isActive?: boolean;
  isValidated?: boolean;
  confidenceRange?: [number, number];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// API response interfaces
export interface CategoryListResponse {
  categories: AssetCategory[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CategoryAssignmentResponse {
  assignments: AssetCategoryAssignment[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CategoryHierarchyNode {
  category: AssetCategory;
  children: CategoryHierarchyNode[];
  assignmentsCount: number;
  totalValue: number;
  performance?: CategoryPerformanceMetrics;
}

// Hook return types
export interface UseCustomAssetCategoriesReturn {
  // Data
  categories: AssetCategory[];
  assignments: AssetCategoryAssignment[];
  suggestions: AssetClassificationSuggestion[];
  taxonomies: CategoryTaxonomy[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Operations
  createCategory: (category: Omit<AssetCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<AssetCategory>;
  updateCategory: (id: string, updates: Partial<AssetCategory>) => Promise<AssetCategory>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Assignments
  assignAssetToCategory: (assetSymbol: string, categoryId: string, assignment: Partial<AssetCategoryAssignment>) => Promise<AssetCategoryAssignment>;
  removeAssetFromCategory: (assignmentId: string) => Promise<void>;
  bulkAssignAssets: (assetSymbols: string[], categoryId: string) => Promise<AssetCategoryAssignment[]>;
  
  // Rules and automation
  createRule: (rule: Omit<AssetCategoryRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<AssetCategoryRule>;
  executeRule: (ruleId: string) => Promise<AssetCategoryAssignment[]>;
  getSuggestions: (assetSymbol: string) => Promise<AssetClassificationSuggestion>;
  
  // Validation and analysis
  validateCategory: (categoryId: string) => Promise<CategoryValidationResult>;
  getCategoryAnalytics: (categoryId: string, period?: { start: Date; end: Date }) => Promise<CategoryAnalytics>;
  getCategoryPerformance: (categoryId: string, period?: { start: Date; end: Date }) => Promise<CategoryPerformanceMetrics>;
  
  // Bulk operations
  executeBulkOperation: (operation: Omit<CategoryBulkOperation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<CategoryBulkOperation>;
  
  // Filtering and search
  filterCategories: (filter: CategoryFilter) => void;
  filterAssignments: (filter: AssetAssignmentFilter) => void;
  searchCategories: (query: string) => void;
  
  // Hierarchy operations
  getCategoryHierarchy: (rootCategoryId?: string) => CategoryHierarchyNode[];
  moveCategory: (categoryId: string, newParentId?: string) => Promise<AssetCategory>;
  
  // Import/Export
  importCategories: (template: CategoryImportTemplate, data: any[]) => Promise<CategoryBulkOperation>;
  exportCategories: (categoryIds: string[], format: 'csv' | 'excel' | 'json') => Promise<Blob>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Store state interface
export interface CustomAssetCategoriesState {
  // Data
  categories: Record<string, AssetCategory>;
  assignments: Record<string, AssetCategoryAssignment>;
  rules: Record<string, AssetCategoryRule>;
  suggestions: Record<string, AssetClassificationSuggestion>;
  taxonomies: Record<string, CategoryTaxonomy>;
  analytics: Record<string, CategoryAnalytics>;
  performanceMetrics: Record<string, CategoryPerformanceMetrics>;
  bulkOperations: Record<string, CategoryBulkOperation>;
  
  // UI state
  selectedCategoryId: string | null;
  expandedCategories: Set<string>;
  activeFilters: CategoryFilter;
  searchQuery: string;
  viewMode: 'list' | 'hierarchy' | 'grid';
  
  // Loading states
  loadingStates: Record<string, boolean>;
  
  // Cache management
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Error handling
  errors: Record<string, string>;
}

export default AssetCategory; 