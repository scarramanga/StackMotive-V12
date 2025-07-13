// Block 34: Central Logging Dashboard - Engine
import { 
  LogEntry, 
  LogLevel, 
  LogCategory,
  LogFilter,
  LogStats,
  LogExport
} from '../types/logging';

export class CentralLoggingEngine {
  private logs: Map<string, LogEntry> = new Map();
  private maxLogEntries: number = 10000;
  private retentionPeriod: number = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Add a log entry
   */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    source?: string,
    userId?: string
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      source: source || 'system',
      userId,
      tags: this.extractTags(message, data),
      sessionId: this.getCurrentSessionId()
    };

    this.logs.set(entry.id, entry);
    this.cleanup();
    
    // Also trigger notification for high-level logs
    if (level === 'error' || level === 'warn') {
      this.triggerNotification(entry);
    }

    return entry;
  }

  /**
   * Log convenience methods
   */
  debug(category: LogCategory, message: string, data?: any, source?: string): LogEntry {
    return this.log('debug', category, message, data, source);
  }

  info(category: LogCategory, message: string, data?: any, source?: string): LogEntry {
    return this.log('info', category, message, data, source);
  }

  warn(category: LogCategory, message: string, data?: any, source?: string): LogEntry {
    return this.log('warn', category, message, data, source);
  }

  error(category: LogCategory, message: string, data?: any, source?: string): LogEntry {
    return this.log('error', category, message, data, source);
  }

  /**
   * Get all logs
   */
  getAllLogs(): LogEntry[] {
    return Array.from(this.logs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get logs by filter
   */
  filterLogs(filter: LogFilter): LogEntry[] {
    let filtered = this.getAllLogs();

    if (filter.levels && filter.levels.length > 0) {
      filtered = filtered.filter(log => filter.levels!.includes(log.level));
    }

    if (filter.categories && filter.categories.length > 0) {
      filtered = filtered.filter(log => filter.categories!.includes(log.category));
    }

    if (filter.sources && filter.sources.length > 0) {
      filtered = filtered.filter(log => filter.sources!.includes(log.source));
    }

    if (filter.dateFrom) {
      filtered = filtered.filter(log => log.timestamp >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      filtered = filtered.filter(log => log.timestamp <= filter.dateTo!);
    }

    if (filter.userId) {
      filtered = filtered.filter(log => log.userId === filter.userId);
    }

    if (filter.sessionId) {
      filtered = filtered.filter(log => log.sessionId === filter.sessionId);
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(log => 
        filter.tags!.some(tag => log.tags.includes(tag))
      );
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  /**
   * Search logs
   */
  searchLogs(query: string): LogEntry[] {
    return this.filterLogs({ searchQuery: query });
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.filterLogs({ levels: [level] });
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.filterLogs({ categories: [category] });
  }

  /**
   * Get logs by source
   */
  getLogsBySource(source: string): LogEntry[] {
    return this.filterLogs({ sources: [source] });
  }

  /**
   * Get recent errors
   */
  getRecentErrors(hoursBack: number = 24): LogEntry[] {
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return this.filterLogs({
      levels: ['error'],
      dateFrom: cutoff
    });
  }

  /**
   * Get log statistics
   */
  getLogStats(): LogStats {
    const logs = this.getAllLogs();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const byLevel = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);

    const byCategory = logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<LogCategory, number>);

    const recentLogs = logs.filter(log => log.timestamp >= oneDayAgo);
    const weeklyLogs = logs.filter(log => log.timestamp >= oneWeekAgo);

    return {
      total: logs.length,
      byLevel,
      byCategory,
      recentCount: recentLogs.length,
      weeklyCount: weeklyLogs.length,
      errorRate: logs.length > 0 ? (byLevel.error || 0) / logs.length : 0,
      oldestEntry: logs.length > 0 ? Math.min(...logs.map(l => l.timestamp.getTime())) : null,
      newestEntry: logs.length > 0 ? Math.max(...logs.map(l => l.timestamp.getTime())) : null,
      topSources: this.getTopSources(logs, 10),
      frequentErrors: this.getFrequentErrors(logs, 10)
    };
  }

  /**
   * Clear logs
   */
  clearLogs(filter?: LogFilter): number {
    if (!filter) {
      const count = this.logs.size;
      this.logs.clear();
      return count;
    }

    const toDelete = this.filterLogs(filter);
    toDelete.forEach(log => this.logs.delete(log.id));
    return toDelete.length;
  }

  /**
   * Export logs
   */
  exportLogs(filter?: LogFilter, format: 'json' | 'csv' = 'json'): LogExport {
    const logs = filter ? this.filterLogs(filter) : this.getAllLogs();
    const exportData: LogExport = {
      timestamp: new Date(),
      format,
      count: logs.length,
      data: format === 'json' ? logs : this.convertToCSV(logs)
    };

    return exportData;
  }

  /**
   * Get log context (logs around a specific entry)
   */
  getLogContext(logId: string, contextSize: number = 10): LogEntry[] {
    const targetLog = this.logs.get(logId);
    if (!targetLog) return [];

    const allLogs = this.getAllLogs();
    const targetIndex = allLogs.findIndex(log => log.id === logId);
    if (targetIndex === -1) return [];

    const start = Math.max(0, targetIndex - contextSize);
    const end = Math.min(allLogs.length, targetIndex + contextSize + 1);

    return allLogs.slice(start, end);
  }

  /**
   * Track user action
   */
  trackUserAction(action: string, data?: any, userId?: string): LogEntry {
    return this.log('info', 'user_action', `User action: ${action}`, data, 'user', userId);
  }

  /**
   * Track API call
   */
  trackAPICall(endpoint: string, method: string, status: number, duration: number, data?: any): LogEntry {
    const level: LogLevel = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    return this.log(level, 'api', `${method} ${endpoint} - ${status} (${duration}ms)`, {
      endpoint,
      method,
      status,
      duration,
      ...data
    }, 'api');
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: any, source?: string): LogEntry {
    return this.log('error', 'error', error.message, {
      name: error.name,
      stack: error.stack,
      context
    }, source || 'error');
  }

  /**
   * Track GPT interaction
   */
  trackGPTInteraction(prompt: string, response: string, model?: string, tokens?: number): LogEntry {
    return this.log('info', 'gpt', 'GPT interaction', {
      prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
      response: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
      model,
      tokens
    }, 'gpt');
  }

  /**
   * Track signal generation
   */
  trackSignal(signalType: string, symbol: string, confidence: number, data?: any): LogEntry {
    return this.log('info', 'signals', `${signalType} signal for ${symbol}`, {
      signalType,
      symbol,
      confidence,
      ...data
    }, 'signals');
  }

  /**
   * Track trading action
   */
  trackTrade(action: string, symbol: string, quantity: number, price: number, data?: any): LogEntry {
    return this.log('info', 'trading', `${action} ${quantity} ${symbol} @ ${price}`, {
      action,
      symbol,
      quantity,
      price,
      ...data
    }, 'trading');
  }

  /**
   * Extract tags from message and data
   */
  private extractTags(message: string, data?: any): string[] {
    const tags: string[] = [];

    // Extract from message
    const messageWords = message.toLowerCase().split(/\s+/);
    const commonTags = ['error', 'warning', 'success', 'failed', 'completed', 'started', 'stopped'];
    messageWords.forEach(word => {
      if (commonTags.includes(word)) {
        tags.push(word);
      }
    });

    // Extract from data
    if (data) {
      if (data.symbol) tags.push(`symbol:${data.symbol}`);
      if (data.userId) tags.push(`user:${data.userId}`);
      if (data.action) tags.push(`action:${data.action}`);
      if (data.status) tags.push(`status:${data.status}`);
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Get current session ID
   */
  private getCurrentSessionId(): string {
    // In a real app, this would get the actual session ID
    return 'session_' + Date.now().toString(36);
  }

  /**
   * Trigger notification for important logs
   */
  private triggerNotification(entry: LogEntry): void {
    // This would integrate with the notification system
    console.log(`[LogNotification] ${entry.level.toUpperCase()}: ${entry.message}`);
  }

  /**
   * Cleanup old logs
   */
  private cleanup(): void {
    // Remove old logs beyond retention period
    const cutoff = new Date(Date.now() - this.retentionPeriod);
    this.logs.forEach((log, id) => {
      if (log.timestamp < cutoff) {
        this.logs.delete(id);
      }
    });

    // Enforce max entries limit
    if (this.logs.size > this.maxLogEntries) {
      const sorted = this.getAllLogs();
      const toDelete = sorted.slice(this.maxLogEntries);
      toDelete.forEach(log => this.logs.delete(log.id));
    }
  }

  /**
   * Get top sources
   */
  private getTopSources(logs: LogEntry[], limit: number): Array<{source: string, count: number}> {
    const sourceCounts = logs.reduce((acc, log) => {
      acc[log.source] = (acc[log.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get frequent errors
   */
  private getFrequentErrors(logs: LogEntry[], limit: number): Array<{message: string, count: number}> {
    const errorLogs = logs.filter(log => log.level === 'error');
    const errorCounts = errorLogs.reduce((acc, log) => {
      acc[log.message] = (acc[log.message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Convert logs to CSV format
   */
  private convertToCSV(logs: LogEntry[]): string {
    const headers = ['timestamp', 'level', 'category', 'source', 'message', 'userId', 'sessionId', 'tags'];
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.category,
      log.source,
      `"${log.message.replace(/"/g, '""')}"`,
      log.userId || '',
      log.sessionId || '',
      log.tags.join(';')
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const centralLoggingEngine = new CentralLoggingEngine(); 