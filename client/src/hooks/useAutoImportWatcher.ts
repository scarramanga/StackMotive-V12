// Block 19: Auto Import Watcher - Hook
// React hook for automated file watching and import processing

import { useState, useEffect, useCallback } from 'react';
import { AutoImportWatcherEngine } from '../engines/AutoImportWatcherEngine';
import { useAutoImportWatcherStore } from '../store/autoImportWatcherStore';
import {
  WatcherConfig,
  WatchEvent,
  ImportJob,
  FileMapping,
  WatcherStats,
  ImportResult,
  ImportType,
  FileFormat
} from '../types/autoImportWatcher';

export const useAutoImportWatcher = () => {
  const engine = AutoImportWatcherEngine.getInstance();
  const store = useAutoImportWatcherStore();

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WatcherStats | null>(null);

  // Initialize store from engine
  useEffect(() => {
    const initializeStore = async () => {
      try {
        setLoading(true);
        
        // Load watchers
        const watchers = engine.getWatchers();
        store.setWatchers(watchers);

        // Load events
        const events = engine.getEvents();
        store.setEvents(events);

        // Load jobs
        const jobs = engine.getJobs();
        store.setJobs(jobs);

        // Load mappings
        const mappings = engine.getMappings();
        store.setMappings(mappings);

        // Load stats
        const statsData = await engine.getWatcherStats();
        setStats(statsData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeStore();
  }, []);

  // Watcher Management
  const createWatcher = useCallback(async (
    config: Omit<WatcherConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<WatcherConfig> => {
    try {
      setLoading(true);
      setError(null);

      const watcher = engine.createWatcher(config);
      store.addWatcher(watcher);

      return watcher;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create watcher';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWatcher = useCallback(async (
    id: string,
    updates: Partial<WatcherConfig>
  ): Promise<WatcherConfig> => {
    try {
      setLoading(true);
      setError(null);

      const updatedWatcher = engine.updateWatcher(id, updates);
      store.updateWatcher(id, updatedWatcher);

      return updatedWatcher;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update watcher';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWatcher = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = engine.deleteWatcher(id);
      if (success) {
        store.removeWatcher(id);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete watcher';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const enableWatcher = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = engine.enableWatcher(id);
      if (success) {
        const updatedWatcher = engine.getWatcher(id);
        if (updatedWatcher) {
          store.updateWatcher(id, updatedWatcher);
        }
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable watcher';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const disableWatcher = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = engine.disableWatcher(id);
      if (success) {
        const updatedWatcher = engine.getWatcher(id);
        if (updatedWatcher) {
          store.updateWatcher(id, updatedWatcher);
        }
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable watcher';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateWatchPath = useCallback(async (path: string): Promise<{valid: boolean, error?: string}> => {
    try {
      return await engine.validateWatchPath(path);
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : 'Validation failed'
      };
    }
  }, []);

  const getWatcherHealth = useCallback(async (watcherId: string): Promise<{healthy: boolean, issues: string[]}> => {
    try {
      return await engine.getWatcherHealth(watcherId);
    } catch (err) {
      return {
        healthy: false,
        issues: [err instanceof Error ? err.message : 'Health check failed']
      };
    }
  }, []);

  // Event Processing
  const processEvent = useCallback(async (eventId: string): Promise<ImportJob> => {
    try {
      setLoading(true);
      setError(null);

      const job = await engine.processEvent(eventId);
      store.addJob(job);

      // Update event status
      const event = engine.getEvent(eventId);
      if (event) {
        store.updateEvent(eventId, event);
      }

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const reprocessEvent = useCallback(async (eventId: string): Promise<ImportJob> => {
    try {
      setLoading(true);
      setError(null);

      const job = await engine.reprocessEvent(eventId);
      store.addJob(job);

      // Update event status
      const event = engine.getEvent(eventId);
      if (event) {
        store.updateEvent(eventId, event);
      }

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reprocess event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const ignoreEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = engine.ignoreEvent(eventId);
      if (success) {
        const event = engine.getEvent(eventId);
        if (event) {
          store.updateEvent(eventId, event);
        }
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ignore event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Job Management
  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = engine.cancelJob(jobId);
      if (success) {
        const job = engine.getJob(jobId);
        if (job) {
          store.updateJob(jobId, job);
        }
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const retryJob = useCallback(async (jobId: string): Promise<ImportJob> => {
    try {
      setLoading(true);
      setError(null);

      const job = await engine.retryJob(jobId);
      store.updateJob(jobId, job);

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // File Mapping Management
  const createMapping = useCallback(async (
    mapping: Omit<FileMapping, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
  ): Promise<FileMapping> => {
    try {
      setLoading(true);
      setError(null);

      const newMapping = engine.createMapping(mapping);
      store.addMapping(newMapping);

      return newMapping;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create mapping';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMapping = useCallback(async (
    id: string,
    updates: Partial<FileMapping>
  ): Promise<FileMapping> => {
    try {
      setLoading(true);
      setError(null);

      const updatedMapping = engine.updateMapping(id, updates);
      store.updateMapping(id, updatedMapping);

      return updatedMapping;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update mapping';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMapping = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = engine.deleteMapping(id);
      if (success) {
        store.removeMapping(id);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete mapping';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const testMapping = useCallback(async (
    mappingId: string,
    filePath: string
  ): Promise<ImportResult[]> => {
    try {
      setLoading(true);
      setError(null);

      return await engine.testMapping(mappingId, filePath);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test mapping';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const previewFile = useCallback(async (
    filePath: string,
    mappingId: string
  ): Promise<{preview: any[], errors: string[]}> => {
    try {
      setLoading(true);
      setError(null);

      return await engine.previewFile(filePath, mappingId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to preview file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Statistics
  const refreshStats = useCallback(async (): Promise<WatcherStats> => {
    try {
      setLoading(true);
      setError(null);

      const statsData = await engine.getWatcherStats();
      setStats(statsData);

      return statsData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Store selectors
  const watchers = store.watchers;
  const events = store.events;
  const jobs = store.jobs;
  const mappings = store.mappings;
  const activeWatchers = watchers.filter(w => w.isActive);
  const enabledWatchers = watchers.filter(w => w.enabled);
  const pendingEvents = events.filter(e => !e.processed);
  const processingJobs = jobs.filter(j => j.status === 'processing');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const failedJobs = jobs.filter(j => j.status === 'failed');

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (activeWatchers.length > 0) {
        try {
          // Update stats
          const statsData = await engine.getWatcherStats();
          setStats(statsData);

          // Update events
          const events = engine.getEvents();
          store.setEvents(events);

          // Update jobs
          const jobs = engine.getJobs();
          store.setJobs(jobs);
        } catch (err) {
          console.error('Failed to update real-time data:', err);
        }
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [activeWatchers.length]);

  return {
    // State
    loading,
    error,
    stats,
    
    // Data
    watchers,
    events,
    jobs,
    mappings,
    
    // Filtered data
    activeWatchers,
    enabledWatchers,
    pendingEvents,
    processingJobs,
    completedJobs,
    failedJobs,
    
    // Watcher actions
    createWatcher,
    updateWatcher,
    deleteWatcher,
    enableWatcher,
    disableWatcher,
    validateWatchPath,
    getWatcherHealth,
    
    // Event actions
    processEvent,
    reprocessEvent,
    ignoreEvent,
    
    // Job actions
    cancelJob,
    retryJob,
    
    // Mapping actions
    createMapping,
    updateMapping,
    deleteMapping,
    testMapping,
    previewFile,
    
    // Statistics
    refreshStats,
    
    // Utilities
    clearError
  };
};

// Specialized hooks for specific functionality
export const useWatcherManagement = () => {
  const {
    watchers,
    activeWatchers,
    enabledWatchers,
    createWatcher,
    updateWatcher,
    deleteWatcher,
    enableWatcher,
    disableWatcher,
    validateWatchPath,
    getWatcherHealth,
    loading,
    error,
    clearError
  } = useAutoImportWatcher();

  return {
    watchers,
    activeWatchers,
    enabledWatchers,
    createWatcher,
    updateWatcher,
    deleteWatcher,
    enableWatcher,
    disableWatcher,
    validateWatchPath,
    getWatcherHealth,
    loading,
    error,
    clearError
  };
};

export const useEventProcessing = () => {
  const {
    events,
    jobs,
    pendingEvents,
    processingJobs,
    completedJobs,
    failedJobs,
    processEvent,
    reprocessEvent,
    ignoreEvent,
    cancelJob,
    retryJob,
    loading,
    error,
    clearError
  } = useAutoImportWatcher();

  return {
    events,
    jobs,
    pendingEvents,
    processingJobs,
    completedJobs,
    failedJobs,
    processEvent,
    reprocessEvent,
    ignoreEvent,
    cancelJob,
    retryJob,
    loading,
    error,
    clearError
  };
};

export const useFileMappingManagement = () => {
  const {
    mappings,
    createMapping,
    updateMapping,
    deleteMapping,
    testMapping,
    previewFile,
    loading,
    error,
    clearError
  } = useAutoImportWatcher();

  return {
    mappings,
    createMapping,
    updateMapping,
    deleteMapping,
    testMapping,
    previewFile,
    loading,
    error,
    clearError
  };
};

export const useWatcherStats = () => {
  const {
    stats,
    refreshStats,
    loading,
    error,
    clearError
  } = useAutoImportWatcher();

  return {
    stats,
    refreshStats,
    loading,
    error,
    clearError
  };
}; 