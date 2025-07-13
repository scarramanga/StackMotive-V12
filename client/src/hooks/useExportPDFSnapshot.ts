// Block 84: Export to PDF Snapshot - Hook
// React Integration for PDF Generation

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExportPDFSnapshotEngine } from '../engines/ExportPDFSnapshotEngine';
import {
  PDFSnapshot,
  PDFTemplate,
  PDFFileInfo,
  SharingConfig,
  UseExportPDFSnapshotReturn,
  ExportStatus
} from '../types/exportPdfSnapshot';

export const useExportPDFSnapshot = (): UseExportPDFSnapshotReturn => {
  // Core state
  const [snapshots, setSnapshots] = useState<PDFSnapshot[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState<PDFSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation state
  const [generatingSnapshots, setGeneratingSnapshots] = useState<Set<string>>(new Set());

  // Engine instance
  const engine = useMemo(() => ExportPDFSnapshotEngine.getInstance(), []);

  // Initialize data
  useEffect(() => {
    loadSnapshots();
  }, []);

  // Auto-refresh for generating snapshots
  useEffect(() => {
    if (generatingSnapshots.size > 0) {
      const interval = setInterval(() => {
        refreshGeneratingSnapshots();
      }, 2000); // 2 second refresh

      return () => clearInterval(interval);
    }
  }, [generatingSnapshots.size]);

  // Load all snapshots
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
      setError(err instanceof Error ? err.message : 'Failed to load snapshots');
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentSnapshot]);

  // Create new snapshot
  const createSnapshot = useCallback(async (
    config: Omit<PDFSnapshot, 'id' | 'userId' | 'createdAt'>
  ): Promise<PDFSnapshot> => {
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

  // Update snapshot
  const updateSnapshot = useCallback(async (
    id: string,
    updates: Partial<PDFSnapshot>
  ): Promise<PDFSnapshot> => {
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

  // Delete snapshot
  const deleteSnapshot = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      engine.deleteSnapshot(id);

      // Update state
      setSnapshots(prev => prev.filter(snapshot => snapshot.id !== id));

      // Clear current snapshot if it was deleted
      if (currentSnapshot?.id === id) {
        const remainingSnapshots = snapshots.filter(snapshot => snapshot.id !== id);
        setCurrentSnapshot(remainingSnapshots.length > 0 ? remainingSnapshots[0] : null);
      }

      // Remove from generating set if it was being generated
      setGeneratingSnapshots(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentSnapshot, snapshots]);

  // Generate PDF
  const generatePDF = useCallback(async (snapshotId: string): Promise<PDFFileInfo> => {
    try {
      setIsGenerating(true);
      setError(null);

      // Add to generating set
      setGeneratingSnapshots(prev => new Set(prev).add(snapshotId));

      // Update snapshot status in local state
      setSnapshots(prev => prev.map(snapshot => {
        if (snapshot.id === snapshotId) {
          return { ...snapshot, status: 'generating' };
        }
        return snapshot;
      }));

      const fileInfo = await engine.generatePDF(snapshotId);

      // Update snapshot with completion
      const updatedSnapshot = engine.getSnapshot(snapshotId);
      if (updatedSnapshot) {
        setSnapshots(prev => prev.map(snapshot =>
          snapshot.id === snapshotId ? updatedSnapshot : snapshot
        ));

        if (currentSnapshot?.id === snapshotId) {
          setCurrentSnapshot(updatedSnapshot);
        }
      }

      return fileInfo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);

      // Update snapshot status to failed
      setSnapshots(prev => prev.map(snapshot => {
        if (snapshot.id === snapshotId) {
          return { ...snapshot, status: 'failed' };
        }
        return snapshot;
      }));

      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
      
      // Remove from generating set
      setGeneratingSnapshots(prev => {
        const updated = new Set(prev);
        updated.delete(snapshotId);
        return updated;
      });
    }
  }, [engine, currentSnapshot]);

  // Download PDF
  const downloadPDF = useCallback(async (snapshotId: string): Promise<void> => {
    try {
      setIsExporting(true);
      setError(null);

      await engine.downloadPDF(snapshotId);

      // Update download count in local state
      const updatedSnapshot = engine.getSnapshot(snapshotId);
      if (updatedSnapshot) {
        setSnapshots(prev => prev.map(snapshot =>
          snapshot.id === snapshotId ? updatedSnapshot : snapshot
        ));

        if (currentSnapshot?.id === snapshotId) {
          setCurrentSnapshot(updatedSnapshot);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download PDF';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [engine, currentSnapshot]);

  // Preview PDF
  const previewPDF = useCallback(async (snapshotId: string): Promise<string> => {
    try {
      setError(null);
      return await engine.previewPDF(snapshotId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  // Template operations
  const getTemplates = useCallback((): PDFTemplate[] => {
    try {
      return engine.getTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get templates');
      return [];
    }
  }, [engine]);

  const createTemplate = useCallback(async (
    template: Omit<PDFTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PDFTemplate> => {
    try {
      setError(null);
      return engine.createTemplate(template);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const updateTemplate = useCallback(async (
    id: string,
    updates: Partial<PDFTemplate>
  ): Promise<PDFTemplate> => {
    try {
      setError(null);
      return engine.updateTemplate(id, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  // Sharing operations
  const shareSnapshot = useCallback(async (
    snapshotId: string,
    sharingConfig: SharingConfig
  ): Promise<string> => {
    try {
      setError(null);
      const shareUrl = await engine.shareSnapshot(snapshotId, sharingConfig);

      // Update snapshot in local state
      const updatedSnapshot = engine.getSnapshot(snapshotId);
      if (updatedSnapshot) {
        setSnapshots(prev => prev.map(snapshot =>
          snapshot.id === snapshotId ? updatedSnapshot : snapshot
        ));

        if (currentSnapshot?.id === snapshotId) {
          setCurrentSnapshot(updatedSnapshot);
        }
      }

      return shareUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to share snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentSnapshot]);

  const getSharedSnapshot = useCallback(async (shareId: string): Promise<PDFSnapshot> => {
    try {
      setError(null);
      return await engine.getSharedSnapshot(shareId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get shared snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  // Cancel generation
  const cancelGeneration = useCallback((snapshotId: string) => {
    try {
      engine.cancelGeneration(snapshotId);
      
      // Remove from generating set
      setGeneratingSnapshots(prev => {
        const updated = new Set(prev);
        updated.delete(snapshotId);
        return updated;
      });

      // Update snapshot status
      setSnapshots(prev => prev.map(snapshot => {
        if (snapshot.id === snapshotId) {
          return { ...snapshot, status: 'cancelled' };
        }
        return snapshot;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel generation');
    }
  }, [engine]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh generating snapshots
  const refreshGeneratingSnapshots = useCallback(() => {
    const generatingIds = Array.from(generatingSnapshots);
    
    generatingIds.forEach(id => {
      const snapshot = engine.getSnapshot(id);
      if (snapshot) {
        setSnapshots(prev => prev.map(s => s.id === id ? snapshot : s));
        
        if (currentSnapshot?.id === id) {
          setCurrentSnapshot(snapshot);
        }

        // Remove from generating set if completed or failed
        if (snapshot.status === 'completed' || snapshot.status === 'failed' || snapshot.status === 'cancelled') {
          setGeneratingSnapshots(prev => {
            const updated = new Set(prev);
            updated.delete(id);
            return updated;
          });
        }
      }
    });
  }, [generatingSnapshots, engine, currentSnapshot]);

  // Computed values
  const snapshotStats = useMemo(() => {
    if (snapshots.length === 0) return null;

    const completedSnapshots = snapshots.filter(s => s.status === 'completed').length;
    const generatingSnapshotsCount = snapshots.filter(s => s.status === 'generating').length;
    const failedSnapshots = snapshots.filter(s => s.status === 'failed').length;
    const sharedSnapshots = snapshots.filter(s => s.sharingConfig.isShareable).length;
    
    const totalFileSize = snapshots.reduce((sum, snapshot) => 
      sum + (snapshot.fileInfo?.fileSize || 0), 0
    );
    
    const totalDownloads = snapshots.reduce((sum, snapshot) => 
      sum + (snapshot.fileInfo?.downloadCount || 0), 0
    );

    return {
      totalSnapshots: snapshots.length,
      completedSnapshots,
      generatingSnapshots: generatingSnapshotsCount,
      failedSnapshots,
      sharedSnapshots,
      totalFileSize,
      totalDownloads,
      averageFileSize: completedSnapshots > 0 ? totalFileSize / completedSnapshots : 0
    };
  }, [snapshots]);

  // Filter snapshots by status
  const getSnapshotsByStatus = useCallback((status: ExportStatus) => {
    return snapshots.filter(snapshot => snapshot.status === status);
  }, [snapshots]);

  // Get snapshots that are currently being generated
  const getGeneratingSnapshots = useCallback(() => {
    return snapshots.filter(snapshot => generatingSnapshots.has(snapshot.id));
  }, [snapshots, generatingSnapshots]);

  // Quick actions
  const quickActions = useMemo(() => ({
    // Generate all pending snapshots
    generateAllPending: async () => {
      const pendingSnapshots = snapshots.filter(s => s.status === 'pending');
      for (const snapshot of pendingSnapshots) {
        try {
          await generatePDF(snapshot.id);
        } catch (error) {
          console.error(`Failed to generate PDF for snapshot ${snapshot.id}:`, error);
        }
      }
    },

    // Delete all failed snapshots
    deleteAllFailed: async () => {
      const failedSnapshots = snapshots.filter(s => s.status === 'failed');
      for (const snapshot of failedSnapshots) {
        try {
          await deleteSnapshot(snapshot.id);
        } catch (error) {
          console.error(`Failed to delete snapshot ${snapshot.id}:`, error);
        }
      }
    },

    // Get expired snapshots
    getExpiredSnapshots: () => {
      const now = new Date();
      return snapshots.filter(snapshot => 
        snapshot.expiresAt && snapshot.expiresAt < now
      );
    },

    // Cleanup expired snapshots
    cleanupExpired: async () => {
      const expiredSnapshots = quickActions.getExpiredSnapshots();
      for (const snapshot of expiredSnapshots) {
        try {
          await deleteSnapshot(snapshot.id);
        } catch (error) {
          console.error(`Failed to cleanup expired snapshot ${snapshot.id}:`, error);
        }
      }
    }
  }), [snapshots, generatePDF, deleteSnapshot]);

  return {
    // Data
    snapshots,
    currentSnapshot,

    // Loading states
    isLoading,
    isGenerating,
    isExporting,

    // Snapshot operations
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,

    // Generation operations
    generatePDF,
    downloadPDF,
    previewPDF,

    // Template operations
    getTemplates,
    createTemplate,
    updateTemplate,

    // Sharing operations
    shareSnapshot,
    getSharedSnapshot,

    // Error handling
    error,
    clearError,

    // Additional computed values
    snapshotStats,

    // Utility functions
    setCurrentSnapshot,
    refreshData: loadSnapshots,
    cancelGeneration,
    getSnapshotsByStatus,
    getGeneratingSnapshots,

    // Quick actions
    quickActions,

    // Status tracking
    generatingSnapshots: Array.from(generatingSnapshots)
  };
};

export default useExportPDFSnapshot; 