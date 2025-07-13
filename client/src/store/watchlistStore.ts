// Block 32: Watchlist Engine - Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  WatchlistItem, 
  WatchlistScore, 
  WatchlistState, 
  WatchlistFilter, 
  WatchlistSettings,
  WatchlistBulkOperation,
  WatchlistComparison,
  WatchlistRecommendation
} from '../types/watchlist';
import { watchlistEngine } from '../engines/WatchlistEngine';

interface WatchlistStore extends WatchlistState {
  // Additional state
  lastRefresh: Date | null;
  autoRefreshEnabled: boolean;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshWatchlist: () => void;
  
  // Watchlist management
  addToWatchlist: (symbol: string, name: string, priority?: number) => WatchlistItem;
  removeFromWatchlist: (symbol: string) => boolean;
  bulkRemoveFromWatchlist: (symbols: string[]) => number;
  
  // Scoring
  scoreAsset: (symbol: string) => WatchlistScore | null;
  scoreAllAssets: () => Map<string, WatchlistScore>;
  scheduleScoring: (symbol: string, delay: number) => void;
  
  // Asset management
  setPriceTarget: (symbol: string, target: number, type?: 'buy' | 'sell') => boolean;
  addAlert: (symbol: string, condition: string, value: number, type?: 'price' | 'score' | 'volume') => boolean;
  updateNotes: (symbol: string, notes: string) => boolean;
  setPriority: (symbol: string, priority: number) => boolean;
  addTag: (symbol: string, tag: string) => boolean;
  removeTag: (symbol: string, tag: string) => boolean;
  
  // Bulk operations
  performBulkOperation: (operation: WatchlistBulkOperation) => number;
  bulkUpdatePriority: (symbols: string[], priority: number) => number;
  bulkAddTags: (symbols: string[], tags: string[]) => number;
  
  // Filtering and sorting
  setFilter: (filter: WatchlistFilter) => void;
  clearFilter: () => void;
  setSort: (sortBy: 'score' | 'priority' | 'symbol' | 'addedAt', sortOrder: 'asc' | 'desc') => void;
  setSelectedItems: (items: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Search
  searchWatchlist: (query: string) => WatchlistItem[];
  
  // Analytics
  getWatchlistStats: () => {
    totalItems: number;
    averageScore: number;
    highPriorityCount: number;
    recentlyAdded: number;
    needsScoring: number;
    topPerformers: WatchlistItem[];
    alertsTriggered: number;
  };
  getScoreComparison: (timeframe: 'day' | 'week' | 'month') => WatchlistComparison[];
  getRecommendations: () => WatchlistRecommendation[];
  
  // Settings
  updateSettings: (settings: Partial<WatchlistSettings>) => void;
  resetSettings: () => void;
  
  // Import/Export
  exportWatchlist: () => { items: WatchlistItem[], settings: WatchlistSettings };
  importWatchlist: (data: { items: WatchlistItem[], settings?: WatchlistSettings }) => void;
  
  // Auto-refresh
  enableAutoRefresh: () => void;
  disableAutoRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      settings: {
        maxItems: 50,
        autoScore: true,
        scoreThreshold: 70,
        refreshInterval: 300000, // 5 minutes
        notifications: true
      },
      selectedItems: [],
      sortBy: 'score',
      sortOrder: 'desc',
      filterBy: {},
      isLoading: false,
      error: null,
      lastRefresh: null,
      autoRefreshEnabled: false,

      // Basic actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      refreshWatchlist: () => {
        set({ 
          items: watchlistEngine.getAllWatchlistItems(),
          lastRefresh: new Date()
        });
      },

      // Watchlist management
      addToWatchlist: (symbol, name, priority = 1) => {
        try {
          const item = watchlistEngine.addToWatchlist(symbol, name, priority);
          set({ 
            items: watchlistEngine.getAllWatchlistItems(),
            error: null 
          });
          return item;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add to watchlist' });
          throw error;
        }
      },

      removeFromWatchlist: (symbol) => {
        try {
          const success = watchlistEngine.removeFromWatchlist(symbol);
          if (success) {
            const state = get();
            set({ 
              items: watchlistEngine.getAllWatchlistItems(),
              selectedItems: state.selectedItems.filter(s => s !== symbol.toUpperCase()),
              error: null 
            });
          }
          return success;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to remove from watchlist' });
          return false;
        }
      },

      bulkRemoveFromWatchlist: (symbols) => {
        let removed = 0;
        symbols.forEach(symbol => {
          if (watchlistEngine.removeFromWatchlist(symbol)) {
            removed++;
          }
        });
        
        set({ 
          items: watchlistEngine.getAllWatchlistItems(),
          selectedItems: [],
          error: null 
        });
        
        return removed;
      },

      // Scoring
      scoreAsset: (symbol) => {
        try {
          const score = watchlistEngine.scoreAsset(symbol);
          set({ 
            items: watchlistEngine.getAllWatchlistItems(),
            error: null 
          });
          return score;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to score asset' });
          return null;
        }
      },

      scoreAllAssets: () => {
        try {
          set({ isLoading: true });
          const scores = watchlistEngine.scoreAllAssets();
          set({ 
            items: watchlistEngine.getAllWatchlistItems(),
            isLoading: false,
            lastRefresh: new Date(),
            error: null 
          });
          return scores;
        } catch (error) {
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to score assets' 
          });
          return new Map();
        }
      },

      scheduleScoring: (symbol, delay) => {
        setTimeout(() => {
          get().scoreAsset(symbol);
        }, delay);
      },

      // Asset management
      setPriceTarget: (symbol, target, type = 'buy') => {
        try {
          const success = watchlistEngine.setPriceTarget(symbol, target, type);
          if (success) {
            set({ 
              items: watchlistEngine.getAllWatchlistItems(),
              error: null 
            });
          }
          return success;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to set price target' });
          return false;
        }
      },

      addAlert: (symbol, condition, value, type = 'price') => {
        try {
          const success = watchlistEngine.addAlert(symbol, condition, value, type);
          if (success) {
            set({ 
              items: watchlistEngine.getAllWatchlistItems(),
              error: null 
            });
          }
          return success;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add alert' });
          return false;
        }
      },

      updateNotes: (symbol, notes) => {
        try {
          const success = watchlistEngine.updateNotes(symbol, notes);
          if (success) {
            set({ 
              items: watchlistEngine.getAllWatchlistItems(),
              error: null 
            });
          }
          return success;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update notes' });
          return false;
        }
      },

      setPriority: (symbol, priority) => {
        try {
          const success = watchlistEngine.setPriority(symbol, priority);
          if (success) {
            set({ 
              items: watchlistEngine.getAllWatchlistItems(),
              error: null 
            });
          }
          return success;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to set priority' });
          return false;
        }
      },

      addTag: (symbol, tag) => {
        try {
          const item = watchlistEngine.getWatchlistItem(symbol);
          if (item && !item.tags.includes(tag)) {
            item.tags.push(tag);
            set({ 
              items: watchlistEngine.getAllWatchlistItems(),
              error: null 
            });
            return true;
          }
          return false;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add tag' });
          return false;
        }
      },

      removeTag: (symbol, tag) => {
        try {
          const item = watchlistEngine.getWatchlistItem(symbol);
          if (item) {
            item.tags = item.tags.filter(t => t !== tag);
            set({ 
              items: watchlistEngine.getAllWatchlistItems(),
              error: null 
            });
            return true;
          }
          return false;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to remove tag' });
          return false;
        }
      },

      // Bulk operations
      performBulkOperation: (operation) => {
        let affected = 0;
        
        switch (operation.type) {
          case 'remove':
            affected = get().bulkRemoveFromWatchlist(operation.symbols);
            break;
          case 'priority':
            affected = get().bulkUpdatePriority(operation.symbols, operation.value);
            break;
          case 'tag':
            affected = get().bulkAddTags(operation.symbols, operation.value);
            break;
          case 'score':
            operation.symbols.forEach(symbol => {
              if (get().scoreAsset(symbol)) affected++;
            });
            break;
        }
        
        return affected;
      },

      bulkUpdatePriority: (symbols, priority) => {
        let updated = 0;
        symbols.forEach(symbol => {
          if (get().setPriority(symbol, priority)) {
            updated++;
          }
        });
        return updated;
      },

      bulkAddTags: (symbols, tags) => {
        let updated = 0;
        symbols.forEach(symbol => {
          tags.forEach(tag => {
            if (get().addTag(symbol, tag)) {
              updated++;
            }
          });
        });
        return updated;
      },

      // Filtering and sorting
      setFilter: (filter) => set({ filterBy: filter }),
      clearFilter: () => set({ filterBy: {} }),
      setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
      setSelectedItems: (items) => set({ selectedItems: items }),
      selectAll: () => {
        const items = get().items;
        set({ selectedItems: items.map(item => item.symbol) });
      },
      clearSelection: () => set({ selectedItems: [] }),

      // Search
      searchWatchlist: (query) => {
        return watchlistEngine.searchWatchlist(query);
      },

      // Analytics
      getWatchlistStats: () => {
        const baseStats = watchlistEngine.getWatchlistStats();
        const items = get().items;
        const topPerformers = watchlistEngine.getTopScoring(5);
        const alertsTriggered = items.reduce((count, item) => 
          count + item.alerts.filter(alert => alert.triggered).length, 0
        );

        return {
          ...baseStats,
          topPerformers,
          alertsTriggered
        };
      },

      getScoreComparison: (timeframe) => {
        // Mock implementation - in production, this would compare historical scores
        const items = get().items;
        return items.map(item => ({
          symbol: item.symbol,
          currentScore: item.currentScore?.totalScore || 0,
          previousScore: (item.currentScore?.totalScore || 0) + (Math.random() * 20 - 10),
          change: Math.random() * 20 - 10,
          changePercent: (Math.random() * 40 - 20),
          trend: Math.random() > 0.5 ? 'up' : 'down'
        } as WatchlistComparison));
      },

      getRecommendations: () => {
        const items = get().items;
        const settings = get().settings;
        
        return items
          .filter(item => item.currentScore && item.currentScore.totalScore > settings.scoreThreshold)
          .slice(0, 5)
          .map(item => ({
            symbol: item.symbol,
            action: item.currentScore!.totalScore > 80 ? 'buy' : 'monitor',
            reason: `Score: ${item.currentScore!.totalScore}/100`,
            confidence: item.currentScore!.confidence,
            priority: item.priority,
            targetPrice: item.priceTarget?.price
          } as WatchlistRecommendation));
      },

      // Settings
      updateSettings: (settings) => {
        watchlistEngine.updateSettings(settings);
        set({ 
          settings: watchlistEngine.getSettings(),
          error: null 
        });
      },

      resetSettings: () => {
        const defaultSettings: WatchlistSettings = {
          maxItems: 50,
          autoScore: true,
          scoreThreshold: 70,
          refreshInterval: 300000,
          notifications: true
        };
        get().updateSettings(defaultSettings);
      },

      // Import/Export
      exportWatchlist: () => {
        return watchlistEngine.exportWatchlist();
      },

      importWatchlist: (data) => {
        try {
          watchlistEngine.importWatchlist(data);
          set({ 
            items: watchlistEngine.getAllWatchlistItems(),
            settings: watchlistEngine.getSettings(),
            error: null 
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to import watchlist' });
        }
      },

      // Auto-refresh
      enableAutoRefresh: () => {
        set({ autoRefreshEnabled: true });
      },

      disableAutoRefresh: () => {
        set({ autoRefreshEnabled: false });
      },

      setRefreshInterval: (interval) => {
        const settings = get().settings;
        get().updateSettings({ ...settings, refreshInterval: interval });
      }
    }),
    {
      name: 'watchlist-store',
      partialize: (state) => ({
        items: state.items,
        settings: state.settings,
        selectedItems: state.selectedItems,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        filterBy: state.filterBy,
        autoRefreshEnabled: state.autoRefreshEnabled
      })
    }
  )
); 