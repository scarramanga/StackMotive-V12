// Block 12: Snapshot Exporter - Types
// Export dashboard states and configurations as snapshots

export interface DashboardSnapshot {
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Snapshot content
  dashboardConfig: DashboardConfig;
  portfolioState: PortfolioState;
  widgetStates: WidgetState[];
  
  // Export settings
  exportFormat: SnapshotFormat;
  includeData: boolean;
  includeImages: boolean;
  
  // Metadata
  createdAt: Date;
  expiresAt?: Date;
  version: string;
  tags: string[];
  
  // File information
  fileInfo?: SnapshotFileInfo;
  
  // Sharing
  isPublic: boolean;
  shareableLink?: string;
}

export interface DashboardConfig {
  layout: LayoutConfig;
  theme: string;
  colorScheme: string;
  fontSize: number;
  density: 'compact' | 'normal' | 'comfortable';
  widgets: string[];
  customizations: Record<string, any>;
}

export interface PortfolioState {
  selectedVault?: string;
  timeframe: string;
  filters: PortfolioFilters;
  sortBy: string;
  groupBy: string;
  displayMode: 'table' | 'cards' | 'chart';
}

export interface PortfolioFilters {
  assetClasses: string[];
  minValue?: number;
  maxValue?: number;
  tags: string[];
  brokers: string[];
  showHidden: boolean;
}

export interface WidgetState {
  widgetId: string;
  widgetType: string;
  position: Position;
  size: Size;
  configuration: Record<string, any>;
  data?: any;
  isVisible: boolean;
  isLocked: boolean;
}

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface Size {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface LayoutConfig {
  type: 'grid' | 'flex' | 'absolute';
  columns: number;
  rows: number;
  gap: number;
  padding: number;
  breakpoints: Record<string, LayoutBreakpoint>;
}

export interface LayoutBreakpoint {
  minWidth: number;
  columns: number;
  margin: number;
  padding: number;
}

export type SnapshotFormat = 'json' | 'image' | 'both';

export interface SnapshotFileInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  downloadExpiry: Date;
  downloadCount: number;
  thumbnailUrl?: string;
}

export interface SnapshotExportRequest {
  snapshotId: string;
  format: SnapshotFormat;
  includeData: boolean;
  includeImages: boolean;
  imageDPI?: number;
  imageFormat?: 'png' | 'jpg' | 'svg';
  compression?: boolean;
}

export interface SnapshotImportRequest {
  file: File;
  replaceExisting: boolean;
  mergeDashboards: boolean;
  preserveIds: boolean;
}

export interface SnapshotTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  config: DashboardConfig;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  createdBy: string;
  createdAt: Date;
}

export interface SnapshotComparison {
  snapshotA: DashboardSnapshot;
  snapshotB: DashboardSnapshot;
  differences: SnapshotDifference[];
  similarity: number;
}

export interface SnapshotDifference {
  type: 'added' | 'removed' | 'modified';
  path: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

export interface SnapshotStats {
  totalSnapshots: number;
  totalSize: number;
  formatBreakdown: Record<SnapshotFormat, number>;
  mostUsedWidgets: Array<{widgetType: string, count: number}>;
  averageWidgetCount: number;
  creationTrend: Array<{date: string, count: number}>;
}

export interface SnapshotSettings {
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  maxSnapshots: number;
  defaultFormat: SnapshotFormat;
  includeDataByDefault: boolean;
  includeImagesByDefault: boolean;
  compressionEnabled: boolean;
  retentionDays: number;
}

export interface SnapshotState {
  snapshots: DashboardSnapshot[];
  templates: SnapshotTemplate[];
  currentSnapshot: DashboardSnapshot | null;
  selectedSnapshotIds: string[];
  
  // UI state
  isExporting: boolean;
  isImporting: boolean;
  exportProgress: number;
  importProgress: number;
  
  // Filters
  filters: SnapshotFilters;
  sortBy: 'name' | 'createdAt' | 'size';
  sortOrder: 'asc' | 'desc';
  
  // Settings
  settings: SnapshotSettings;
  
  // Error handling
  error: string | null;
  isLoading: boolean;
}

export interface SnapshotFilters {
  formats: SnapshotFormat[];
  dateFrom?: Date;
  dateTo?: Date;
  tags: string[];
  searchQuery: string;
  isPublic?: boolean;
  hasData?: boolean;
  hasImages?: boolean;
}

export interface SnapshotActions {
  createSnapshot: (config: Omit<DashboardSnapshot, 'id' | 'userId' | 'createdAt'>) => Promise<DashboardSnapshot>;
  updateSnapshot: (id: string, updates: Partial<DashboardSnapshot>) => Promise<DashboardSnapshot>;
  deleteSnapshot: (id: string) => Promise<boolean>;
  exportSnapshot: (request: SnapshotExportRequest) => Promise<SnapshotFileInfo>;
  importSnapshot: (request: SnapshotImportRequest) => Promise<DashboardSnapshot[]>;
  duplicateSnapshot: (id: string, newName?: string) => Promise<DashboardSnapshot>;
  shareSnapshot: (id: string, isPublic: boolean) => Promise<string>;
  compareSnapshots: (idA: string, idB: string) => Promise<SnapshotComparison>;
  applySnapshot: (id: string) => Promise<boolean>;
  createTemplate: (snapshotId: string, templateName: string) => Promise<SnapshotTemplate>;
  getSnapshotStats: () => Promise<SnapshotStats>;
  updateSettings: (settings: Partial<SnapshotSettings>) => Promise<void>;
  cleanupExpired: () => Promise<number>;
  searchSnapshots: (query: string) => Promise<DashboardSnapshot[]>;
}

// Hook return type
export interface UseSnapshotExporterReturn {
  // State
  snapshots: DashboardSnapshot[];
  templates: SnapshotTemplate[];
  currentSnapshot: DashboardSnapshot | null;
  selectedSnapshots: DashboardSnapshot[];
  settings: SnapshotSettings;
  
  // Loading states
  isLoading: boolean;
  isExporting: boolean;
  isImporting: boolean;
  exportProgress: number;
  importProgress: number;
  
  // Error handling
  error: string | null;
  
  // Actions
  createSnapshot: (config: Omit<DashboardSnapshot, 'id' | 'userId' | 'createdAt'>) => Promise<DashboardSnapshot>;
  updateSnapshot: (id: string, updates: Partial<DashboardSnapshot>) => Promise<DashboardSnapshot>;
  deleteSnapshot: (id: string) => Promise<boolean>;
  exportSnapshot: (request: SnapshotExportRequest) => Promise<SnapshotFileInfo>;
  importSnapshot: (request: SnapshotImportRequest) => Promise<DashboardSnapshot[]>;
  duplicateSnapshot: (id: string, newName?: string) => Promise<DashboardSnapshot>;
  shareSnapshot: (id: string, isPublic: boolean) => Promise<string>;
  compareSnapshots: (idA: string, idB: string) => Promise<SnapshotComparison>;
  applySnapshot: (id: string) => Promise<boolean>;
  createTemplate: (snapshotId: string, templateName: string) => Promise<SnapshotTemplate>;
  
  // Utilities
  getSnapshotStats: () => Promise<SnapshotStats>;
  updateSettings: (settings: Partial<SnapshotSettings>) => Promise<void>;
  cleanupExpired: () => Promise<number>;
  searchSnapshots: (query: string) => Promise<DashboardSnapshot[]>;
  filterSnapshots: (filters: SnapshotFilters) => DashboardSnapshot[];
  sortSnapshots: (snapshots: DashboardSnapshot[], sortBy: string, order: 'asc' | 'desc') => DashboardSnapshot[];
} 