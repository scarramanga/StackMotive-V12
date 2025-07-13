// Block 34: Central Logging Dashboard - Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogCategory = 
  | 'system' 
  | 'user_action' 
  | 'api' 
  | 'error' 
  | 'gpt' 
  | 'signals' 
  | 'trading' 
  | 'auth' 
  | 'data' 
  | 'performance'
  | 'security'
  | 'notifications';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  source: string;
  userId?: string;
  sessionId?: string;
  tags: string[];
}

export interface LogFilter {
  levels?: LogLevel[];
  categories?: LogCategory[];
  sources?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  sessionId?: string;
  tags?: string[];
  searchQuery?: string;
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<LogCategory, number>;
  recentCount: number; // Last 24 hours
  weeklyCount: number; // Last 7 days
  errorRate: number; // Percentage of errors
  oldestEntry: number | null;
  newestEntry: number | null;
  topSources: Array<{source: string, count: number}>;
  frequentErrors: Array<{message: string, count: number}>;
}

export interface LogState {
  logs: LogEntry[];
  filter: LogFilter;
  selectedLogs: string[];
  sortBy: 'timestamp' | 'level' | 'category' | 'source';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
  autoRefresh: boolean;
  refreshInterval: number; // milliseconds
}

export interface LogExport {
  timestamp: Date;
  format: 'json' | 'csv';
  count: number;
  data: LogEntry[] | string;
}

export interface LogActions {
  log: (level: LogLevel, category: LogCategory, message: string, data?: any, source?: string, userId?: string) => LogEntry;
  debug: (category: LogCategory, message: string, data?: any, source?: string) => LogEntry;
  info: (category: LogCategory, message: string, data?: any, source?: string) => LogEntry;
  warn: (category: LogCategory, message: string, data?: any, source?: string) => LogEntry;
  error: (category: LogCategory, message: string, data?: any, source?: string) => LogEntry;
  filterLogs: (filter: LogFilter) => LogEntry[];
  searchLogs: (query: string) => LogEntry[];
  clearLogs: (filter?: LogFilter) => number;
  exportLogs: (filter?: LogFilter, format?: 'json' | 'csv') => LogExport;
  getLogStats: () => LogStats;
  trackUserAction: (action: string, data?: any, userId?: string) => LogEntry;
  trackAPICall: (endpoint: string, method: string, status: number, duration: number, data?: any) => LogEntry;
  trackError: (error: Error, context?: any, source?: string) => LogEntry;
  trackGPTInteraction: (prompt: string, response: string, model?: string, tokens?: number) => LogEntry;
  trackSignal: (signalType: string, symbol: string, confidence: number, data?: any) => LogEntry;
  trackTrade: (action: string, symbol: string, quantity: number, price: number, data?: any) => LogEntry;
}

export interface LogSettings {
  maxLogEntries: number;
  retentionPeriod: number; // milliseconds
  autoCleanup: boolean;
  logLevels: LogLevel[];
  enabledCategories: LogCategory[];
  enableNotifications: boolean;
  enableExport: boolean;
}

export interface LogQuery {
  filter: LogFilter;
  pagination: {
    page: number;
    pageSize: number;
  };
  sort: {
    field: keyof LogEntry;
    order: 'asc' | 'desc';
  };
}

export interface LogSearchResult {
  logs: LogEntry[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

export interface LogAlert {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    level?: LogLevel;
    category?: LogCategory;
    source?: string;
    messagePattern?: string;
    frequency?: {
      count: number;
      timeWindow: number; // milliseconds
    };
  };
  actions: {
    notify?: boolean;
    email?: string[];
    webhook?: string;
  };
  createdAt: Date;
  lastTriggered?: Date;
}

export interface LogMetrics {
  timestamp: Date;
  period: 'hour' | 'day' | 'week' | 'month';
  data: {
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    infoCount: number;
    debugCount: number;
    averageLogsPerMinute: number;
    topErrors: Array<{message: string, count: number}>;
    topSources: Array<{source: string, count: number}>;
  };
} 