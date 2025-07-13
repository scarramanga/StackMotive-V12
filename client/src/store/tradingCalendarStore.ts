// Block 87: Trading Calendar Awareness - Store
// Zustand store for trading calendar awareness management

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  TradingCalendar,
  TradingCalendarAwareness,
  CalendarAlert,
  MarketConflict,
  AlertSeverity,
  ConflictSeverity,
  AlertType,
  ConflictType,
  AwarenessStatus
} from '../types/tradingCalendarAwareness';

interface TradingCalendarState {
  // Data
  calendars: TradingCalendar[];
  awarenessInstances: TradingCalendarAwareness[];
  
  // Selection
  selectedAwareness: string | null;
  selectedCalendar: string | null;
  
  // View state
  view: 'overview' | 'calendars' | 'conflicts' | 'alerts' | 'monitoring';
  alertView: 'all' | 'active' | 'critical' | 'unacknowledged';
  conflictView: 'all' | 'detected' | 'critical' | 'resolved';
  
  // Filter state
  filter: {
    // Calendar filters
    markets: string[];
    calendarStatus: 'all' | 'active' | 'inactive';
    
    // Awareness filters
    awarenessStatus: AwarenessStatus | 'all';
    portfolios: string[];
    users: string[];
    
    // Alert filters
    alertSeverity: AlertSeverity | 'all';
    alertType: AlertType | 'all';
    alertStatus: 'all' | 'active' | 'acknowledged' | 'expired';
    
    // Conflict filters
    conflictSeverity: ConflictSeverity | 'all';
    conflictType: ConflictType | 'all';
    conflictStatus: 'all' | 'detected' | 'resolved' | 'deferred';
    
    // Time filters
    timeRange: 'all' | 'today' | 'week' | 'month' | 'quarter';
    lookAheadDays: number;
    
    // Search
    search: string;
  };
  
  // Sort state
  sort: {
    field: 'createdAt' | 'severity' | 'eventTime' | 'market' | 'status';
    direction: 'asc' | 'desc';
  };
  
  // UI state
  expandedItems: string[];
  showDetails: boolean;
  showRecommendations: boolean;
  
  // Settings
  settings: {
    autoRefresh: boolean;
    refreshInterval: number;
    enableNotifications: boolean;
    showOnlyActionable: boolean;
    groupByMarket: boolean;
    consolidateAlerts: boolean;
    realTimeUpdates: boolean;
  };
  
  // Monitoring state
  monitoringStatus: {
    isActive: boolean;
    lastUpdate: Date;
    nextUpdate: Date;
    errorCount: number;
    successCount: number;
  };
  
  // Actions - Calendar Management
  setCalendars: (calendars: TradingCalendar[]) => void;
  addCalendar: (calendar: TradingCalendar) => void;
  updateCalendar: (id: string, updates: Partial<TradingCalendar>) => void;
  removeCalendar: (id: string) => void;
  setSelectedCalendar: (id: string | null) => void;
  
  // Actions - Awareness Management
  setAwarenessInstances: (instances: TradingCalendarAwareness[]) => void;
  addAwareness: (awareness: TradingCalendarAwareness) => void;
  updateAwareness: (id: string, updates: Partial<TradingCalendarAwareness>) => void;
  removeAwareness: (id: string) => void;
  setSelectedAwareness: (id: string | null) => void;
  
  // Actions - View Management
  setView: (view: 'overview' | 'calendars' | 'conflicts' | 'alerts' | 'monitoring') => void;
  setAlertView: (view: 'all' | 'active' | 'critical' | 'unacknowledged') => void;
  setConflictView: (view: 'all' | 'detected' | 'critical' | 'resolved') => void;
  
  // Actions - Filter and Sort
  setFilter: (filter: Partial<TradingCalendarState['filter']>) => void;
  setSort: (sort: TradingCalendarState['sort']) => void;
  clearFilters: () => void;
  
  // Actions - UI State
  toggleItemExpansion: (id: string) => void;
  setShowDetails: (show: boolean) => void;
  setShowRecommendations: (show: boolean) => void;
  setSettings: (settings: Partial<TradingCalendarState['settings']>) => void;
  
  // Actions - Monitoring
  updateMonitoringStatus: (status: Partial<TradingCalendarState['monitoringStatus']>) => void;
  
  // Computed getters
  getCalendar: (id: string) => TradingCalendar | undefined;
  getAwareness: (id: string) => TradingCalendarAwareness | undefined;
  getFilteredCalendars: () => TradingCalendar[];
  getFilteredAwareness: () => TradingCalendarAwareness[];
  getFilteredAlerts: () => CalendarAlert[];
  getFilteredConflicts: () => MarketConflict[];
  getSortedAlerts: () => CalendarAlert[];
  getSortedConflicts: () => MarketConflict[];
  
  // Statistics
  getCalendarStats: () => {
    total: number;
    active: number;
    marketsMonitored: number;
    dataQuality: number;
  };
  
  getAwarenessStats: () => {
    total: number;
    active: number;
    monitoring: number;
    withConflicts: number;
    withCriticalAlerts: number;
  };
  
  getAlertStats: () => {
    total: number;
    active: number;
    critical: number;
    unacknowledged: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<AlertType, number>;
  };
  
  getConflictStats: () => {
    total: number;
    detected: number;
    critical: number;
    resolved: number;
    bySeverity: Record<ConflictSeverity, number>;
    byType: Record<ConflictType, number>;
  };
  
  // Utilities
  exportData: () => string;
  importData: (data: string) => void;
  clearOldData: (days: number) => void;
}

export const useTradingCalendarStore = create<TradingCalendarState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial data
        calendars: [],
        awarenessInstances: [],
        
        // Initial selection
        selectedAwareness: null,
        selectedCalendar: null,
        
        // Initial view state
        view: 'overview',
        alertView: 'active',
        conflictView: 'detected',
        
        // Initial filter state
        filter: {
          markets: [],
          calendarStatus: 'all',
          awarenessStatus: 'all',
          portfolios: [],
          users: [],
          alertSeverity: 'all',
          alertType: 'all',
          alertStatus: 'active',
          conflictSeverity: 'all',
          conflictType: 'all',
          conflictStatus: 'detected',
          timeRange: 'week',
          lookAheadDays: 14,
          search: ''
        },
        
        // Initial sort state
        sort: {
          field: 'createdAt',
          direction: 'desc'
        },
        
        // Initial UI state
        expandedItems: [],
        showDetails: true,
        showRecommendations: true,
        
        // Initial settings
        settings: {
          autoRefresh: true,
          refreshInterval: 300000, // 5 minutes
          enableNotifications: true,
          showOnlyActionable: false,
          groupByMarket: false,
          consolidateAlerts: true,
          realTimeUpdates: true
        },
        
        // Initial monitoring status
        monitoringStatus: {
          isActive: false,
          lastUpdate: new Date(),
          nextUpdate: new Date(Date.now() + 300000),
          errorCount: 0,
          successCount: 0
        },
        
        // Calendar actions
        setCalendars: (calendars) => set({ calendars }),
        addCalendar: (calendar) => set((state) => ({ 
          calendars: [...state.calendars, calendar] 
        })),
        updateCalendar: (id, updates) => set((state) => ({
          calendars: state.calendars.map(cal => 
            cal.id === id ? { ...cal, ...updates } : cal
          )
        })),
        removeCalendar: (id) => set((state) => ({
          calendars: state.calendars.filter(cal => cal.id !== id),
          selectedCalendar: state.selectedCalendar === id ? null : state.selectedCalendar
        })),
        setSelectedCalendar: (id) => set({ selectedCalendar: id }),
        
        // Awareness actions
        setAwarenessInstances: (instances) => set({ awarenessInstances: instances }),
        addAwareness: (awareness) => set((state) => ({ 
          awarenessInstances: [...state.awarenessInstances, awareness] 
        })),
        updateAwareness: (id, updates) => set((state) => ({
          awarenessInstances: state.awarenessInstances.map(awareness => 
            awareness.id === id ? { ...awareness, ...updates } : awareness
          )
        })),
        removeAwareness: (id) => set((state) => ({
          awarenessInstances: state.awarenessInstances.filter(awareness => awareness.id !== id),
          selectedAwareness: state.selectedAwareness === id ? null : state.selectedAwareness
        })),
        setSelectedAwareness: (id) => set({ selectedAwareness: id }),
        
        // View actions
        setView: (view) => set({ view }),
        setAlertView: (alertView) => set({ alertView }),
        setConflictView: (conflictView) => set({ conflictView }),
        
        // Filter and sort actions
        setFilter: (filter) => set((state) => ({
          filter: { ...state.filter, ...filter }
        })),
        setSort: (sort) => set({ sort }),
        clearFilters: () => set((state) => ({
          filter: {
            markets: [],
            calendarStatus: 'all',
            awarenessStatus: 'all',
            portfolios: [],
            users: [],
            alertSeverity: 'all',
            alertType: 'all',
            alertStatus: 'all',
            conflictSeverity: 'all',
            conflictType: 'all',
            conflictStatus: 'all',
            timeRange: 'all',
            lookAheadDays: 14,
            search: ''
          }
        })),
        
        // UI actions
        toggleItemExpansion: (id) => set((state) => ({
          expandedItems: state.expandedItems.includes(id)
            ? state.expandedItems.filter(item => item !== id)
            : [...state.expandedItems, id]
        })),
        setShowDetails: (show) => set({ showDetails: show }),
        setShowRecommendations: (show) => set({ showRecommendations: show }),
        setSettings: (settings) => set((state) => ({
          settings: { ...state.settings, ...settings }
        })),
        
        // Monitoring actions
        updateMonitoringStatus: (status) => set((state) => ({
          monitoringStatus: { ...state.monitoringStatus, ...status }
        })),
        
        // Computed getters
        getCalendar: (id) => {
          const state = get();
          return state.calendars.find(cal => cal.id === id);
        },
        
        getAwareness: (id) => {
          const state = get();
          return state.awarenessInstances.find(awareness => awareness.id === id);
        },
        
        getFilteredCalendars: () => {
          const state = get();
          let filtered = state.calendars;
          
          // Filter by markets
          if (state.filter.markets.length > 0) {
            filtered = filtered.filter(cal => 
              state.filter.markets.includes(cal.market.code)
            );
          }
          
          // Filter by status
          if (state.filter.calendarStatus !== 'all') {
            filtered = filtered.filter(cal => 
              state.filter.calendarStatus === 'active' ? cal.isActive : !cal.isActive
            );
          }
          
          // Filter by search
          if (state.filter.search) {
            const search = state.filter.search.toLowerCase();
            filtered = filtered.filter(cal => 
              cal.market.name.toLowerCase().includes(search) ||
              cal.market.code.toLowerCase().includes(search) ||
              cal.market.country.toLowerCase().includes(search)
            );
          }
          
          return filtered;
        },
        
        getFilteredAwareness: () => {
          const state = get();
          let filtered = state.awarenessInstances;
          
          // Filter by status
          if (state.filter.awarenessStatus !== 'all') {
            filtered = filtered.filter(awareness => 
              awareness.status === state.filter.awarenessStatus
            );
          }
          
          // Filter by portfolios
          if (state.filter.portfolios.length > 0) {
            filtered = filtered.filter(awareness => 
              state.filter.portfolios.includes(awareness.portfolioId)
            );
          }
          
          // Filter by users
          if (state.filter.users.length > 0) {
            filtered = filtered.filter(awareness => 
              state.filter.users.includes(awareness.userId)
            );
          }
          
          // Filter by time range
          if (state.filter.timeRange !== 'all') {
            const now = new Date();
            let cutoff: Date;
            
            switch (state.filter.timeRange) {
              case 'today':
                cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
              case 'week':
                cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
              case 'month':
                cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
              case 'quarter':
                cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
              default:
                cutoff = new Date(0);
            }
            
            filtered = filtered.filter(awareness => awareness.lastUpdated >= cutoff);
          }
          
          return filtered;
        },
        
        getFilteredAlerts: () => {
          const state = get();
          const filteredAwareness = state.getFilteredAwareness();
          let alerts: CalendarAlert[] = [];
          
          // Collect alerts from filtered awareness instances
          for (const awareness of filteredAwareness) {
            alerts.push(...awareness.alerts);
          }
          
          // Filter by severity
          if (state.filter.alertSeverity !== 'all') {
            alerts = alerts.filter(alert => alert.severity === state.filter.alertSeverity);
          }
          
          // Filter by type
          if (state.filter.alertType !== 'all') {
            alerts = alerts.filter(alert => alert.type === state.filter.alertType);
          }
          
          // Filter by status
          if (state.filter.alertStatus !== 'all') {
            switch (state.filter.alertStatus) {
              case 'active':
                alerts = alerts.filter(alert => alert.status === 'active');
                break;
              case 'acknowledged':
                alerts = alerts.filter(alert => alert.acknowledged);
                break;
              case 'expired':
                alerts = alerts.filter(alert => alert.status === 'expired');
                break;
            }
          }
          
          // Apply view filter
          switch (state.alertView) {
            case 'active':
              alerts = alerts.filter(alert => alert.status === 'active');
              break;
            case 'critical':
              alerts = alerts.filter(alert => alert.severity === 'critical');
              break;
            case 'unacknowledged':
              alerts = alerts.filter(alert => !alert.acknowledged);
              break;
          }
          
          return alerts;
        },
        
        getFilteredConflicts: () => {
          const state = get();
          const filteredAwareness = state.getFilteredAwareness();
          let conflicts: MarketConflict[] = [];
          
          // Collect conflicts from filtered awareness instances
          for (const awareness of filteredAwareness) {
            conflicts.push(...awareness.conflicts);
          }
          
          // Filter by severity
          if (state.filter.conflictSeverity !== 'all') {
            conflicts = conflicts.filter(conflict => conflict.severity === state.filter.conflictSeverity);
          }
          
          // Filter by type
          if (state.filter.conflictType !== 'all') {
            conflicts = conflicts.filter(conflict => conflict.type === state.filter.conflictType);
          }
          
          // Filter by status
          if (state.filter.conflictStatus !== 'all') {
            conflicts = conflicts.filter(conflict => conflict.status === state.filter.conflictStatus);
          }
          
          // Apply view filter
          switch (state.conflictView) {
            case 'detected':
              conflicts = conflicts.filter(conflict => conflict.status === 'detected');
              break;
            case 'critical':
              conflicts = conflicts.filter(conflict => 
                conflict.severity === 'critical' || conflict.severity === 'blocking'
              );
              break;
            case 'resolved':
              conflicts = conflicts.filter(conflict => conflict.status === 'resolved');
              break;
          }
          
          return conflicts;
        },
        
        getSortedAlerts: () => {
          const state = get();
          const filtered = state.getFilteredAlerts();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.sort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'createdAt':
                aValue = a.alertTime;
                bValue = b.alertTime;
                break;
              case 'severity':
                const severityOrder = { 'info': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
                aValue = severityOrder[a.severity];
                bValue = severityOrder[b.severity];
                break;
              case 'eventTime':
                aValue = a.eventTime;
                bValue = b.eventTime;
                break;
              case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        getSortedConflicts: () => {
          const state = get();
          const filtered = state.getFilteredConflicts();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.sort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'severity':
                const severityOrder = { 'minor': 0, 'moderate': 1, 'major': 2, 'critical': 3, 'blocking': 4 };
                aValue = severityOrder[a.severity];
                bValue = severityOrder[b.severity];
                break;
              case 'eventTime':
                aValue = a.conflictStart;
                bValue = b.conflictStart;
                break;
              case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        // Statistics
        getCalendarStats: () => {
          const state = get();
          const calendars = state.calendars;
          
          return {
            total: calendars.length,
            active: calendars.filter(cal => cal.isActive).length,
            marketsMonitored: new Set(calendars.map(cal => cal.market.code)).size,
            dataQuality: calendars.length > 0 
              ? calendars.reduce((sum, cal) => sum + cal.reliability, 0) / calendars.length
              : 0
          };
        },
        
        getAwarenessStats: () => {
          const state = get();
          const instances = state.awarenessInstances;
          
          return {
            total: instances.length,
            active: instances.filter(inst => inst.status === 'active').length,
            monitoring: instances.filter(inst => inst.settings.enableMonitoring).length,
            withConflicts: instances.filter(inst => inst.conflicts.length > 0).length,
            withCriticalAlerts: instances.filter(inst => 
              inst.alerts.some(alert => alert.severity === 'critical')
            ).length
          };
        },
        
        getAlertStats: () => {
          const state = get();
          const alerts = state.getFilteredAlerts();
          
          const stats = {
            total: alerts.length,
            active: alerts.filter(alert => alert.status === 'active').length,
            critical: alerts.filter(alert => alert.severity === 'critical').length,
            unacknowledged: alerts.filter(alert => !alert.acknowledged).length,
            bySeverity: {} as Record<AlertSeverity, number>,
            byType: {} as Record<AlertType, number>
          };
          
          // Count by severity and type
          alerts.forEach(alert => {
            stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
            stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
          });
          
          return stats;
        },
        
        getConflictStats: () => {
          const state = get();
          const conflicts = state.getFilteredConflicts();
          
          const stats = {
            total: conflicts.length,
            detected: conflicts.filter(conflict => conflict.status === 'detected').length,
            critical: conflicts.filter(conflict => 
              conflict.severity === 'critical' || conflict.severity === 'blocking'
            ).length,
            resolved: conflicts.filter(conflict => conflict.status === 'resolved').length,
            bySeverity: {} as Record<ConflictSeverity, number>,
            byType: {} as Record<ConflictType, number>
          };
          
          // Count by severity and type
          conflicts.forEach(conflict => {
            stats.bySeverity[conflict.severity] = (stats.bySeverity[conflict.severity] || 0) + 1;
            stats.byType[conflict.type] = (stats.byType[conflict.type] || 0) + 1;
          });
          
          return stats;
        },
        
        // Utilities
        exportData: () => {
          const state = get();
          return JSON.stringify({
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            calendars: state.calendars,
            awarenessInstances: state.awarenessInstances.map(instance => ({
              ...instance,
              // Remove sensitive data
              userId: '[REDACTED]'
            }))
          }, null, 2);
        },
        
        importData: (data) => {
          try {
            const imported = JSON.parse(data);
            if (imported.calendars && imported.awarenessInstances) {
              set((state) => ({
                calendars: [...state.calendars, ...imported.calendars],
                awarenessInstances: [...state.awarenessInstances, ...imported.awarenessInstances]
              }));
            }
          } catch (error) {
            console.error('Failed to import data:', error);
          }
        },
        
        clearOldData: (days) => set((state) => {
          const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          return {
            awarenessInstances: state.awarenessInstances.filter(instance => 
              instance.lastUpdated >= cutoff || instance.status === 'active'
            )
          };
        })
      }),
      {
        name: 'trading-calendar-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist UI preferences and settings only
          view: state.view,
          alertView: state.alertView,
          conflictView: state.conflictView,
          filter: state.filter,
          sort: state.sort,
          showDetails: state.showDetails,
          showRecommendations: state.showRecommendations,
          settings: state.settings
        }),
        version: 1
      }
    )
  )
);

// Selector hooks for specific data
export const useCalendarData = () => useTradingCalendarStore(state => ({
  calendars: state.calendars,
  selectedCalendar: state.selectedCalendar,
  getCalendar: state.getCalendar,
  getFilteredCalendars: state.getFilteredCalendars,
  getCalendarStats: state.getCalendarStats
}));

export const useAwarenessData = () => useTradingCalendarStore(state => ({
  awarenessInstances: state.awarenessInstances,
  selectedAwareness: state.selectedAwareness,
  getAwareness: state.getAwareness,
  getFilteredAwareness: state.getFilteredAwareness,
  getAwarenessStats: state.getAwarenessStats
}));

export const useAlertData = () => useTradingCalendarStore(state => ({
  alertView: state.alertView,
  getFilteredAlerts: state.getFilteredAlerts,
  getSortedAlerts: state.getSortedAlerts,
  getAlertStats: state.getAlertStats
}));

export const useConflictData = () => useTradingCalendarStore(state => ({
  conflictView: state.conflictView,
  getFilteredConflicts: state.getFilteredConflicts,
  getSortedConflicts: state.getSortedConflicts,
  getConflictStats: state.getConflictStats
}));

export const useCalendarFilters = () => useTradingCalendarStore(state => ({
  filter: state.filter,
  sort: state.sort,
  setFilter: state.setFilter,
  setSort: state.setSort,
  clearFilters: state.clearFilters
}));

export const useCalendarSettings = () => useTradingCalendarStore(state => ({
  settings: state.settings,
  setSettings: state.setSettings,
  showDetails: state.showDetails,
  setShowDetails: state.setShowDetails,
  showRecommendations: state.showRecommendations,
  setShowRecommendations: state.setShowRecommendations
}));

export const useCalendarMonitoring = () => useTradingCalendarStore(state => ({
  monitoringStatus: state.monitoringStatus,
  updateMonitoringStatus: state.updateMonitoringStatus
})); 