// Block 12: Snapshot Exporter - Hook
// React hook for snapshot export functionality

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SnapshotExporterEngine } from '../engines/SnapshotExporterEngine';
import {
  DashboardSnapshot,
  SnapshotExportRequest,
  SnapshotImportRequest,
  SnapshotFileInfo,
  SnapshotTemplate,
  SnapshotComparison,
  SnapshotStats,
  SnapshotSettings,
  SnapshotFilters,
  UseSnapshotExporterReturn
} from '../types/snapshotExporter';

export function useSnapshotExporter(): UseSnapshotExporterReturn {
  const engine = useMemo(() => SnapshotExporterEngine.getInstance(), []);
  
  // State
  const [snapshots, setSnapshots] = useState<DashboardSnapshot[]>([]);
  const [templates, setTemplates] = useState<SnapshotTemplate[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState<DashboardSnapshot | null>(null);
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState<string[]>([]);
  
  // Settings
  const [settings, setSettings] = useState<SnapshotSettings>({
    autoSave: true,
    autoSaveInterval: 5,
    maxSnapshots: 100,
    defaultFormat: 'json',
    includeDataByDefault: true,
    includeImagesByDefault: false,
    compressionEnabled: true,
    retentionDays: 30
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Load initial data
  useEffect(() => {
    loadSnapshots();
    loadTemplates();
  }, []);
  
  const loadSnapshots = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const allSnapshots = engine.getSnapshots();
      setSnapshots(allSnapshots);
      
      // Set first snapshot as current if none selected
      if (!currentSnapshot && allSnapshots.length > 0) {
        setCurrentSnapshot(allSnapshots[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load snapshots';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentSnapshot]);
  
  const loadTemplates = useCallback(async () => {
    try {
      const allTemplates = engine.getTemplates();
      setTemplates(allTemplates);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }, [engine]);
  
  // Snapshot Operations
  const createSnapshot = useCallback(async (
    config: Omit<DashboardSnapshot, 'id' | 'userId' | 'createdAt'>
  ): Promise<DashboardSnapshot> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newSnapshot = engine.createSnapshot(config);
      
      // Update state
      setSnapshots(prev => [...prev, newSnapshot]);
      setCurrentSnapshot(newSnapshot);
      
      return newSnapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);
  
  const updateSnapshot = useCallback(async (
    id: string,
    updates: Partial<DashboardSnapshot>
  ): Promise<DashboardSnapshot> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedSnapshot = engine.updateSnapshot(id, updates);
      
      // Update state
      setSnapshots(prev => prev.map(snapshot =>
        snapshot.id === id ? updatedSnapshot : snapshot
      ));
      
      // Update current snapshot if it's the one being updated
      if (currentSnapshot?.id === id) {
        setCurrentSnapshot(updatedSnapshot);
      }
      
      return updatedSnapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentSnapshot]);
  
  const deleteSnapshot = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = engine.deleteSnapshot(id);
      
      if (success) {
        // Update state
        setSnapshots(prev => prev.filter(snapshot => snapshot.id !== id));
        
        // Clear current snapshot if it was deleted
        if (currentSnapshot?.id === id) {
          setCurrentSnapshot(null);
        }
        
        // Remove from selected snapshots
        setSelectedSnapshotIds(prev => prev.filter(selectedId => selectedId !== id));
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentSnapshot]);
  
  // Export/Import Operations
  const exportSnapshot = useCallback(async (request: SnapshotExportRequest): Promise<SnapshotFileInfo> => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setError(null);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const fileInfo = await engine.exportSnapshot(request);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Update snapshot in state
      const updatedSnapshot = engine.getSnapshot(request.snapshotId);
      if (updatedSnapshot) {
        setSnapshots(prev => prev.map(snapshot =>
          snapshot.id === request.snapshotId ? updatedSnapshot : snapshot
        ));
      }
      
      return fileInfo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [engine]);
  
  const importSnapshot = useCallback(async (request: SnapshotImportRequest): Promise<DashboardSnapshot[]> => {
    try {
      setIsImporting(true);
      setImportProgress(0);
      setError(null);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 15, 90));
      }, 300);
      
      const importedSnapshots = await engine.importSnapshot(request);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      // Update state with imported snapshots
      setSnapshots(prev => [...prev, ...importedSnapshots]);
      
      return importedSnapshots;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [engine]);
  
  const duplicateSnapshot = useCallback(async (id: string, newName?: string): Promise<DashboardSnapshot> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const duplicatedSnapshot = engine.duplicateSnapshot(id, newName);
      
      // Update state
      setSnapshots(prev => [...prev, duplicatedSnapshot]);
      
      return duplicatedSnapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);
  
  const shareSnapshot = useCallback(async (id: string, isPublic: boolean): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const shareUrl = engine.shareSnapshot(id, isPublic);
      
      // Update snapshot in state
      const updatedSnapshot = engine.getSnapshot(id);
      if (updatedSnapshot) {
        setSnapshots(prev => prev.map(snapshot =>
          snapshot.id === id ? updatedSnapshot : snapshot
        ));
        
        if (currentSnapshot?.id === id) {
          setCurrentSnapshot(updatedSnapshot);
        }
      }
      
      return shareUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to share snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentSnapshot]);
  
  const compareSnapshots = useCallback(async (idA: string, idB: string): Promise<SnapshotComparison> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const comparison = await engine.compareSnapshots(idA, idB);
      
      return comparison;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare snapshots';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);
  
  const applySnapshot = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await engine.applySnapshot(id);
      
      if (success) {
        const appliedSnapshot = engine.getSnapshot(id);
        if (appliedSnapshot) {
          setCurrentSnapshot(appliedSnapshot);
        }
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);
  
  const createTemplate = useCallback(async (snapshotId: string, templateName: string): Promise<SnapshotTemplate> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const template = engine.createTemplate(snapshotId, templateName);
      
      // Update templates state
      setTemplates(prev => [...prev, template]);
      
      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);
  
  // Utility Functions
  const getSnapshotStats = useCallback(async (): Promise<SnapshotStats> => {
    try {
      return await engine.getSnapshotStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get snapshot stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);
  
  const updateSettings = useCallback(async (newSettings: Partial<SnapshotSettings>): Promise<void> => {
    try {
      setSettings(prev => ({ ...prev, ...newSettings }));
      // In real implementation, would persist to backend
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);
  
  const cleanupExpired = useCallback(async (): Promise<number> => {
    try {
      const cleanedCount = engine.cleanupExpired();
      
      // Refresh snapshots list
      await loadSnapshots();
      
      return cleanedCount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup expired snapshots';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, loadSnapshots]);
  
  const searchSnapshots = useCallback(async (query: string): Promise<DashboardSnapshot[]> => {
    try {
      return engine.searchSnapshots(query);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search snapshots';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);
  
  const filterSnapshots = useCallback((filters: SnapshotFilters): DashboardSnapshot[] => {
    return snapshots.filter(snapshot => {
      // Format filter
      if (filters.formats.length > 0 && !filters.formats.includes(snapshot.exportFormat)) {
        return false;
      }
      
      // Date filters
      if (filters.dateFrom && snapshot.createdAt < filters.dateFrom) {
        return false;
      }
      
      if (filters.dateTo && snapshot.createdAt > filters.dateTo) {
        return false;
      }
      
      // Tags filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => snapshot.tags.includes(tag))) {
        return false;
      }
      
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!snapshot.name.toLowerCase().includes(query) &&
            !snapshot.description?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Public filter
      if (filters.isPublic !== undefined && snapshot.isPublic !== filters.isPublic) {
        return false;
      }
      
      // Data filter
      if (filters.hasData !== undefined && snapshot.includeData !== filters.hasData) {
        return false;
      }
      
      // Images filter
      if (filters.hasImages !== undefined && snapshot.includeImages !== filters.hasImages) {
        return false;
      }
      
      return true;
    });
  }, [snapshots]);
  
  const sortSnapshots = useCallback((
    snapshotsToSort: DashboardSnapshot[],
    sortBy: string,
    order: 'asc' | 'desc'
  ): DashboardSnapshot[] => {
    return [...snapshotsToSort].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'createdAt':
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
          break;
        case 'size':
          aVal = a.fileInfo?.fileSize || 0;
          bVal = b.fileInfo?.fileSize || 0;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);
  
  // Computed values
  const selectedSnapshots = useMemo(() => {
    return snapshots.filter(snapshot => selectedSnapshotIds.includes(snapshot.id));
  }, [snapshots, selectedSnapshotIds]);
  
  return {
    // State
    snapshots,
    templates,
    currentSnapshot,
    selectedSnapshots,
    settings,
    
    // Loading states
    isLoading,
    isExporting,
    isImporting,
    exportProgress,
    importProgress,
    
    // Error handling
    error,
    
    // Actions
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,
    exportSnapshot,
    importSnapshot,
    duplicateSnapshot,
    shareSnapshot,
    compareSnapshots,
    applySnapshot,
    createTemplate,
    
    // Utilities
    getSnapshotStats,
    updateSettings,
    cleanupExpired,
    searchSnapshots,
    filterSnapshots,
    sortSnapshots
  };
} 