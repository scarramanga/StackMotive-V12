// Block 43: Rebalance Timing Alert Engine - Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  RebalanceTimer, 
  TimingStrategy, 
  RebalanceAlert, 
  TimingRule,
  TimingFilter,
  TimingStats
} from '../types/rebalanceTiming';
import { rebalanceTimingEngine } from '../engines/RebalanceTimingEngine';

interface RebalanceTimingStore {
  // State
  timers: RebalanceTimer[];
  rules: TimingRule[];
  alerts: RebalanceAlert[];
  selectedTimer: RebalanceTimer | null;
  filter: TimingFilter;
  isLoading: boolean;
  error: string | null;
  stats: TimingStats | null;
  upcomingTriggers: Array<{timer: RebalanceTimer, triggerTime: Date}>;
  
  // Actions
  initialize: () => Promise<void>;
  createTimer: (strategyId: string, name: string, strategy: TimingStrategy, userId?: string) => Promise<RebalanceTimer>;
  startTimer: (timerId: string) => Promise<boolean>;
  stopTimer: (timerId: string) => Promise<boolean>;
  updateTimer: (timerId: string, updates: Partial<RebalanceTimer>) => Promise<boolean>;
  deleteTimer: (timerId: string) => Promise<boolean>;
  triggerRebalance: (timerId: string, reason?: string) => Promise<RebalanceAlert | null>;
  acknowledgeAlert: (alertId: string, userId?: string) => Promise<boolean>;
  processDueTimers: () => Promise<RebalanceAlert[]>;
  createRule: (rule: Omit<TimingRule, 'id' | 'createdAt'>) => Promise<TimingRule>;
  refreshData: () => Promise<void>;
  
  // Getters
  getTimer: (timerId: string) => RebalanceTimer | undefined;
  getAlert: (alertId: string) => RebalanceAlert | undefined;
  getFilteredTimers: () => RebalanceTimer[];
  getFilteredAlerts: () => RebalanceAlert[];
  getUpcomingTriggers: (days?: number) => Array<{timer: RebalanceTimer, triggerTime: Date}>;
  getRecentAlerts: (hours?: number) => RebalanceAlert[];
  getDueTimers: () => RebalanceTimer[];
  
  // Filters
  setFilter: (filter: TimingFilter) => void;
  clearFilter: () => void;
  setSelectedTimer: (timer: RebalanceTimer | null) => void;
  
  // Bulk operations
  bulkStartTimers: (timerIds: string[]) => Promise<number>;
  bulkStopTimers: (timerIds: string[]) => Promise<number>;
  bulkDeleteTimers: (timerIds: string[]) => Promise<number>;
  bulkAcknowledgeAlerts: (alertIds: string[], userId?: string) => Promise<number>;
  
  // Utilities
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRebalanceTimingStore = create<RebalanceTimingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      timers: [],
      rules: [],
      alerts: [],
      selectedTimer: null,
      filter: {},
      isLoading: false,
      error: null,
      stats: null,
      upcomingTriggers: [],
      
      // Initialize store
      initialize: async () => {
        try {
          set({ isLoading: true });
          await get().refreshData();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize',
            isLoading: false
          });
        }
      },
      
      // Create timer
      createTimer: async (strategyId: string, name: string, strategy: TimingStrategy, userId?: string) => {
        try {
          set({ isLoading: true });
          const timer = rebalanceTimingEngine.createTimer(strategyId, name, strategy, userId);
          await get().refreshData();
          return timer;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create timer',
            isLoading: false
          });
          throw error;
        }
      },
      
      // Start timer
      startTimer: async (timerId: string) => {
        try {
          set({ isLoading: true });
          const success = rebalanceTimingEngine.startTimer(timerId);
          if (success) {
            await get().refreshData();
          }
          return success;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to start timer',
            isLoading: false
          });
          return false;
        }
      },
      
      // Stop timer
      stopTimer: async (timerId: string) => {
        try {
          set({ isLoading: true });
          const success = rebalanceTimingEngine.stopTimer(timerId);
          if (success) {
            await get().refreshData();
          }
          return success;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to stop timer',
            isLoading: false
          });
          return false;
        }
      },
      
      // Update timer
      updateTimer: async (timerId: string, updates: Partial<RebalanceTimer>) => {
        try {
          set({ isLoading: true });
          const success = rebalanceTimingEngine.updateTimer(timerId, updates);
          if (success) {
            await get().refreshData();
          }
          return success;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update timer',
            isLoading: false
          });
          return false;
        }
      },
      
      // Delete timer
      deleteTimer: async (timerId: string) => {
        try {
          set({ isLoading: true });
          const success = rebalanceTimingEngine.deleteTimer(timerId);
          if (success) {
            set(state => ({
              selectedTimer: state.selectedTimer?.id === timerId ? null : state.selectedTimer
            }));
            await get().refreshData();
          }
          return success;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete timer',
            isLoading: false
          });
          return false;
        }
      },
      
      // Trigger rebalance
      triggerRebalance: async (timerId: string, reason: string = 'Manual trigger') => {
        try {
          set({ isLoading: true });
          const alert = rebalanceTimingEngine.triggerRebalance(timerId, reason);
          if (alert) {
            await get().refreshData();
          }
          return alert;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to trigger rebalance',
            isLoading: false
          });
          return null;
        }
      },
      
      // Acknowledge alert
      acknowledgeAlert: async (alertId: string, userId?: string) => {
        try {
          set({ isLoading: true });
          const success = rebalanceTimingEngine.acknowledgeAlert(alertId, userId);
          if (success) {
            await get().refreshData();
          }
          return success;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to acknowledge alert',
            isLoading: false
          });
          return false;
        }
      },
      
      // Process due timers
      processDueTimers: async () => {
        try {
          const alerts = rebalanceTimingEngine.processDueTimers();
          if (alerts.length > 0) {
            await get().refreshData();
          }
          return alerts;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to process due timers'
          });
          return [];
        }
      },
      
      // Create rule
      createRule: async (rule: Omit<TimingRule, 'id' | 'createdAt'>) => {
        try {
          set({ isLoading: true });
          const newRule = rebalanceTimingEngine.createRule(rule);
          await get().refreshData();
          return newRule;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create rule',
            isLoading: false
          });
          throw error;
        }
      },
      
      // Refresh data
      refreshData: async () => {
        try {
          set({ isLoading: true });
          
          const timers = rebalanceTimingEngine.getAllTimers();
          const rules = rebalanceTimingEngine.getAllRules();
          const alerts = rebalanceTimingEngine.getRecentAlerts(168); // 7 days
          const stats = rebalanceTimingEngine.getTimingStats();
          const upcomingTriggers = rebalanceTimingEngine.getUpcomingTriggers(7);
          
          set({
            timers,
            rules,
            alerts,
            stats,
            upcomingTriggers,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh data',
            isLoading: false
          });
        }
      },
      
      // Get timer by ID
      getTimer: (timerId: string) => {
        return rebalanceTimingEngine.getTimer(timerId);
      },
      
      // Get alert by ID
      getAlert: (alertId: string) => {
        return rebalanceTimingEngine.getAlert(alertId);
      },
      
      // Get filtered timers
      getFilteredTimers: () => {
        const { timers, filter } = get();
        let filtered = [...timers];

        if (filter.strategyId) {
          filtered = filtered.filter(timer => timer.strategyId === filter.strategyId);
        }

        if (filter.userId) {
          filtered = filtered.filter(timer => timer.userId === filter.userId);
        }

        if (filter.isActive !== undefined) {
          filtered = filtered.filter(timer => timer.isActive === filter.isActive);
        }

        if (filter.type) {
          filtered = filtered.filter(timer => timer.strategy.type === filter.type);
        }

        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter(timer =>
            timer.name.toLowerCase().includes(query) ||
            timer.strategyId.toLowerCase().includes(query)
          );
        }

        if (filter.dateFrom || filter.dateTo) {
          filtered = filtered.filter(timer => {
            if (filter.dateFrom && timer.createdAt < filter.dateFrom) return false;
            if (filter.dateTo && timer.createdAt > filter.dateTo) return false;
            return true;
          });
        }

        return filtered;
      },
      
      // Get filtered alerts
      getFilteredAlerts: () => {
        const { alerts, filter } = get();
        let filtered = [...alerts];

        if (filter.strategyId) {
          filtered = filtered.filter(alert => alert.strategyId === filter.strategyId);
        }

        if (filter.dateFrom || filter.dateTo) {
          filtered = filtered.filter(alert => {
            if (filter.dateFrom && alert.createdAt < filter.dateFrom) return false;
            if (filter.dateTo && alert.createdAt > filter.dateTo) return false;
            return true;
          });
        }

        return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },
      
      // Get upcoming triggers
      getUpcomingTriggers: (days: number = 7) => {
        return rebalanceTimingEngine.getUpcomingTriggers(days);
      },
      
      // Get recent alerts
      getRecentAlerts: (hours: number = 24) => {
        return rebalanceTimingEngine.getRecentAlerts(hours);
      },
      
      // Get due timers
      getDueTimers: () => {
        return rebalanceTimingEngine.getDueTimers();
      },
      
      // Set filter
      setFilter: (filter: TimingFilter) => {
        set({ filter });
      },
      
      // Clear filter
      clearFilter: () => {
        set({ filter: {} });
      },
      
      // Set selected timer
      setSelectedTimer: (timer: RebalanceTimer | null) => {
        set({ selectedTimer: timer });
      },
      
      // Bulk start timers
      bulkStartTimers: async (timerIds: string[]) => {
        let successCount = 0;
        for (const id of timerIds) {
          if (await get().startTimer(id)) {
            successCount++;
          }
        }
        return successCount;
      },
      
      // Bulk stop timers
      bulkStopTimers: async (timerIds: string[]) => {
        let successCount = 0;
        for (const id of timerIds) {
          if (await get().stopTimer(id)) {
            successCount++;
          }
        }
        return successCount;
      },
      
      // Bulk delete timers
      bulkDeleteTimers: async (timerIds: string[]) => {
        let successCount = 0;
        for (const id of timerIds) {
          if (await get().deleteTimer(id)) {
            successCount++;
          }
        }
        return successCount;
      },
      
      // Bulk acknowledge alerts
      bulkAcknowledgeAlerts: async (alertIds: string[], userId?: string) => {
        let successCount = 0;
        for (const id of alertIds) {
          if (await get().acknowledgeAlert(id, userId)) {
            successCount++;
          }
        }
        return successCount;
      },
      
      // Set loading
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      // Set error
      setError: (error: string | null) => {
        set({ error });
      },
      
      // Reset store
      reset: () => {
        set({
          timers: [],
          rules: [],
          alerts: [],
          selectedTimer: null,
          filter: {},
          isLoading: false,
          error: null,
          stats: null,
          upcomingTriggers: []
        });
      }
    }),
    {
      name: 'rebalance-timing-store',
      partialize: (state) => ({
        filter: state.filter,
        selectedTimer: state.selectedTimer
      })
    }
  )
);

// Auto-refresh timers every minute
let autoRefreshInterval: NodeJS.Timeout;

// Start auto-refresh
export const startAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setInterval(() => {
    const store = useRebalanceTimingStore.getState();
    store.processDueTimers();
  }, 60000); // Check every minute
};

// Stop auto-refresh
export const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
};

// Initialize auto-refresh on store creation
startAutoRefresh(); 