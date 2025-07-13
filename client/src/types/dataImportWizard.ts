// Block 74: Data Import Wizard - Types

export interface ImportWizardStep {
  id: string;
  name: string;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  isCompleted: boolean;
  canSkip: boolean;
  estimatedTime: number; // in minutes
  dependencies: string[]; // step IDs that must be completed first
  validation: StepValidation;
}

export interface StepValidation {
  rules: ValidationRule[];
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule {
  id: string;
  type: 'required' | 'format' | 'range' | 'custom';
  field: string;
  condition: any;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface DataImportWizard {
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Wizard configuration
  wizardType: 'portfolio' | 'transactions' | 'assets' | 'categories' | 'custom';
  templateId?: string;
  
  // Current state
  currentStepId: string;
  status: 'draft' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  
  // Steps configuration
  steps: ImportWizardStep[];
  completedSteps: string[];
  
  // Data and results
  sourceData: ImportSourceData;
  processedData: ProcessedData;
  importResults: ImportResults;
  
  // Settings
  settings: WizardSettings;
  
  // Timing
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportSourceData {
  dataType: 'file' | 'api' | 'manual' | 'clipboard';
  source: FileSource | ApiSource | ManualSource | ClipboardSource;
  rawData: any[];
  metadata: DataMetadata;
}

export interface FileSource {
  file: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  encoding?: string;
  delimiter?: string; // for CSV files
  sheetName?: string; // for Excel files
  hasHeaders: boolean;
}

export interface ApiSource {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT';
  headers: Record<string, string>;
  authentication: ApiAuthentication;
  parameters: Record<string, any>;
  responseFormat: 'json' | 'xml' | 'csv';
}

export interface ApiAuthentication {
  type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth';
  credentials: Record<string, string>;
}

export interface ManualSource {
  inputMethod: 'form' | 'table' | 'text';
  schema: DataSchema;
}

export interface ClipboardSource {
  format: 'text' | 'csv' | 'json';
  delimiter?: string;
  hasHeaders: boolean;
}

export interface DataMetadata {
  totalRows: number;
  totalColumns: number;
  columnNames: string[];
  columnTypes: Record<string, string>;
  sampleData: any[][];
  duplicateRows: number;
  emptyRows: number;
  dataQuality: DataQuality;
}

export interface DataQuality {
  completeness: number; // 0-100
  accuracy: number; // 0-100
  consistency: number; // 0-100
  validity: number; // 0-100
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: 'missing_data' | 'invalid_format' | 'duplicate' | 'inconsistent' | 'outlier';
  field: string;
  rowIndex: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix?: string;
}

export interface DataSchema {
  fields: SchemaField[];
  primaryKey?: string;
  relationships: SchemaRelationship[];
  validation: SchemaValidation;
}

export interface SchemaField {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'phone' | 'currency';
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: any;
  validation: FieldValidation;
  transformation: FieldTransformation;
  mapping: FieldMapping;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
  customValidator?: string;
}

export interface FieldTransformation {
  type: 'none' | 'uppercase' | 'lowercase' | 'trim' | 'format' | 'calculate' | 'lookup' | 'custom';
  parameters?: Record<string, any>;
  expression?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  mappingType: 'direct' | 'transform' | 'calculate' | 'lookup' | 'default';
  mappingRule?: MappingRule;
}

export interface MappingRule {
  type: 'value' | 'expression' | 'lookup' | 'conditional';
  rule: any;
  fallback?: any;
}

export interface SchemaRelationship {
  type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
  sourceField: string;
  targetTable: string;
  targetField: string;
  cascadeAction: 'none' | 'update' | 'delete';
}

export interface SchemaValidation {
  rules: ValidationRule[];
  crossFieldValidation: CrossFieldValidation[];
}

export interface CrossFieldValidation {
  fields: string[];
  rule: string; // expression
  message: string;
}

export interface ProcessedData {
  validatedData: ValidatedRecord[];
  transformedData: TransformedRecord[];
  mappedData: MappedRecord[];
  statistics: ProcessingStatistics;
}

export interface ValidatedRecord {
  rowIndex: number;
  data: Record<string, any>;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  expectedType?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: any;
  suggestion?: string;
}

export interface TransformedRecord {
  rowIndex: number;
  originalData: Record<string, any>;
  transformedData: Record<string, any>;
  transformations: AppliedTransformation[];
}

export interface AppliedTransformation {
  field: string;
  type: string;
  originalValue: any;
  transformedValue: any;
  success: boolean;
  error?: string;
}

export interface MappedRecord {
  rowIndex: number;
  sourceData: Record<string, any>;
  targetData: Record<string, any>;
  mappings: AppliedMapping[];
}

export interface AppliedMapping {
  sourceField: string;
  targetField: string;
  sourceValue: any;
  targetValue: any;
  mappingType: string;
  success: boolean;
  error?: string;
}

export interface ProcessingStatistics {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  transformedRecords: number;
  mappedRecords: number;
  duplicateRecords: number;
  skippedRecords: number;
  processingTime: number; // in milliseconds
}

export interface ImportResults {
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial';
  summary: ImportSummary;
  details: ImportDetail[];
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportSummary {
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  skippedRecords: number;
  duplicatesHandled: number;
  newRecordsCreated: number;
  existingRecordsUpdated: number;
  importTime: number; // in milliseconds
}

export interface ImportDetail {
  rowIndex: number;
  status: 'success' | 'failed' | 'skipped' | 'updated';
  recordId?: string;
  data: Record<string, any>;
  message?: string;
}

export interface ImportError {
  type: 'validation' | 'transformation' | 'mapping' | 'database' | 'permission' | 'system';
  rowIndex?: number;
  field?: string;
  message: string;
  originalValue?: any;
  expectedValue?: any;
  errorCode?: string;
}

export interface ImportWarning {
  type: 'data_quality' | 'performance' | 'best_practice' | 'compatibility';
  rowIndex?: number;
  field?: string;
  message: string;
  suggestion?: string;
}

export interface WizardSettings {
  // Validation settings
  strictValidation: boolean;
  stopOnFirstError: boolean;
  maxErrorsAllowed: number;
  
  // Processing settings
  batchSize: number;
  parallelProcessing: boolean;
  
  // Duplicate handling
  duplicateHandling: 'skip' | 'update' | 'create_new' | 'ask';
  duplicateDetectionFields: string[];
  
  // Import settings
  createMissingFields: boolean;
  backupBeforeImport: boolean;
  rollbackOnFailure: boolean;
  
  // Notification settings
  notifyOnCompletion: boolean;
  notifyOnErrors: boolean;
  emailNotifications: string[];
  
  // Advanced settings
  customValidators: CustomValidator[];
  customTransformers: CustomTransformer[];
  hooks: ImportHook[];
}

export interface CustomValidator {
  id: string;
  name: string;
  description: string;
  function: string; // JavaScript function as string
  parameters: Record<string, any>;
}

export interface CustomTransformer {
  id: string;
  name: string;
  description: string;
  function: string; // JavaScript function as string
  parameters: Record<string, any>;
}

export interface ImportHook {
  id: string;
  name: string;
  event: 'before_validation' | 'after_validation' | 'before_transform' | 'after_transform' | 'before_import' | 'after_import';
  function: string; // JavaScript function as string
  parameters: Record<string, any>;
  isActive: boolean;
}

export interface ImportTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Template configuration
  templateType: 'portfolio' | 'transactions' | 'assets' | 'categories' | 'custom';
  category: string;
  
  // Template structure
  schema: DataSchema;
  steps: ImportWizardStep[];
  settings: WizardSettings;
  
  // Template properties
  isPublic: boolean;
  isSystem: boolean;
  isActive: boolean;
  
  // Usage tracking
  usageCount: number;
  rating: number;
  reviews: TemplateReview[];
  
  // Template metadata
  tags: string[];
  version: string;
  changelog: TemplateVersion[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateReview {
  id: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

export interface TemplateVersion {
  version: string;
  changes: string[];
  author: string;
  date: Date;
}

export interface ImportHistory {
  id: string;
  userId: string;
  wizardId: string;
  
  // Import details
  importType: string;
  sourceFile?: string;
  recordsProcessed: number;
  recordsImported: number;
  
  // Results
  success: boolean;
  duration: number; // in milliseconds
  errorCount: number;
  warningCount: number;
  
  // Metadata
  metadata: Record<string, any>;
  
  createdAt: Date;
}

// Filter and search interfaces
export interface WizardFilter {
  status?: DataImportWizard['status'][];
  wizardType?: DataImportWizard['wizardType'][];
  templateId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasErrors?: boolean;
  searchTerm?: string;
}

export interface TemplateFilter {
  templateType?: ImportTemplate['templateType'][];
  category?: string[];
  isPublic?: boolean;
  isSystem?: boolean;
  rating?: number;
  tags?: string[];
  searchTerm?: string;
}

// API response interfaces
export interface WizardListResponse {
  wizards: DataImportWizard[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TemplateListResponse {
  templates: ImportTemplate[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ImportProgressResponse {
  wizardId: string;
  currentStep: string;
  progress: number;
  status: string;
  message?: string;
  errors: ImportError[];
  warnings: ImportWarning[];
}

// Hook return types
export interface UseDataImportWizardReturn {
  // Data
  wizards: DataImportWizard[];
  templates: ImportTemplate[];
  currentWizard: DataImportWizard | null;
  importHistory: ImportHistory[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isProcessing: boolean;
  isImporting: boolean;
  
  // Wizard operations
  createWizard: (config: Omit<DataImportWizard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<DataImportWizard>;
  updateWizard: (id: string, updates: Partial<DataImportWizard>) => Promise<DataImportWizard>;
  deleteWizard: (id: string) => Promise<void>;
  cloneWizard: (id: string) => Promise<DataImportWizard>;
  
  // Step navigation
  goToStep: (stepId: string) => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  completeStep: (stepId: string, data: any) => Promise<void>;
  
  // Data processing
  uploadFile: (file: File) => Promise<ImportSourceData>;
  validateData: (data: any[], schema: DataSchema) => Promise<ValidatedRecord[]>;
  transformData: (data: ValidatedRecord[], transformations: FieldTransformation[]) => Promise<TransformedRecord[]>;
  mapData: (data: TransformedRecord[], mappings: FieldMapping[]) => Promise<MappedRecord[]>;
  
  // Import execution
  executeImport: (wizardId: string) => Promise<ImportResults>;
  cancelImport: (wizardId: string) => Promise<void>;
  getImportProgress: (wizardId: string) => Promise<ImportProgressResponse>;
  
  // Template operations
  createTemplate: (template: Omit<ImportTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<ImportTemplate>;
  updateTemplate: (id: string, updates: Partial<ImportTemplate>) => Promise<ImportTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  useTemplate: (templateId: string) => Promise<DataImportWizard>;
  
  // Validation and preview
  previewImport: (wizardId: string) => Promise<ImportDetail[]>;
  validateSchema: (schema: DataSchema) => Promise<SchemaValidation>;
  detectSchema: (data: any[]) => Promise<DataSchema>;
  
  // Filtering and search
  filterWizards: (filter: WizardFilter) => void;
  filterTemplates: (filter: TemplateFilter) => void;
  searchWizards: (query: string) => void;
  searchTemplates: (query: string) => void;
  
  // Export and reporting
  exportResults: (wizardId: string, format: 'csv' | 'excel' | 'json') => Promise<Blob>;
  generateReport: (wizardId: string) => Promise<string>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Store state interface
export interface DataImportWizardState {
  // Data
  wizards: Record<string, DataImportWizard>;
  templates: Record<string, ImportTemplate>;
  importHistory: Record<string, ImportHistory>;
  
  // Current wizard state
  currentWizardId: string | null;
  currentStepId: string | null;
  
  // UI state
  activeFilters: WizardFilter;
  templateFilters: TemplateFilter;
  searchQuery: string;
  selectedWizardIds: string[];
  
  // Processing state
  processingSteps: Record<string, boolean>;
  importProgress: Record<string, number>;
  
  // Cache management
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Error handling
  errors: Record<string, string>;
}

export default DataImportWizard; 