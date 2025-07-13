// Block 12: Snapshot Exporter - Engine
// Core engine for dashboard and config snapshot management

import {
  DashboardSnapshot,
  SnapshotExportRequest,
  SnapshotImportRequest,
  SnapshotFileInfo,
  SnapshotTemplate,
  SnapshotComparison,
  SnapshotDifference,
  SnapshotStats,
  DashboardConfig,
  PortfolioState,
  WidgetState,
  SnapshotFormat
} from '../types/snapshotExporter';

export class SnapshotExporterEngine {
  private static instance: SnapshotExporterEngine;
  private snapshots: Map<string, DashboardSnapshot> = new Map();
  private templates: Map<string, SnapshotTemplate> = new Map();
  private exportQueue: Map<string, AbortController> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): SnapshotExporterEngine {
    if (!SnapshotExporterEngine.instance) {
      SnapshotExporterEngine.instance = new SnapshotExporterEngine();
    }
    return SnapshotExporterEngine.instance;
  }

  private initializeEngine(): void {
    // Initialize with default templates
    this.loadDefaultTemplates();
    
    // Set up periodic cleanup
    this.scheduleCleanup();
  }

  // Core Snapshot Operations
  public createSnapshot(config: Omit<DashboardSnapshot, 'id' | 'userId' | 'createdAt'>): DashboardSnapshot {
    const snapshot: DashboardSnapshot = {
      ...config,
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      createdAt: new Date(),
      version: '1.0'
    };

    this.snapshots.set(snapshot.id, snapshot);
    return snapshot;
  }

  public getSnapshot(id: string): DashboardSnapshot | undefined {
    return this.snapshots.get(id);
  }

  public getSnapshots(): DashboardSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  public updateSnapshot(id: string, updates: Partial<DashboardSnapshot>): DashboardSnapshot {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    const updatedSnapshot = { ...snapshot, ...updates };
    this.snapshots.set(id, updatedSnapshot);
    return updatedSnapshot;
  }

  public deleteSnapshot(id: string): boolean {
    return this.snapshots.delete(id);
  }

  // Export Operations
  public async exportSnapshot(request: SnapshotExportRequest): Promise<SnapshotFileInfo> {
    const snapshot = this.snapshots.get(request.snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    try {
      const abortController = new AbortController();
      this.exportQueue.set(request.snapshotId, abortController);

      let fileInfo: SnapshotFileInfo;

      switch (request.format) {
        case 'json':
          fileInfo = await this.exportAsJSON(snapshot, request);
          break;
        case 'image':
          fileInfo = await this.exportAsImage(snapshot, request);
          break;
        case 'both':
          fileInfo = await this.exportAsBoth(snapshot, request);
          break;
        default:
          throw new Error('Invalid export format');
      }

      // Update snapshot with file info
      this.updateSnapshot(request.snapshotId, { fileInfo });

      return fileInfo;
    } finally {
      this.exportQueue.delete(request.snapshotId);
    }
  }

  private async exportAsJSON(snapshot: DashboardSnapshot, request: SnapshotExportRequest): Promise<SnapshotFileInfo> {
    // Create JSON representation
    const exportData = {
      snapshot,
      exportedAt: new Date(),
      includeData: request.includeData,
      includeImages: request.includeImages,
      version: '1.0'
    };

    // Simulate file creation
    await this.delay(1000);

    const fileName = `${snapshot.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    const fileSize = JSON.stringify(exportData).length;

    return {
      fileName,
      filePath: `/exports/snapshots/${snapshot.id}/`,
      fileSize,
      mimeType: 'application/json',
      downloadUrl: `https://api.stackmotive.com/exports/snapshots/${snapshot.id}/download`,
      downloadExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      downloadCount: 0
    };
  }

  private async exportAsImage(snapshot: DashboardSnapshot, request: SnapshotExportRequest): Promise<SnapshotFileInfo> {
    // Simulate image generation
    await this.delay(2000);

    const imageFormat = request.imageFormat || 'png';
    const fileName = `${snapshot.name.replace(/\s+/g, '_')}_${Date.now()}.${imageFormat}`;
    
    return {
      fileName,
      filePath: `/exports/snapshots/${snapshot.id}/`,
      fileSize: 1024 * 512, // 512KB
      mimeType: `image/${imageFormat}`,
      downloadUrl: `https://api.stackmotive.com/exports/snapshots/${snapshot.id}/download`,
      downloadExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      downloadCount: 0,
      thumbnailUrl: `https://api.stackmotive.com/exports/snapshots/${snapshot.id}/thumbnail`
    };
  }

  private async exportAsBoth(snapshot: DashboardSnapshot, request: SnapshotExportRequest): Promise<SnapshotFileInfo> {
    // Export both JSON and image, create ZIP
    await this.delay(3000);

    const fileName = `${snapshot.name.replace(/\s+/g, '_')}_${Date.now()}.zip`;
    
    return {
      fileName,
      filePath: `/exports/snapshots/${snapshot.id}/`,
      fileSize: 1024 * 768, // 768KB
      mimeType: 'application/zip',
      downloadUrl: `https://api.stackmotive.com/exports/snapshots/${snapshot.id}/download`,
      downloadExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      downloadCount: 0,
      thumbnailUrl: `https://api.stackmotive.com/exports/snapshots/${snapshot.id}/thumbnail`
    };
  }

  // Import Operations
  public async importSnapshot(request: SnapshotImportRequest): Promise<DashboardSnapshot[]> {
    try {
      // Simulate file processing
      await this.delay(1500);

      // Parse imported data
      const importedData = await this.parseImportFile(request.file);
      const importedSnapshots: DashboardSnapshot[] = [];

      for (const snapshotData of importedData) {
        let snapshot: DashboardSnapshot;

        if (request.replaceExisting && this.snapshots.has(snapshotData.id)) {
          // Replace existing
          snapshot = this.updateSnapshot(snapshotData.id, snapshotData);
        } else {
          // Create new snapshot
          const newId = request.preserveIds ? snapshotData.id : this.generateId();
          snapshot = this.createSnapshot({
            ...snapshotData,
            name: request.replaceExisting ? snapshotData.name : `${snapshotData.name} (Imported)`
          });
          snapshot.id = newId;
          this.snapshots.set(newId, snapshot);
        }

        importedSnapshots.push(snapshot);
      }

      return importedSnapshots;
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseImportFile(file: File): Promise<Partial<DashboardSnapshot>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          
          // Validate and normalize data
          const snapshots = Array.isArray(data) ? data : [data.snapshot || data];
          resolve(snapshots);
        } catch (error) {
          reject(new Error('Invalid file format'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Snapshot Operations
  public duplicateSnapshot(id: string, newName?: string): DashboardSnapshot {
    const original = this.snapshots.get(id);
    if (!original) {
      throw new Error('Snapshot not found');
    }

    const duplicate = this.createSnapshot({
      ...original,
      name: newName || `${original.name} (Copy)`,
      shareableLink: undefined, // Clear sharing settings
      isPublic: false
    });

    return duplicate;
  }

  public shareSnapshot(id: string, isPublic: boolean): string {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    let shareableLink: string | undefined;
    
    if (isPublic) {
      shareableLink = `https://share.stackmotive.com/snapshot/${this.generateId()}`;
    }

    this.updateSnapshot(id, { isPublic, shareableLink });
    
    return shareableLink || '';
  }

  public async compareSnapshots(idA: string, idB: string): Promise<SnapshotComparison> {
    const snapshotA = this.snapshots.get(idA);
    const snapshotB = this.snapshots.get(idB);

    if (!snapshotA || !snapshotB) {
      throw new Error('One or both snapshots not found');
    }

    // Simulate comparison processing
    await this.delay(500);

    const differences = this.calculateDifferences(snapshotA, snapshotB);
    const similarity = this.calculateSimilarity(differences, snapshotA, snapshotB);

    return {
      snapshotA,
      snapshotB,
      differences,
      similarity
    };
  }

  private calculateDifferences(snapshotA: DashboardSnapshot, snapshotB: DashboardSnapshot): SnapshotDifference[] {
    const differences: SnapshotDifference[] = [];

    // Compare dashboard configs
    if (snapshotA.dashboardConfig.layout !== snapshotB.dashboardConfig.layout) {
      differences.push({
        type: 'modified',
        path: 'dashboardConfig.layout',
        oldValue: snapshotA.dashboardConfig.layout,
        newValue: snapshotB.dashboardConfig.layout,
        description: 'Dashboard layout changed'
      });
    }

    // Compare widget counts
    if (snapshotA.widgetStates.length !== snapshotB.widgetStates.length) {
      differences.push({
        type: 'modified',
        path: 'widgetStates.length',
        oldValue: snapshotA.widgetStates.length,
        newValue: snapshotB.widgetStates.length,
        description: 'Number of widgets changed'
      });
    }

    // Compare theme
    if (snapshotA.dashboardConfig.theme !== snapshotB.dashboardConfig.theme) {
      differences.push({
        type: 'modified',
        path: 'dashboardConfig.theme',
        oldValue: snapshotA.dashboardConfig.theme,
        newValue: snapshotB.dashboardConfig.theme,
        description: 'Theme changed'
      });
    }

    return differences;
  }

  private calculateSimilarity(differences: SnapshotDifference[], snapshotA: DashboardSnapshot, snapshotB: DashboardSnapshot): number {
    const totalComparisons = 10; // Simplified: number of properties we compare
    const changedProperties = differences.length;
    
    return Math.max(0, (totalComparisons - changedProperties) / totalComparisons);
  }

  public async applySnapshot(id: string): Promise<boolean> {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    try {
      // Simulate applying snapshot to current dashboard
      await this.delay(1000);
      
      // In real implementation, this would update the dashboard state
      // For now, we'll just simulate success
      
      return true;
    } catch (error) {
      throw new Error(`Failed to apply snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Template Operations
  public createTemplate(snapshotId: string, templateName: string): SnapshotTemplate {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    const template: SnapshotTemplate = {
      id: this.generateId(),
      name: templateName,
      description: snapshot.description || '',
      category: 'user',
      thumbnailUrl: snapshot.fileInfo?.thumbnailUrl || '',
      config: snapshot.dashboardConfig,
      isPublic: false,
      usageCount: 0,
      rating: 0,
      createdBy: snapshot.userId,
      createdAt: new Date()
    };

    this.templates.set(template.id, template);
    return template;
  }

  public getTemplates(): SnapshotTemplate[] {
    return Array.from(this.templates.values());
  }

  // Statistics and Analytics
  public async getSnapshotStats(): Promise<SnapshotStats> {
    const snapshots = this.getSnapshots();
    
    const formatBreakdown: Record<SnapshotFormat, number> = {
      json: 0,
      image: 0,
      both: 0
    };

    const widgetTypeCount: Record<string, number> = {};
    let totalWidgets = 0;

    snapshots.forEach(snapshot => {
      formatBreakdown[snapshot.exportFormat]++;
      
      snapshot.widgetStates.forEach(widget => {
        widgetTypeCount[widget.widgetType] = (widgetTypeCount[widget.widgetType] || 0) + 1;
        totalWidgets++;
      });
    });

    const mostUsedWidgets = Object.entries(widgetTypeCount)
      .map(([widgetType, count]) => ({ widgetType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalSize = snapshots.reduce((sum, snapshot) => 
      sum + (snapshot.fileInfo?.fileSize || 0), 0
    );

    return {
      totalSnapshots: snapshots.length,
      totalSize,
      formatBreakdown,
      mostUsedWidgets,
      averageWidgetCount: snapshots.length > 0 ? totalWidgets / snapshots.length : 0,
      creationTrend: this.calculateCreationTrend(snapshots)
    };
  }

  private calculateCreationTrend(snapshots: DashboardSnapshot[]): Array<{date: string, count: number}> {
    const trend: Record<string, number> = {};
    
    snapshots.forEach(snapshot => {
      const date = snapshot.createdAt.toISOString().split('T')[0];
      trend[date] = (trend[date] || 0) + 1;
    });

    return Object.entries(trend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Utility Functions
  public searchSnapshots(query: string): DashboardSnapshot[] {
    const lowerQuery = query.toLowerCase();
    
    return this.getSnapshots().filter(snapshot => 
      snapshot.name.toLowerCase().includes(lowerQuery) ||
      snapshot.description?.toLowerCase().includes(lowerQuery) ||
      snapshot.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  public cleanupExpired(): number {
    let cleanedCount = 0;
    const now = new Date();

    for (const [id, snapshot] of this.snapshots.entries()) {
      if (snapshot.expiresAt && snapshot.expiresAt < now) {
        this.snapshots.delete(id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Private Helper Methods
  private loadDefaultTemplates(): void {
    const defaultTemplates: SnapshotTemplate[] = [
      {
        id: 'template_1',
        name: 'Standard Dashboard',
        description: 'Standard portfolio dashboard layout',
        category: 'default',
        thumbnailUrl: '/templates/standard.png',
        config: this.createDefaultDashboardConfig(),
        isPublic: true,
        usageCount: 0,
        rating: 4.5,
        createdBy: 'system',
        createdAt: new Date()
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private createDefaultDashboardConfig(): DashboardConfig {
    return {
      layout: {
        type: 'grid',
        columns: 12,
        rows: 8,
        gap: 16,
        padding: 16,
        breakpoints: {
          sm: { minWidth: 640, columns: 1, margin: 8, padding: 8 },
          md: { minWidth: 768, columns: 2, margin: 12, padding: 12 },
          lg: { minWidth: 1024, columns: 3, margin: 16, padding: 16 }
        }
      },
      theme: 'system',
      colorScheme: 'default',
      fontSize: 14,
      density: 'normal',
      widgets: ['portfolio-summary', 'holdings-table', 'allocation-chart'],
      customizations: {}
    };
  }

  private scheduleCleanup(): void {
    // Schedule cleanup every 24 hours
    setInterval(() => {
      this.cleanupExpired();
    }, 24 * 60 * 60 * 1000);
  }

  private generateId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    // In real implementation, get from auth context
    return 'current_user_id';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 