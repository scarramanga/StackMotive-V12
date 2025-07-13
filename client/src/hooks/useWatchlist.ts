// Block 32: Watchlist Engine - Hook
import { useState, useEffect, useCallback } from 'react';
import { 
  WatchlistItem, 
  WatchlistScore, 
  WatchlistState, 
  WatchlistFilter, 
  WatchlistSettings,
  WatchlistStats
} from '../types/watchlist';
import { watchlistEngine } from '../engines/WatchlistEngine';

export function useWatchlist() {
  const [state, setState] = useState<WatchlistState>({
    items: [],
    settings: watchlistEngine.getSettings(),
    selectedItems: [],
    sortBy: 'score',
    sortOrder: 'desc',
    filterBy: {},
    isLoading: false,
    error: null
  });

  // Initialize watchlist
  useEffect(() => {
    setState(prev => ({
      ...prev,
      items: watchlistEngine.getAllWatchlistItems()
    }));
  }, []);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!state.settings.autoScore) return;

    const interval = setInterval(() => {
      refreshScores();
    }, state.settings.refreshInterval);

    return () => clearInterval(interval);
  }, [state.settings.autoScore, state.settings.refreshInterval]);

  // Add to watchlist
  const addToWatchlist = useCallback((symbol: string, name: string, priority: number = 1) => {
    try {
      const item = watchlistEngine.addToWatchlist(symbol, name, priority);
      setState(prev => ({
        ...prev,
        items: watchlistEngine.getAllWatchlistItems(),
        error: null
      }));
      return item;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add to watchlist'
      }));
      throw error;
    }
  }, []);

  // Remove from watchlist
  const removeFromWatchlist = useCallback((symbol: string) => {
    try {
      const success = watchlistEngine.removeFromWatchlist(symbol);
      if (success) {
        setState(prev => ({
          ...prev,
          items: watchlistEngine.getAllWatchlistItems(),
          selectedItems: prev.selectedItems.filter(s => s !== symbol.toUpperCase()),
          error: null
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to remove from watchlist'
      }));
      return false;
    }
  }, []);

  // Score a specific asset
  const scoreAsset = useCallback((symbol: string) => {
    try {
      const score = watchlistEngine.scoreAsset(symbol);
      setState(prev => ({
        ...prev,
        items: watchlistEngine.getAllWatchlistItems(),
        error: null
      }));
      return score;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to score asset'
      }));
      return null;
    }
  }, []);

  // Score all assets
  const scoreAllAssets = useCallback(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const scores = watchlistEngine.scoreAllAssets();
      setState(prev => ({
        ...prev,
        items: watchlistEngine.getAllWatchlistItems(),
        isLoading: false,
        error: null
      }));
      return scores;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to score assets'
      }));
      return new Map();
    }
  }, []);

  // Refresh scores
  const refreshScores = useCallback(() => {
    scoreAllAssets();
  }, [scoreAllAssets]);

  // Set price target
  const setPriceTarget = useCallback((symbol: string, target: number, type: 'buy' | 'sell' = 'buy') => {
    try {
      const success = watchlistEngine.setPriceTarget(symbol, target, type);
      if (success) {
        setState(prev => ({
          ...prev,
          items: watchlistEngine.getAllWatchlistItems(),
          error: null
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to set price target'
      }));
      return false;
    }
  }, []);

  // Add alert
  const addAlert = useCallback((symbol: string, condition: string, value: number, type: 'price' | 'score' | 'volume' = 'price') => {
    try {
      const success = watchlistEngine.addAlert(symbol, condition, value, type);
      if (success) {
        setState(prev => ({
          ...prev,
          items: watchlistEngine.getAllWatchlistItems(),
          error: null
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add alert'
      }));
      return false;
    }
  }, []);

  // Update notes
  const updateNotes = useCallback((symbol: string, notes: string) => {
    try {
      const success = watchlistEngine.updateNotes(symbol, notes);
      if (success) {
        setState(prev => ({
          ...prev,
          items: watchlistEngine.getAllWatchlistItems(),
          error: null
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update notes'
      }));
      return false;
    }
  }, []);

  // Set priority
  const setPriority = useCallback((symbol: string, priority: number) => {
    try {
      const success = watchlistEngine.setPriority(symbol, priority);
      if (success) {
        setState(prev => ({
          ...prev,
          items: watchlistEngine.getAllWatchlistItems(),
          error: null
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to set priority'
      }));
      return false;
    }
  }, []);

  // Search watchlist
  const searchWatchlist = useCallback((query: string) => {
    return watchlistEngine.searchWatchlist(query);
  }, []);

  // Get filtered items
  const getFilteredItems = useCallback(() => {
    let filtered = [...state.items];

    // Apply filters
    if (state.filterBy.minScore !== undefined) {
      filtered = filtered.filter(item => 
        item.currentScore && item.currentScore.totalScore >= state.filterBy.minScore!
      );
    }

    if (state.filterBy.maxScore !== undefined) {
      filtered = filtered.filter(item => 
        item.currentScore && item.currentScore.totalScore <= state.filterBy.maxScore!
      );
    }

    if (state.filterBy.priority && state.filterBy.priority.length > 0) {
      filtered = filtered.filter(item => state.filterBy.priority!.includes(item.priority));
    }

    if (state.filterBy.hasAlerts) {
      filtered = filtered.filter(item => item.alerts.length > 0);
    }

    if (state.filterBy.hasNotes) {
      filtered = filtered.filter(item => item.notes && item.notes.length > 0);
    }

    if (state.filterBy.recentlyAdded) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => item.addedAt > oneDayAgo);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (state.sortBy) {
        case 'score':
          aValue = a.currentScore?.totalScore || 0;
          bValue = b.currentScore?.totalScore || 0;
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'addedAt':
          aValue = a.addedAt.getTime();
          bValue = b.addedAt.getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return state.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return state.sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [state.items, state.filterBy, state.sortBy, state.sortOrder]);

  // Get top scoring items
  const getTopScoring = useCallback((limit: number = 10) => {
    return watchlistEngine.getTopScoring(limit);
  }, []);

  // Get watchlist stats
  const getWatchlistStats = useCallback((): WatchlistStats => {
    const baseStats = watchlistEngine.getWatchlistStats();
    const topPerformers = getTopScoring(5);
    const alertsTriggered = state.items.reduce((count, item) => 
      count + item.alerts.filter(alert => alert.triggered).length, 0
    );

    return {
      ...baseStats,
      topPerformers,
      alertsTriggered
    };
  }, [state.items, getTopScoring]);

  // Update settings
  const updateSettings = useCallback((settings: Partial<WatchlistSettings>) => {
    try {
      watchlistEngine.updateSettings(settings);
      setState(prev => ({
        ...prev,
        settings: watchlistEngine.getSettings(),
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update settings'
      }));
    }
  }, []);

  // Export watchlist
  const exportWatchlist = useCallback(() => {
    return watchlistEngine.exportWatchlist();
  }, []);

  // Import watchlist
  const importWatchlist = useCallback((data: { items: WatchlistItem[], settings?: WatchlistSettings }) => {
    try {
      watchlistEngine.importWatchlist(data);
      setState(prev => ({
        ...prev,
        items: watchlistEngine.getAllWatchlistItems(),
        settings: watchlistEngine.getSettings(),
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to import watchlist'
      }));
    }
  }, []);

  // Set filter
  const setFilter = useCallback((filter: WatchlistFilter) => {
    setState(prev => ({ ...prev, filterBy: filter }));
  }, []);

  // Set sort
  const setSort = useCallback((sortBy: 'score' | 'priority' | 'symbol' | 'addedAt', sortOrder: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  // Set selected items
  const setSelectedItems = useCallback((items: string[]) => {
    setState(prev => ({ ...prev, selectedItems: items }));
  }, []);

  return {
    // State
    items: state.items,
    filteredItems: getFilteredItems(),
    settings: state.settings,
    selectedItems: state.selectedItems,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    filterBy: state.filterBy,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    addToWatchlist,
    removeFromWatchlist,
    scoreAsset,
    scoreAllAssets,
    refreshScores,
    setPriceTarget,
    addAlert,
    updateNotes,
    setPriority,
    searchWatchlist,
    getTopScoring,
    getWatchlistStats,
    updateSettings,
    exportWatchlist,
    importWatchlist,
    setFilter,
    setSort,
    setSelectedItems
  };
} 