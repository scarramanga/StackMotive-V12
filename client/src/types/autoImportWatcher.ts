// Block 19: Auto Import Watcher - Types
// Automated file watching and import system

export interface WatcherConfig {
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Watch settings
  watchPath: string;
  filePattern: string;
  recursive: boolean;
  enabled: boolean;
  
  // Import settings
  importType: ImportType;
  fileFormat: FileFormat;
  mappingTemplate: string;
  autoProcess: boolean;
  requireConfirmation: boolean;
  
  // Processing options
  processingRules: ProcessingRule[];
  errorHandling: ErrorHandlingConfig;
  notifications: NotificationConfig;
  
  // Schedule
  schedule?: ScheduleConfig;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  isActive: boolean;
}

export type ImportType = 'portfolio' | 'trades' | 'prices' | 'dividends' | 'balances';
export type FileFormat = 'csv' | 'json' | 'xml' | 'xlsx' | 'txt';
export type WatchEventType = 'created' | 'modified' | 'deleted' | 'moved';

export interface WatchEvent {
  id: string;
  watcherId: string;
  eventType: WatchEventType;
  filePath: string;
  fileName: string;
  fileSize: number;
  timestamp: Date;
  processed: boolean;
  error?: string;
}

export interface ProcessingRule {
  id: string;
  name: string;
  condition: RuleCondition;
  action: RuleAction;
  enabled: boolean;
  priority: number;
}

export interface RuleCondition {
  type: 'file_name' | 'file_size' | 'file_age' | 'content_pattern';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'regex';
  value: string | number;
}

export interface RuleAction {
  type: 'import' | 'move' | 'copy' | 'delete' | 'rename' | 'notify';
  parameters: Record<string, any>;
}

export interface ErrorHandlingConfig {
  onError: 'stop' | 'continue' | 'retry';
  maxRetries: number;
  retryDelay: number; // seconds
  notifyOnError: boolean;
  logErrors: boolean;
  quarantineFolder?: string;
}

export interface NotificationConfig {
  onSuccess: boolean;
  onError: boolean;
  onFileDetected: boolean;
  email: boolean;
  inApp: boolean;
  webhook?: string;
}

export interface ScheduleConfig {
  enabled: boolean;
  type: 'interval' | 'cron';
  interval?: number; // minutes
  cronExpression?: string;
  timezone: string;
}

export interface ImportJob {
  id: string;
  watcherId: string;
  eventId: string;
  filePath: string;
  
  // Job status
  status: JobStatus;
  startedAt: Date;
  completedAt?: Date;
  
  // Processing details
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  
  // Results
  results: ImportResult[];
  errors: ImportError[];
  
  // Metadata
  processingTime: number; // milliseconds
  fileHash: string;
  originalFileName: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ImportResult {
  rowNumber: number;
  recordId?: string;
  action: 'created' | 'updated' | 'skipped';
  data: Record<string, any>;
  warnings: string[];
}

export interface ImportError {
  rowNumber: number;
  error: string;
  data: Record<string, any>;
}

export interface FileMapping {
  id: string;
  name: string;
  description: string;
  fileFormat: FileFormat;
  importType: ImportType;
  
  // Column mappings
  columnMappings: ColumnMapping[];
  
  // Transformation rules
  transformations: TransformationRule[];
  
  // Validation rules
  validations: ValidationRule[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isSystem: boolean;
  usageCount: number;
}

export interface ColumnMapping {
  sourceColumn: string | number;
  targetField: string;
  required: boolean;
  defaultValue?: any;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

export interface TransformationRule {
  id: string;
  targetField: string;
  type: 'format' | 'calculate' | 'lookup' | 'conditional';
  parameters: Record<string, any>;
}

export interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  parameters: Record<string, any>;
  message: string;
}

export interface WatcherStats {
  totalWatchers: number;
  activeWatchers: number;
  totalEvents: number;
  eventsToday: number;
  successfulImports: number;
  failedImports: number;
  totalProcessedFiles: number;
  averageProcessingTime: number;
  errorRate: number;
  topErrorMessages: Array<{message: string, count: number}>;
}

export interface WatcherSettings {
  globalEnabled: boolean;
  maxConcurrentJobs: number;
  defaultRetryAttempts: number;
  cleanupOldEventsAfterDays: number;
  enableFileHashing: boolean;
  duplicateHandling: 'skip' | 'overwrite' | 'rename';
  notificationDefaults: NotificationConfig;
  watchPathValidation: boolean;
  autoCreateDirectories: boolean;
}

export interface AutoImportWatcherState {
  watchers: WatcherConfig[];
  events: WatchEvent[];
  jobs: ImportJob[];
  mappings: FileMapping[];
  
  // Current selections
  selectedWatcherId: string | null;
  selectedEventIds: string[];
  selectedJobIds: string[];
  
  // UI state
  isWatching: boolean;
  isProcessing: boolean;
  
  // Filters
  watcherFilter: WatcherFilter;
  eventFilter: EventFilter;
  jobFilter: JobFilter;
  
  // Settings
  settings: WatcherSettings;
  
  // Error handling
  error: string | null;
  isLoading: boolean;
}

export interface WatcherFilter {
  enabled?: boolean;
  importType?: ImportType;
  searchQuery: string;
  hasErrors?: boolean;
  lastTriggered?: {
    from: Date;
    to: Date;
  };
}

export interface EventFilter {
  watcherId?: string;
  eventType?: WatchEventType;
  processed?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchQuery: string;
}

export interface JobFilter {
  watcherId?: string;
  status?: JobStatus;
  dateRange?: {
    from: Date;
    to: Date;
  };
  hasErrors?: boolean;
  searchQuery: string;
}

export interface AutoImportWatcherActions {
  // Watcher management
  createWatcher: (config: Omit<WatcherConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<WatcherConfig>;
  updateWatcher: (id: string, updates: Partial<WatcherConfig>) => Promise<WatcherConfig>;
  deleteWatcher: (id: string) => Promise<boolean>;
  enableWatcher: (id: string) => Promise<boolean>;
  disableWatcher: (id: string) => Promise<boolean>;
  
  // Event handling
  processEvent: (eventId: string) => Promise<ImportJob>;
  reprocessEvent: (eventId: string) => Promise<ImportJob>;
  ignoreEvent: (eventId: string) => Promise<boolean>;
  
  // Job management
  getJob: (jobId: string) => Promise<ImportJob>;
  cancelJob: (jobId: string) => Promise<boolean>;
  retryJob: (jobId: string) => Promise<ImportJob>;
  
  // File mapping
  createMapping: (mapping: Omit<FileMapping, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<FileMapping>;
  updateMapping: (id: string, updates: Partial<FileMapping>) => Promise<FileMapping>;
  deleteMapping: (id: string) => Promise<boolean>;
  testMapping: (mappingId: string, filePath: string) => Promise<ImportResult[]>;
  
  // Statistics and monitoring
  getWatcherStats: () => Promise<WatcherStats>;
  getWatcherHealth: (watcherId: string) => Promise<{healthy: boolean, issues: string[]}>;
  
  // Settings
  updateSettings: (settings: Partial<WatcherSettings>) => Promise<void>;
  
  // Utility functions
  validateWatchPath: (path: string) => Promise<{valid: boolean, error?: string}>;
  previewFile: (filePath: string, mappingId: string) => Promise<{preview: any[], errors: string[]}>;
  exportConfig: (watcherId: string) => Promise<string>;
  importConfig: (configData: string) => Promise<WatcherConfig>;
}

// Hook return type
export interface UseAutoImportWatcherReturn {
  // State
  watchers: WatcherConfig[];
  events: WatchEvent[];
  jobs: ImportJob[];
  mappings: FileMapping[];
  settings: WatcherSettings;
  
  // Current selections
  selectedWatcher: WatcherConfig | null;
  selectedEvents: WatchEvent[];
  selectedJobs: ImportJob[];
  
  // Status
  isWatching: boolean;
  isProcessing: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createWatcher: (config: Omit<WatcherConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<WatcherConfig>;
  updateWatcher: (id: string, updates: Partial<WatcherConfig>) => Promise<WatcherConfig>;
  deleteWatcher: (id: string) => Promise<boolean>;
  enableWatcher: (id: string) => Promise<boolean>;
  disableWatcher: (id: string) => Promise<boolean>;
  
  processEvent: (eventId: string) => Promise<ImportJob>;
  reprocessEvent: (eventId: string) => Promise<ImportJob>;
  ignoreEvent: (eventId: string) => Promise<boolean>;
  
  getJob: (jobId: string) => Promise<ImportJob>;
  cancelJob: (jobId: string) => Promise<boolean>;
  retryJob: (jobId: string) => Promise<ImportJob>;
  
  createMapping: (mapping: Omit<FileMapping, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<FileMapping>;
  updateMapping: (id: string, updates: Partial<FileMapping>) => Promise<FileMapping>;
  deleteMapping: (id: string) => Promise<boolean>;
  testMapping: (mappingId: string, filePath: string) => Promise<ImportResult[]>;
  
  // Utilities
  getWatcherStats: () => Promise<WatcherStats>;
  updateSettings: (settings: Partial<WatcherSettings>) => Promise<void>;
  validateWatchPath: (path: string) => Promise<{valid: boolean, error?: string}>;
  previewFile: (filePath: string, mappingId: string) => Promise<{preview: any[], errors: string[]}>;
} 