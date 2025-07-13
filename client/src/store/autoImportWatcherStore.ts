// Block 19: Auto Import Watcher - Store
// Zustand store for automated file watching and import processing

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  WatcherConfig,
  WatchEvent,
  ImportJob,
  FileMapping,
  WatcherSettings,
  ImportType,
  FileFormat,
  JobStatus,
  WatchEventType
} from '../types/autoImportWatcher';

interface AutoImportWatcherState {
  // Data
  watchers: WatcherConfig[];
  events: WatchEvent[];
  jobs: ImportJob[];
  mappings: FileMapping[];
  settings: WatcherSettings;
  
  // UI State
  selectedWatcher: string | null;
  selectedEvent: string | null;
  selectedJob: string | null;
  selectedMapping: string | null;
  
  // View State
  watcherView: 'list' | 'grid' | 'tree';
  eventView: 'list' | 'timeline';
  jobView: 'list' | 'details';
  mappingView: 'list' | 'visual';
  
  // Filter State
  watcherFilter: {
    status: 'all' | 'active' | 'inactive' | 'error';
    type: ImportType | 'all';
    search: string;
  };
  eventFilter: {
    type: WatchEventType | 'all';
    processed: 'all' | 'processed' | 'unprocessed';
    timeRange: 'all' | 'today' | 'week' | 'month';
    search: string;
  };
  jobFilter: {
    status: JobStatus | 'all';
    watcher: string | 'all';
    timeRange: 'all' | 'today' | 'week' | 'month';
    search: string;
  };
  mappingFilter: {
    type: ImportType | 'all';
    format: FileFormat | 'all';
    system: 'all' | 'system' | 'custom';
    search: string;
  };
  
  // Sort State
  watcherSort: {
    field: 'name' | 'createdAt' | 'updatedAt' | 'status';
    direction: 'asc' | 'desc';
  };
  eventSort: {
    field: 'timestamp' | 'fileName' | 'eventType' | 'processed';
    direction: 'asc' | 'desc';
  };
  jobSort: {
    field: 'startedAt' | 'status' | 'processingTime' | 'successfulRecords';
    direction: 'asc' | 'desc';
  };
  mappingSort: {
    field: 'name' | 'createdAt' | 'usageCount' | 'importType';
    direction: 'asc' | 'desc';
  };
  
  // Actions
  setWatchers: (watchers: WatcherConfig[]) => void;
  addWatcher: (watcher: WatcherConfig) => void;
  updateWatcher: (id: string, updates: Partial<WatcherConfig>) => void;
  removeWatcher: (id: string) => void;
  setSelectedWatcher: (id: string | null) => void;
  setWatcherView: (view: 'list' | 'grid' | 'tree') => void;
  setWatcherFilter: (filter: Partial<AutoImportWatcherState['watcherFilter']>) => void;
  setWatcherSort: (sort: AutoImportWatcherState['watcherSort']) => void;
  
  setEvents: (events: WatchEvent[]) => void;
  addEvent: (event: WatchEvent) => void;
  updateEvent: (id: string, updates: Partial<WatchEvent>) => void;
  removeEvent: (id: string) => void;
  setSelectedEvent: (id: string | null) => void;
  setEventView: (view: 'list' | 'timeline') => void;
  setEventFilter: (filter: Partial<AutoImportWatcherState['eventFilter']>) => void;
  setEventSort: (sort: AutoImportWatcherState['eventSort']) => void;
  
  setJobs: (jobs: ImportJob[]) => void;
  addJob: (job: ImportJob) => void;
  updateJob: (id: string, updates: Partial<ImportJob>) => void;
  removeJob: (id: string) => void;
  setSelectedJob: (id: string | null) => void;
  setJobView: (view: 'list' | 'details') => void;
  setJobFilter: (filter: Partial<AutoImportWatcherState['jobFilter']>) => void;
  setJobSort: (sort: AutoImportWatcherState['jobSort']) => void;
  
  setMappings: (mappings: FileMapping[]) => void;
  addMapping: (mapping: FileMapping) => void;
  updateMapping: (id: string, updates: Partial<FileMapping>) => void;
  removeMapping: (id: string) => void;
  setSelectedMapping: (id: string | null) => void;
  setMappingView: (view: 'list' | 'visual') => void;
  setMappingFilter: (filter: Partial<AutoImportWatcherState['mappingFilter']>) => void;
  setMappingSort: (sort: AutoImportWatcherState['mappingSort']) => void;
  
  setSettings: (settings: WatcherSettings) => void;
  updateSettings: (updates: Partial<WatcherSettings>) => void;
  
  // Computed getters
  getWatcher: (id: string) => WatcherConfig | undefined;
  getEvent: (id: string) => WatchEvent | undefined;
  getJob: (id: string) => ImportJob | undefined;
  getMapping: (id: string) => FileMapping | undefined;
  getFilteredWatchers: () => WatcherConfig[];
  getFilteredEvents: () => WatchEvent[];
  getFilteredJobs: () => ImportJob[];
  getFilteredMappings: () => FileMapping[];
  getSortedWatchers: () => WatcherConfig[];
  getSortedEvents: () => WatchEvent[];
  getSortedJobs: () => ImportJob[];
  getSortedMappings: () => FileMapping[];
  
  // Utility actions
  clearAllSelections: () => void;
  resetFilters: () => void;
  resetSorting: () => void;
  clearExpiredJobs: () => void;
  getWatcherStats: () => {
    total: number;
    active: number;
    error: number;
    pendingEvents: number;
    processingJobs: number;
  };
}

export const useAutoImportWatcherStore = create<AutoImportWatcherState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial Data
        watchers: [],
        events: [],
        jobs: [],
        mappings: [],
        settings: {
          autoProcess: true,
          notifications: true,
          maxConcurrentJobs: 5,
          jobRetentionDays: 30,
          eventRetentionDays: 7,
          enableLogging: true,
          logLevel: 'info'
        },
        
        // Initial UI State
        selectedWatcher: null,
        selectedEvent: null,
        selectedJob: null,
        selectedMapping: null,
        
        // Initial View State
        watcherView: 'list',
        eventView: 'list',
        jobView: 'list',
        mappingView: 'list',
        
        // Initial Filter State
        watcherFilter: {
          status: 'all',
          type: 'all',
          search: ''
        },
        eventFilter: {
          type: 'all',
          processed: 'all',
          timeRange: 'all',
          search: ''
        },
        jobFilter: {
          status: 'all',
          watcher: 'all',
          timeRange: 'all',
          search: ''
        },
        mappingFilter: {
          type: 'all',
          format: 'all',
          system: 'all',
          search: ''
        },
        
        // Initial Sort State
        watcherSort: {
          field: 'updatedAt',
          direction: 'desc'
        },
        eventSort: {
          field: 'timestamp',
          direction: 'desc'
        },
        jobSort: {
          field: 'startedAt',
          direction: 'desc'
        },
        mappingSort: {
          field: 'name',
          direction: 'asc'
        },
        
        // Watcher Actions
        setWatchers: (watchers) => set({ watchers }),
        addWatcher: (watcher) => set((state) => ({ 
          watchers: [...state.watchers, watcher] 
        })),
        updateWatcher: (id, updates) => set((state) => ({
          watchers: state.watchers.map(w => 
            w.id === id ? { ...w, ...updates } : w
          )
        })),
        removeWatcher: (id) => set((state) => ({
          watchers: state.watchers.filter(w => w.id !== id),
          selectedWatcher: state.selectedWatcher === id ? null : state.selectedWatcher
        })),
        setSelectedWatcher: (id) => set({ selectedWatcher: id }),
        setWatcherView: (view) => set({ watcherView: view }),
        setWatcherFilter: (filter) => set((state) => ({
          watcherFilter: { ...state.watcherFilter, ...filter }
        })),
        setWatcherSort: (sort) => set({ watcherSort: sort }),
        
        // Event Actions
        setEvents: (events) => set({ events }),
        addEvent: (event) => set((state) => ({ 
          events: [...state.events, event] 
        })),
        updateEvent: (id, updates) => set((state) => ({
          events: state.events.map(e => 
            e.id === id ? { ...e, ...updates } : e
          )
        })),
        removeEvent: (id) => set((state) => ({
          events: state.events.filter(e => e.id !== id),
          selectedEvent: state.selectedEvent === id ? null : state.selectedEvent
        })),
        setSelectedEvent: (id) => set({ selectedEvent: id }),
        setEventView: (view) => set({ eventView: view }),
        setEventFilter: (filter) => set((state) => ({
          eventFilter: { ...state.eventFilter, ...filter }
        })),
        setEventSort: (sort) => set({ eventSort: sort }),
        
        // Job Actions
        setJobs: (jobs) => set({ jobs }),
        addJob: (job) => set((state) => ({ 
          jobs: [...state.jobs, job] 
        })),
        updateJob: (id, updates) => set((state) => ({
          jobs: state.jobs.map(j => 
            j.id === id ? { ...j, ...updates } : j
          )
        })),
        removeJob: (id) => set((state) => ({
          jobs: state.jobs.filter(j => j.id !== id),
          selectedJob: state.selectedJob === id ? null : state.selectedJob
        })),
        setSelectedJob: (id) => set({ selectedJob: id }),
        setJobView: (view) => set({ jobView: view }),
        setJobFilter: (filter) => set((state) => ({
          jobFilter: { ...state.jobFilter, ...filter }
        })),
        setJobSort: (sort) => set({ jobSort: sort }),
        
        // Mapping Actions
        setMappings: (mappings) => set({ mappings }),
        addMapping: (mapping) => set((state) => ({ 
          mappings: [...state.mappings, mapping] 
        })),
        updateMapping: (id, updates) => set((state) => ({
          mappings: state.mappings.map(m => 
            m.id === id ? { ...m, ...updates } : m
          )
        })),
        removeMapping: (id) => set((state) => ({
          mappings: state.mappings.filter(m => m.id !== id),
          selectedMapping: state.selectedMapping === id ? null : state.selectedMapping
        })),
        setSelectedMapping: (id) => set({ selectedMapping: id }),
        setMappingView: (view) => set({ mappingView: view }),
        setMappingFilter: (filter) => set((state) => ({
          mappingFilter: { ...state.mappingFilter, ...filter }
        })),
        setMappingSort: (sort) => set({ mappingSort: sort }),
        
        // Settings Actions
        setSettings: (settings) => set({ settings }),
        updateSettings: (updates) => set((state) => ({
          settings: { ...state.settings, ...updates }
        })),
        
        // Computed getters
        getWatcher: (id) => {
          const state = get();
          return state.watchers.find(w => w.id === id);
        },
        getEvent: (id) => {
          const state = get();
          return state.events.find(e => e.id === id);
        },
        getJob: (id) => {
          const state = get();
          return state.jobs.find(j => j.id === id);
        },
        getMapping: (id) => {
          const state = get();
          return state.mappings.find(m => m.id === id);
        },
        
        getFilteredWatchers: () => {
          const state = get();
          let filtered = state.watchers;
          
          // Filter by status
          if (state.watcherFilter.status !== 'all') {
            filtered = filtered.filter(w => {
              switch (state.watcherFilter.status) {
                case 'active': return w.isActive;
                case 'inactive': return !w.isActive;
                case 'error': return w.lastError !== undefined;
                default: return true;
              }
            });
          }
          
          // Filter by type
          if (state.watcherFilter.type !== 'all') {
            filtered = filtered.filter(w => w.importType === state.watcherFilter.type);
          }
          
          // Filter by search
          if (state.watcherFilter.search) {
            const search = state.watcherFilter.search.toLowerCase();
            filtered = filtered.filter(w => 
              w.name.toLowerCase().includes(search) ||
              w.description?.toLowerCase().includes(search) ||
              w.watchPath.toLowerCase().includes(search)
            );
          }
          
          return filtered;
        },
        
        getFilteredEvents: () => {
          const state = get();
          let filtered = state.events;
          
          // Filter by type
          if (state.eventFilter.type !== 'all') {
            filtered = filtered.filter(e => e.eventType === state.eventFilter.type);
          }
          
          // Filter by processed status
          if (state.eventFilter.processed !== 'all') {
            filtered = filtered.filter(e => 
              state.eventFilter.processed === 'processed' ? e.processed : !e.processed
            );
          }
          
          // Filter by time range
          if (state.eventFilter.timeRange !== 'all') {
            const now = new Date();
            let cutoff: Date;
            
            switch (state.eventFilter.timeRange) {
              case 'today':
                cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
              case 'week':
                cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
              case 'month':
                cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
              default:
                cutoff = new Date(0);
            }
            
            filtered = filtered.filter(e => e.timestamp >= cutoff);
          }
          
          // Filter by search
          if (state.eventFilter.search) {
            const search = state.eventFilter.search.toLowerCase();
            filtered = filtered.filter(e => 
              e.fileName.toLowerCase().includes(search) ||
              e.filePath.toLowerCase().includes(search)
            );
          }
          
          return filtered;
        },
        
        getFilteredJobs: () => {
          const state = get();
          let filtered = state.jobs;
          
          // Filter by status
          if (state.jobFilter.status !== 'all') {
            filtered = filtered.filter(j => j.status === state.jobFilter.status);
          }
          
          // Filter by watcher
          if (state.jobFilter.watcher !== 'all') {
            filtered = filtered.filter(j => j.watcherId === state.jobFilter.watcher);
          }
          
          // Filter by time range
          if (state.jobFilter.timeRange !== 'all') {
            const now = new Date();
            let cutoff: Date;
            
            switch (state.jobFilter.timeRange) {
              case 'today':
                cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
              case 'week':
                cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
              case 'month':
                cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
              default:
                cutoff = new Date(0);
            }
            
            filtered = filtered.filter(j => j.startedAt >= cutoff);
          }
          
          // Filter by search
          if (state.jobFilter.search) {
            const search = state.jobFilter.search.toLowerCase();
            filtered = filtered.filter(j => 
              j.originalFileName?.toLowerCase().includes(search) ||
              j.filePath.toLowerCase().includes(search)
            );
          }
          
          return filtered;
        },
        
        getFilteredMappings: () => {
          const state = get();
          let filtered = state.mappings;
          
          // Filter by type
          if (state.mappingFilter.type !== 'all') {
            filtered = filtered.filter(m => m.importType === state.mappingFilter.type);
          }
          
          // Filter by format
          if (state.mappingFilter.format !== 'all') {
            filtered = filtered.filter(m => m.fileFormat === state.mappingFilter.format);
          }
          
          // Filter by system/custom
          if (state.mappingFilter.system !== 'all') {
            filtered = filtered.filter(m => 
              state.mappingFilter.system === 'system' ? m.isSystem : !m.isSystem
            );
          }
          
          // Filter by search
          if (state.mappingFilter.search) {
            const search = state.mappingFilter.search.toLowerCase();
            filtered = filtered.filter(m => 
              m.name.toLowerCase().includes(search) ||
              m.description?.toLowerCase().includes(search)
            );
          }
          
          return filtered;
        },
        
        getSortedWatchers: () => {
          const state = get();
          const filtered = state.getFilteredWatchers();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.watcherSort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
              case 'createdAt':
                aValue = a.createdAt;
                bValue = b.createdAt;
                break;
              case 'updatedAt':
                aValue = a.updatedAt;
                bValue = b.updatedAt;
                break;
              case 'status':
                aValue = a.isActive ? 'active' : 'inactive';
                bValue = b.isActive ? 'active' : 'inactive';
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        getSortedEvents: () => {
          const state = get();
          const filtered = state.getFilteredEvents();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.eventSort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'timestamp':
                aValue = a.timestamp;
                bValue = b.timestamp;
                break;
              case 'fileName':
                aValue = a.fileName;
                bValue = b.fileName;
                break;
              case 'eventType':
                aValue = a.eventType;
                bValue = b.eventType;
                break;
              case 'processed':
                aValue = a.processed;
                bValue = b.processed;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        getSortedJobs: () => {
          const state = get();
          const filtered = state.getFilteredJobs();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.jobSort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'startedAt':
                aValue = a.startedAt;
                bValue = b.startedAt;
                break;
              case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
              case 'processingTime':
                aValue = a.processingTime;
                bValue = b.processingTime;
                break;
              case 'successfulRecords':
                aValue = a.successfulRecords;
                bValue = b.successfulRecords;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        getSortedMappings: () => {
          const state = get();
          const filtered = state.getFilteredMappings();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.mappingSort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
              case 'createdAt':
                aValue = a.createdAt;
                bValue = b.createdAt;
                break;
              case 'usageCount':
                aValue = a.usageCount;
                bValue = b.usageCount;
                break;
              case 'importType':
                aValue = a.importType;
                bValue = b.importType;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        // Utility actions
        clearAllSelections: () => set({ 
          selectedWatcher: null,
          selectedEvent: null,
          selectedJob: null,
          selectedMapping: null
        }),
        
        resetFilters: () => set({
          watcherFilter: { status: 'all', type: 'all', search: '' },
          eventFilter: { type: 'all', processed: 'all', timeRange: 'all', search: '' },
          jobFilter: { status: 'all', watcher: 'all', timeRange: 'all', search: '' },
          mappingFilter: { type: 'all', format: 'all', system: 'all', search: '' }
        }),
        
        resetSorting: () => set({
          watcherSort: { field: 'updatedAt', direction: 'desc' },
          eventSort: { field: 'timestamp', direction: 'desc' },
          jobSort: { field: 'startedAt', direction: 'desc' },
          mappingSort: { field: 'name', direction: 'asc' }
        }),
        
        clearExpiredJobs: () => set((state) => {
          const retentionDate = new Date();
          retentionDate.setDate(retentionDate.getDate() - state.settings.jobRetentionDays);
          
          return {
            jobs: state.jobs.filter(job => 
              job.startedAt >= retentionDate || job.status === 'processing'
            )
          };
        }),
        
        getWatcherStats: () => {
          const state = get();
          const events = state.events;
          const jobs = state.jobs;
          
          return {
            total: state.watchers.length,
            active: state.watchers.filter(w => w.isActive).length,
            error: state.watchers.filter(w => w.lastError !== undefined).length,
            pendingEvents: events.filter(e => !e.processed).length,
            processingJobs: jobs.filter(j => j.status === 'processing').length
          };
        }
      }),
      {
        name: 'auto-import-watcher-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist settings and UI preferences
          settings: state.settings,
          watcherView: state.watcherView,
          eventView: state.eventView,
          jobView: state.jobView,
          mappingView: state.mappingView,
          watcherFilter: state.watcherFilter,
          eventFilter: state.eventFilter,
          jobFilter: state.jobFilter,
          mappingFilter: state.mappingFilter,
          watcherSort: state.watcherSort,
          eventSort: state.eventSort,
          jobSort: state.jobSort,
          mappingSort: state.mappingSort
        }),
        version: 1
      }
    )
  )
);

// Selector hooks for specific data
export const useWatcherData = () => useAutoImportWatcherStore(state => ({
  watchers: state.watchers,
  selectedWatcher: state.selectedWatcher,
  watcherView: state.watcherView,
  getWatcher: state.getWatcher,
  getSortedWatchers: state.getSortedWatchers
}));

export const useEventData = () => useAutoImportWatcherStore(state => ({
  events: state.events,
  selectedEvent: state.selectedEvent,
  eventView: state.eventView,
  getEvent: state.getEvent,
  getSortedEvents: state.getSortedEvents
}));

export const useJobData = () => useAutoImportWatcherStore(state => ({
  jobs: state.jobs,
  selectedJob: state.selectedJob,
  jobView: state.jobView,
  getJob: state.getJob,
  getSortedJobs: state.getSortedJobs
}));

export const useMappingData = () => useAutoImportWatcherStore(state => ({
  mappings: state.mappings,
  selectedMapping: state.selectedMapping,
  mappingView: state.mappingView,
  getMapping: state.getMapping,
  getSortedMappings: state.getSortedMappings
}));

export const useWatcherSettings = () => useAutoImportWatcherStore(state => ({
  settings: state.settings,
  setSettings: state.setSettings,
  updateSettings: state.updateSettings
}));

export const useWatcherStats = () => useAutoImportWatcherStore(state => ({
  getWatcherStats: state.getWatcherStats
})); 