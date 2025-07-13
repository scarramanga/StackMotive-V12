// Block 19: Auto Import Watcher - Engine
// Core engine for automated file watching and import processing

import {
  WatcherConfig,
  WatchEvent,
  ImportJob,
  FileMapping,
  WatcherStats,
  WatcherSettings,
  ImportResult,
  ImportError,
  ProcessingRule,
  JobStatus,
  ImportType,
  FileFormat,
  WatchEventType
} from '../types/autoImportWatcher';

export class AutoImportWatcherEngine {
  private static instance: AutoImportWatcherEngine;
  private watchers: Map<string, WatcherConfig> = new Map();
  private events: Map<string, WatchEvent> = new Map();
  private jobs: Map<string, ImportJob> = new Map();
  private mappings: Map<string, FileMapping> = new Map();
  private activeWatchers: Set<string> = new Set();
  private processingJobs: Set<string> = new Set();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): AutoImportWatcherEngine {
    if (!AutoImportWatcherEngine.instance) {
      AutoImportWatcherEngine.instance = new AutoImportWatcherEngine();
    }
    return AutoImportWatcherEngine.instance;
  }

  private initializeEngine(): void {
    // Initialize with default mappings
    this.loadDefaultMappings();
    
    // Start file system monitoring
    this.startMonitoring();
  }

  // Watcher Management
  public createWatcher(config: Omit<WatcherConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): WatcherConfig {
    const watcher: WatcherConfig = {
      ...config,
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false
    };

    this.watchers.set(watcher.id, watcher);
    
    if (watcher.enabled) {
      this.enableWatcher(watcher.id);
    }

    return watcher;
  }

  public getWatcher(id: string): WatcherConfig | undefined {
    return this.watchers.get(id);
  }

  public getWatchers(): WatcherConfig[] {
    return Array.from(this.watchers.values());
  }

  public updateWatcher(id: string, updates: Partial<WatcherConfig>): WatcherConfig {
    const watcher = this.watchers.get(id);
    if (!watcher) {
      throw new Error('Watcher not found');
    }

    const updatedWatcher = {
      ...watcher,
      ...updates,
      updatedAt: new Date()
    };

    this.watchers.set(id, updatedWatcher);

    // Update monitoring if needed
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.enableWatcher(id);
      } else {
        this.disableWatcher(id);
      }
    }

    return updatedWatcher;
  }

  public deleteWatcher(id: string): boolean {
    const watcher = this.watchers.get(id);
    if (!watcher) {
      return false;
    }

    // Stop watching first
    this.disableWatcher(id);
    
    // Remove watcher
    this.watchers.delete(id);

    // Clean up related events and jobs
    this.cleanupWatcherData(id);

    return true;
  }

  public enableWatcher(id: string): boolean {
    const watcher = this.watchers.get(id);
    if (!watcher) {
      return false;
    }

    try {
      // Validate watch path
      this.validateWatchPath(watcher.watchPath);
      
      // Start file system watching
      this.startFileWatching(watcher);
      
      // Update watcher status
      this.updateWatcher(id, { enabled: true, isActive: true });
      this.activeWatchers.add(id);

      return true;
    } catch (error) {
      console.error(`Failed to enable watcher ${id}:`, error);
      return false;
    }
  }

  public disableWatcher(id: string): boolean {
    const watcher = this.watchers.get(id);
    if (!watcher) {
      return false;
    }

    try {
      // Stop file system watching
      this.stopFileWatching(watcher);
      
      // Update watcher status
      this.updateWatcher(id, { enabled: false, isActive: false });
      this.activeWatchers.delete(id);

      return true;
    } catch (error) {
      console.error(`Failed to disable watcher ${id}:`, error);
      return false;
    }
  }

  // Event Processing
  public async processEvent(eventId: string): Promise<ImportJob> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const watcher = this.watchers.get(event.watcherId);
    if (!watcher) {
      throw new Error('Watcher not found for event');
    }

    // Create import job
    const job = this.createImportJob(event, watcher);
    
    try {
      // Process the file
      await this.executeImportJob(job);
      
      // Mark event as processed
      event.processed = true;
      this.events.set(eventId, event);

      return job;
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.errors.push({
        rowNumber: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {}
      });
      
      this.jobs.set(job.id, job);
      throw error;
    }
  }

  public async reprocessEvent(eventId: string): Promise<ImportJob> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Reset event status
    event.processed = false;
    event.error = undefined;
    this.events.set(eventId, event);

    // Process the event again
    return this.processEvent(eventId);
  }

  public ignoreEvent(eventId: string): boolean {
    const event = this.events.get(eventId);
    if (!event) {
      return false;
    }

    event.processed = true;
    this.events.set(eventId, event);
    return true;
  }

  // Job Management
  public getJob(jobId: string): ImportJob | undefined {
    return this.jobs.get(jobId);
  }

  public getJobs(): ImportJob[] {
    return Array.from(this.jobs.values());
  }

  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'processing') {
      return false;
    }

    job.status = 'cancelled';
    job.completedAt = new Date();
    this.jobs.set(jobId, job);
    this.processingJobs.delete(jobId);

    return true;
  }

  public async retryJob(jobId: string): Promise<ImportJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Reset job status
    job.status = 'pending';
    job.startedAt = new Date();
    job.completedAt = undefined;
    job.results = [];
    job.errors = [];
    job.processedRecords = 0;
    job.successfulRecords = 0;
    job.failedRecords = 0;

    this.jobs.set(jobId, job);

    // Re-execute the job
    return this.executeImportJob(job);
  }

  // File Mapping
  public createMapping(mapping: Omit<FileMapping, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): FileMapping {
    const newMapping: FileMapping = {
      ...mapping,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    this.mappings.set(newMapping.id, newMapping);
    return newMapping;
  }

  public getMapping(id: string): FileMapping | undefined {
    return this.mappings.get(id);
  }

  public getMappings(): FileMapping[] {
    return Array.from(this.mappings.values());
  }

  public updateMapping(id: string, updates: Partial<FileMapping>): FileMapping {
    const mapping = this.mappings.get(id);
    if (!mapping) {
      throw new Error('Mapping not found');
    }

    const updatedMapping = {
      ...mapping,
      ...updates,
      updatedAt: new Date()
    };

    this.mappings.set(id, updatedMapping);
    return updatedMapping;
  }

  public deleteMapping(id: string): boolean {
    return this.mappings.delete(id);
  }

  public async testMapping(mappingId: string, filePath: string): Promise<ImportResult[]> {
    const mapping = this.mappings.get(mappingId);
    if (!mapping) {
      throw new Error('Mapping not found');
    }

    try {
      // Simulate file reading and processing
      const fileData = await this.readFile(filePath);
      const results = this.processFileData(fileData, mapping, true); // dry run
      
      return results.slice(0, 10); // Return first 10 rows for preview
    } catch (error) {
      throw new Error(`Failed to test mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Statistics and Monitoring
  public async getWatcherStats(): Promise<WatcherStats> {
    const watchers = this.getWatchers();
    const events = Array.from(this.events.values());
    const jobs = Array.from(this.jobs.values());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventsToday = events.filter(e => e.timestamp >= today).length;
    const successfulImports = jobs.filter(j => j.status === 'completed').length;
    const failedImports = jobs.filter(j => j.status === 'failed').length;
    const totalImports = successfulImports + failedImports;
    
    const processingTimes = jobs
      .filter(j => j.status === 'completed')
      .map(j => j.processingTime);
    
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    const errorCounts: Record<string, number> = {};
    jobs.forEach(job => {
      job.errors.forEach(error => {
        errorCounts[error.error] = (errorCounts[error.error] || 0) + 1;
      });
    });

    const topErrorMessages = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalWatchers: watchers.length,
      activeWatchers: this.activeWatchers.size,
      totalEvents: events.length,
      eventsToday,
      successfulImports,
      failedImports,
      totalProcessedFiles: jobs.length,
      averageProcessingTime,
      errorRate: totalImports > 0 ? failedImports / totalImports : 0,
      topErrorMessages
    };
  }

  public async getWatcherHealth(watcherId: string): Promise<{healthy: boolean, issues: string[]}> {
    const watcher = this.watchers.get(watcherId);
    if (!watcher) {
      return { healthy: false, issues: ['Watcher not found'] };
    }

    const issues: string[] = [];

    // Check if watcher is enabled but not active
    if (watcher.enabled && !watcher.isActive) {
      issues.push('Watcher is enabled but not active');
    }

    // Check watch path accessibility
    try {
      await this.validateWatchPath(watcher.watchPath);
    } catch (error) {
      issues.push(`Watch path inaccessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check recent errors
    const recentEvents = Array.from(this.events.values())
      .filter(e => e.watcherId === watcherId && e.error)
      .slice(-5);

    if (recentEvents.length > 0) {
      issues.push(`${recentEvents.length} recent errors detected`);
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  // Utility Functions
  public async validateWatchPath(path: string): Promise<{valid: boolean, error?: string}> {
    try {
      // In real implementation, would check file system permissions
      // For now, simulate validation
      await this.delay(100);

      if (!path || path.trim() === '') {
        return { valid: false, error: 'Path cannot be empty' };
      }

      if (path.includes('..')) {
        return { valid: false, error: 'Path traversal not allowed' };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      };
    }
  }

  public async previewFile(filePath: string, mappingId: string): Promise<{preview: any[], errors: string[]}> {
    const mapping = this.mappings.get(mappingId);
    if (!mapping) {
      throw new Error('Mapping not found');
    }

    try {
      const fileData = await this.readFile(filePath);
      const preview = this.processFileData(fileData, mapping, true).slice(0, 5);
      
      return { preview, errors: [] };
    } catch (error) {
      return { 
        preview: [], 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  // Private Implementation Methods
  private createImportJob(event: WatchEvent, watcher: WatcherConfig): ImportJob {
    const job: ImportJob = {
      id: this.generateId(),
      watcherId: watcher.id,
      eventId: event.id,
      filePath: event.filePath,
      status: 'pending',
      startedAt: new Date(),
      totalRecords: 0,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      results: [],
      errors: [],
      processingTime: 0,
      fileHash: this.generateFileHash(event.filePath),
      originalFileName: event.fileName
    };

    this.jobs.set(job.id, job);
    return job;
  }

  private async executeImportJob(job: ImportJob): Promise<ImportJob> {
    const startTime = Date.now();
    
    try {
      job.status = 'processing';
      this.processingJobs.add(job.id);
      this.jobs.set(job.id, job);

      // Read and process file
      const fileData = await this.readFile(job.filePath);
      const watcher = this.watchers.get(job.watcherId);
      
      if (!watcher) {
        throw new Error('Watcher not found');
      }

      // Find appropriate mapping
      const mapping = this.findMappingForFile(job.filePath, watcher.importType);
      if (!mapping) {
        throw new Error('No suitable mapping found for file');
      }

      // Process file data
      job.results = this.processFileData(fileData, mapping);
      job.totalRecords = job.results.length;
      job.successfulRecords = job.results.filter(r => r.action !== 'skipped').length;
      job.failedRecords = job.errors.length;
      job.processedRecords = job.totalRecords;

      job.status = 'completed';
      job.completedAt = new Date();
      job.processingTime = Date.now() - startTime;

      // Update mapping usage count
      mapping.usageCount++;
      this.mappings.set(mapping.id, mapping);

    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.processingTime = Date.now() - startTime;
      
      job.errors.push({
        rowNumber: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {}
      });
    } finally {
      this.processingJobs.delete(job.id);
      this.jobs.set(job.id, job);
    }

    return job;
  }

  private async readFile(filePath: string): Promise<any[]> {
    // Simulate file reading
    await this.delay(500);
    
    // Return mock data for demonstration
    return [
      { symbol: 'AAPL', quantity: 100, price: 150.00 },
      { symbol: 'GOOGL', quantity: 50, price: 2800.00 },
      { symbol: 'MSFT', quantity: 75, price: 300.00 }
    ];
  }

  private processFileData(data: any[], mapping: FileMapping, dryRun: boolean = false): ImportResult[] {
    return data.map((row, index) => {
      try {
        // Apply column mappings
        const mappedData: Record<string, any> = {};
        mapping.columnMappings.forEach(columnMapping => {
          const sourceValue = row[columnMapping.sourceColumn];
          mappedData[columnMapping.targetField] = sourceValue || columnMapping.defaultValue;
        });

        // Apply transformations
        mapping.transformations.forEach(transformation => {
          // Apply transformation logic based on type
          mappedData[transformation.targetField] = this.applyTransformation(
            mappedData[transformation.targetField],
            transformation
          );
        });

        // Validate data
        const validationErrors = this.validateRowData(mappedData, mapping.validations);
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }

        return {
          rowNumber: index + 1,
          recordId: mappedData.id || `row_${index + 1}`,
          action: dryRun ? 'skipped' : 'created',
          data: mappedData,
          warnings: []
        };
      } catch (error) {
        return {
          rowNumber: index + 1,
          action: 'skipped',
          data: row,
          warnings: [error instanceof Error ? error.message : 'Unknown error']
        };
      }
    });
  }

  private applyTransformation(value: any, transformation: any): any {
    // Implement transformation logic based on type
    switch (transformation.type) {
      case 'format':
        return this.formatValue(value, transformation.parameters);
      case 'calculate':
        return this.calculateValue(value, transformation.parameters);
      default:
        return value;
    }
  }

  private formatValue(value: any, parameters: any): any {
    // Implement formatting logic
    return value;
  }

  private calculateValue(value: any, parameters: any): any {
    // Implement calculation logic
    return value;
  }

  private validateRowData(data: Record<string, any>, validations: any[]): string[] {
    const errors: string[] = [];
    
    validations.forEach(validation => {
      const value = data[validation.field];
      
      switch (validation.type) {
        case 'required':
          if (value === null || value === undefined || value === '') {
            errors.push(`${validation.field} is required`);
          }
          break;
        case 'min':
          if (typeof value === 'number' && value < validation.parameters.min) {
            errors.push(`${validation.field} must be at least ${validation.parameters.min}`);
          }
          break;
        case 'max':
          if (typeof value === 'number' && value > validation.parameters.max) {
            errors.push(`${validation.field} must be at most ${validation.parameters.max}`);
          }
          break;
      }
    });

    return errors;
  }

  private findMappingForFile(filePath: string, importType: ImportType): FileMapping | undefined {
    const mappings = Array.from(this.mappings.values());
    
    // Find mapping based on import type and file format
    return mappings.find(mapping => 
      mapping.importType === importType && 
      this.fileMatchesFormat(filePath, mapping.fileFormat)
    );
  }

  private fileMatchesFormat(filePath: string, format: FileFormat): boolean {
    const extension = filePath.split('.').pop()?.toLowerCase();
    return extension === format;
  }

  private startFileWatching(watcher: WatcherConfig): void {
    // In real implementation, would start file system watcher
    console.log(`Started watching: ${watcher.watchPath}`);
  }

  private stopFileWatching(watcher: WatcherConfig): void {
    // In real implementation, would stop file system watcher
    console.log(`Stopped watching: ${watcher.watchPath}`);
  }

  private startMonitoring(): void {
    // Start periodic monitoring tasks
    setInterval(() => {
      this.checkForNewFiles();
    }, 30000); // Check every 30 seconds
  }

  private checkForNewFiles(): void {
    // Simulate file detection
    this.activeWatchers.forEach(watcherId => {
      const watcher = this.watchers.get(watcherId);
      if (watcher && Math.random() < 0.1) { // 10% chance of finding a file
        this.simulateFileEvent(watcher);
      }
    });
  }

  private simulateFileEvent(watcher: WatcherConfig): void {
    const event: WatchEvent = {
      id: this.generateId(),
      watcherId: watcher.id,
      eventType: 'created',
      filePath: `${watcher.watchPath}/sample_${Date.now()}.csv`,
      fileName: `sample_${Date.now()}.csv`,
      fileSize: 1024,
      timestamp: new Date(),
      processed: false
    };

    this.events.set(event.id, event);

    // Auto-process if enabled
    if (watcher.autoProcess) {
      setTimeout(() => {
        this.processEvent(event.id).catch(console.error);
      }, 1000);
    }
  }

  private cleanupWatcherData(watcherId: string): void {
    // Remove events
    Array.from(this.events.entries()).forEach(([eventId, event]) => {
      if (event.watcherId === watcherId) {
        this.events.delete(eventId);
      }
    });

    // Remove jobs
    Array.from(this.jobs.entries()).forEach(([jobId, job]) => {
      if (job.watcherId === watcherId) {
        this.jobs.delete(jobId);
      }
    });
  }

  private loadDefaultMappings(): void {
    // Load default file mappings
    const defaultMappings: Omit<FileMapping, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
      {
        name: 'Standard Portfolio CSV',
        description: 'Standard CSV format for portfolio imports',
        fileFormat: 'csv',
        importType: 'portfolio',
        columnMappings: [
          { sourceColumn: 0, targetField: 'symbol', required: true, dataType: 'string' },
          { sourceColumn: 1, targetField: 'quantity', required: true, dataType: 'number' },
          { sourceColumn: 2, targetField: 'price', required: true, dataType: 'number' }
        ],
        transformations: [],
        validations: [
          { id: '1', field: 'symbol', type: 'required', parameters: {}, message: 'Symbol is required' },
          { id: '2', field: 'quantity', type: 'min', parameters: { min: 0 }, message: 'Quantity must be positive' }
        ],
        isSystem: true
      }
    ];

    defaultMappings.forEach(mapping => {
      this.createMapping(mapping);
    });
  }

  private generateFileHash(filePath: string): string {
    // In real implementation, would generate actual file hash
    return `hash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    // In real implementation, get from auth context
    return 'current_user_id';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 