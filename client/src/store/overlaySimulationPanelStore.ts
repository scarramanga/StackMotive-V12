// Block 26: Overlay Simulation Panel - Store
// Zustand store for overlay simulation panel management

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  SimulationPanel,
  SimulationWidget,
  SimulationData,
  PanelConfig,
  WidgetType,
  ChartType
} from '../types/overlaySimulationPanel';

interface OverlaySimulationPanelState {
  // Data
  panels: SimulationPanel[];
  widgets: SimulationWidget[];
  simulations: SimulationData[];
  
  // Selection
  selectedPanel: string | null;
  selectedWidget: string | null;
  selectedSimulation: string | null;
  
  // View state
  view: 'panels' | 'widgets' | 'simulations';
  panelView: 'grid' | 'list' | 'tiles';
  widgetView: 'grid' | 'list';
  simulationView: 'grid' | 'list' | 'timeline';
  
  // Filter state
  panelFilter: {
    status: 'all' | 'active' | 'inactive';
    type: 'all' | 'dashboard' | 'analysis' | 'reporting';
    search: string;
  };
  widgetFilter: {
    type: WidgetType | 'all';
    status: 'all' | 'loading' | 'error' | 'success';
    search: string;
  };
  simulationFilter: {
    status: 'all' | 'pending' | 'running' | 'completed' | 'failed';
    timeRange: 'all' | 'today' | 'week' | 'month';
    search: string;
  };
  
  // Sort state
  panelSort: {
    field: 'name' | 'created' | 'updated' | 'lastRefresh';
    direction: 'asc' | 'desc';
  };
  widgetSort: {
    field: 'title' | 'type' | 'created' | 'updated';
    direction: 'asc' | 'desc';
  };
  simulationSort: {
    field: 'name' | 'created' | 'status' | 'progress';
    direction: 'asc' | 'desc';
  };
  
  // Layout state
  layout: {
    sidebar: boolean;
    toolbar: boolean;
    statusbar: boolean;
    maximized: boolean;
  };
  
  // UI state
  isDragging: boolean;
  isResizing: boolean;
  dragTarget: string | null;
  resizeTarget: string | null;
  
  // Settings
  settings: {
    autoRefresh: boolean;
    refreshInterval: number;
    theme: 'light' | 'dark' | 'auto';
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
    animationsEnabled: boolean;
    confirmDeletes: boolean;
  };
  
  // Actions
  setPanels: (panels: SimulationPanel[]) => void;
  addPanel: (panel: SimulationPanel) => void;
  updatePanel: (id: string, updates: Partial<SimulationPanel>) => void;
  removePanel: (id: string) => void;
  setSelectedPanel: (id: string | null) => void;
  
  setWidgets: (widgets: SimulationWidget[]) => void;
  addWidget: (widget: SimulationWidget) => void;
  updateWidget: (id: string, updates: Partial<SimulationWidget>) => void;
  removeWidget: (id: string) => void;
  setSelectedWidget: (id: string | null) => void;
  
  setSimulations: (simulations: SimulationData[]) => void;
  addSimulation: (simulation: SimulationData) => void;
  updateSimulation: (id: string, updates: Partial<SimulationData>) => void;
  removeSimulation: (id: string) => void;
  setSelectedSimulation: (id: string | null) => void;
  
  setView: (view: 'panels' | 'widgets' | 'simulations') => void;
  setPanelView: (view: 'grid' | 'list' | 'tiles') => void;
  setWidgetView: (view: 'grid' | 'list') => void;
  setSimulationView: (view: 'grid' | 'list' | 'timeline') => void;
  
  setFilter: (type: 'panel' | 'widget' | 'simulation', filter: any) => void;
  setSort: (type: 'panel' | 'widget' | 'simulation', sort: any) => void;
  
  setLayout: (layout: Partial<OverlaySimulationPanelState['layout']>) => void;
  
  setDragState: (isDragging: boolean, target?: string | null) => void;
  setResizeState: (isResizing: boolean, target?: string | null) => void;
  
  setSettings: (settings: Partial<OverlaySimulationPanelState['settings']>) => void;
  
  // Computed getters
  getPanel: (id: string) => SimulationPanel | undefined;
  getWidget: (id: string) => SimulationWidget | undefined;
  getSimulation: (id: string) => SimulationData | undefined;
  getFilteredPanels: () => SimulationPanel[];
  getFilteredWidgets: () => SimulationWidget[];
  getFilteredSimulations: () => SimulationData[];
  getSortedPanels: () => SimulationPanel[];
  getSortedWidgets: () => SimulationWidget[];
  getSortedSimulations: () => SimulationData[];
  
  // Utility actions
  clearSelections: () => void;
  resetFilters: () => void;
  resetSorts: () => void;
  resetLayout: () => void;
  exportState: () => string;
  importState: (state: string) => void;
}

export const useOverlaySimulationPanelStore = create<OverlaySimulationPanelState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial data
        panels: [],
        widgets: [],
        simulations: [],
        
        // Initial selection
        selectedPanel: null,
        selectedWidget: null,
        selectedSimulation: null,
        
        // Initial view state
        view: 'panels',
        panelView: 'grid',
        widgetView: 'grid',
        simulationView: 'grid',
        
        // Initial filter state
        panelFilter: {
          status: 'all',
          type: 'all',
          search: ''
        },
        widgetFilter: {
          type: 'all',
          status: 'all',
          search: ''
        },
        simulationFilter: {
          status: 'all',
          timeRange: 'all',
          search: ''
        },
        
        // Initial sort state
        panelSort: {
          field: 'updated',
          direction: 'desc'
        },
        widgetSort: {
          field: 'updated',
          direction: 'desc'
        },
        simulationSort: {
          field: 'created',
          direction: 'desc'
        },
        
        // Initial layout state
        layout: {
          sidebar: true,
          toolbar: true,
          statusbar: true,
          maximized: false
        },
        
        // Initial UI state
        isDragging: false,
        isResizing: false,
        dragTarget: null,
        resizeTarget: null,
        
        // Initial settings
        settings: {
          autoRefresh: true,
          refreshInterval: 30000,
          theme: 'light',
          gridSize: 20,
          snapToGrid: true,
          showGrid: false,
          animationsEnabled: true,
          confirmDeletes: true
        },
        
        // Panel actions
        setPanels: (panels) => set({ panels }),
        addPanel: (panel) => set((state) => ({ 
          panels: [...state.panels, panel] 
        })),
        updatePanel: (id, updates) => set((state) => ({
          panels: state.panels.map(p => 
            p.id === id ? { ...p, ...updates } : p
          )
        })),
        removePanel: (id) => set((state) => ({
          panels: state.panels.filter(p => p.id !== id),
          selectedPanel: state.selectedPanel === id ? null : state.selectedPanel
        })),
        setSelectedPanel: (id) => set({ selectedPanel: id }),
        
        // Widget actions
        setWidgets: (widgets) => set({ widgets }),
        addWidget: (widget) => set((state) => ({ 
          widgets: [...state.widgets, widget] 
        })),
        updateWidget: (id, updates) => set((state) => ({
          widgets: state.widgets.map(w => 
            w.id === id ? { ...w, ...updates } : w
          )
        })),
        removeWidget: (id) => set((state) => ({
          widgets: state.widgets.filter(w => w.id !== id),
          selectedWidget: state.selectedWidget === id ? null : state.selectedWidget
        })),
        setSelectedWidget: (id) => set({ selectedWidget: id }),
        
        // Simulation actions
        setSimulations: (simulations) => set({ simulations }),
        addSimulation: (simulation) => set((state) => ({ 
          simulations: [...state.simulations, simulation] 
        })),
        updateSimulation: (id, updates) => set((state) => ({
          simulations: state.simulations.map(s => 
            s.id === id ? { ...s, ...updates } : s
          )
        })),
        removeSimulation: (id) => set((state) => ({
          simulations: state.simulations.filter(s => s.id !== id),
          selectedSimulation: state.selectedSimulation === id ? null : state.selectedSimulation
        })),
        setSelectedSimulation: (id) => set({ selectedSimulation: id }),
        
        // View actions
        setView: (view) => set({ view }),
        setPanelView: (panelView) => set({ panelView }),
        setWidgetView: (widgetView) => set({ widgetView }),
        setSimulationView: (simulationView) => set({ simulationView }),
        
        // Filter actions
        setFilter: (type, filter) => set((state) => {
          switch (type) {
            case 'panel':
              return { panelFilter: { ...state.panelFilter, ...filter } };
            case 'widget':
              return { widgetFilter: { ...state.widgetFilter, ...filter } };
            case 'simulation':
              return { simulationFilter: { ...state.simulationFilter, ...filter } };
            default:
              return state;
          }
        }),
        
        // Sort actions
        setSort: (type, sort) => set((state) => {
          switch (type) {
            case 'panel':
              return { panelSort: { ...state.panelSort, ...sort } };
            case 'widget':
              return { widgetSort: { ...state.widgetSort, ...sort } };
            case 'simulation':
              return { simulationSort: { ...state.simulationSort, ...sort } };
            default:
              return state;
          }
        }),
        
        // Layout actions
        setLayout: (layout) => set((state) => ({
          layout: { ...state.layout, ...layout }
        })),
        
        // Drag/resize actions
        setDragState: (isDragging, target = null) => set({ 
          isDragging, 
          dragTarget: target 
        }),
        setResizeState: (isResizing, target = null) => set({ 
          isResizing, 
          resizeTarget: target 
        }),
        
        // Settings actions
        setSettings: (settings) => set((state) => ({
          settings: { ...state.settings, ...settings }
        })),
        
        // Computed getters
        getPanel: (id) => {
          const state = get();
          return state.panels.find(p => p.id === id);
        },
        getWidget: (id) => {
          const state = get();
          return state.widgets.find(w => w.id === id);
        },
        getSimulation: (id) => {
          const state = get();
          return state.simulations.find(s => s.id === id);
        },
        
        getFilteredPanels: () => {
          const state = get();
          let filtered = state.panels;
          
          // Filter by status
          if (state.panelFilter.status !== 'all') {
            filtered = filtered.filter(p => {
              switch (state.panelFilter.status) {
                case 'active': return p.isActive;
                case 'inactive': return !p.isActive;
                default: return true;
              }
            });
          }
          
          // Filter by search
          if (state.panelFilter.search) {
            const search = state.panelFilter.search.toLowerCase();
            filtered = filtered.filter(p => 
              p.name.toLowerCase().includes(search) ||
              p.description.toLowerCase().includes(search)
            );
          }
          
          return filtered;
        },
        
        getFilteredWidgets: () => {
          const state = get();
          let filtered = state.widgets;
          
          // Filter by type
          if (state.widgetFilter.type !== 'all') {
            filtered = filtered.filter(w => w.type === state.widgetFilter.type);
          }
          
          // Filter by status
          if (state.widgetFilter.status !== 'all') {
            filtered = filtered.filter(w => {
              switch (state.widgetFilter.status) {
                case 'loading': return w.isLoading;
                case 'error': return w.hasError;
                case 'success': return !w.isLoading && !w.hasError;
                default: return true;
              }
            });
          }
          
          // Filter by search
          if (state.widgetFilter.search) {
            const search = state.widgetFilter.search.toLowerCase();
            filtered = filtered.filter(w => 
              w.title.toLowerCase().includes(search) ||
              (w.description && w.description.toLowerCase().includes(search))
            );
          }
          
          return filtered;
        },
        
        getFilteredSimulations: () => {
          const state = get();
          let filtered = state.simulations;
          
          // Filter by status
          if (state.simulationFilter.status !== 'all') {
            filtered = filtered.filter(s => s.status === state.simulationFilter.status);
          }
          
          // Filter by time range
          if (state.simulationFilter.timeRange !== 'all') {
            const now = new Date();
            let cutoff: Date;
            
            switch (state.simulationFilter.timeRange) {
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
            
            filtered = filtered.filter(s => s.startDate >= cutoff);
          }
          
          // Filter by search
          if (state.simulationFilter.search) {
            const search = state.simulationFilter.search.toLowerCase();
            filtered = filtered.filter(s => 
              s.name.toLowerCase().includes(search) ||
              s.description.toLowerCase().includes(search)
            );
          }
          
          return filtered;
        },
        
        getSortedPanels: () => {
          const state = get();
          const filtered = state.getFilteredPanels();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.panelSort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
              case 'created':
                aValue = a.createdAt;
                bValue = b.createdAt;
                break;
              case 'updated':
                aValue = a.updatedAt;
                bValue = b.updatedAt;
                break;
              case 'lastRefresh':
                aValue = a.lastRefresh;
                bValue = b.lastRefresh;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        getSortedWidgets: () => {
          const state = get();
          const filtered = state.getFilteredWidgets();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.widgetSort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'title':
                aValue = a.title;
                bValue = b.title;
                break;
              case 'type':
                aValue = a.type;
                bValue = b.type;
                break;
              case 'created':
                aValue = a.createdAt;
                bValue = b.createdAt;
                break;
              case 'updated':
                aValue = a.updatedAt;
                bValue = b.updatedAt;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        getSortedSimulations: () => {
          const state = get();
          const filtered = state.getFilteredSimulations();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.simulationSort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
              case 'created':
                aValue = a.startDate;
                bValue = b.startDate;
                break;
              case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
              case 'progress':
                aValue = a.progress;
                bValue = b.progress;
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
        clearSelections: () => set({ 
          selectedPanel: null,
          selectedWidget: null,
          selectedSimulation: null
        }),
        
        resetFilters: () => set({
          panelFilter: { status: 'all', type: 'all', search: '' },
          widgetFilter: { type: 'all', status: 'all', search: '' },
          simulationFilter: { status: 'all', timeRange: 'all', search: '' }
        }),
        
        resetSorts: () => set({
          panelSort: { field: 'updated', direction: 'desc' },
          widgetSort: { field: 'updated', direction: 'desc' },
          simulationSort: { field: 'created', direction: 'desc' }
        }),
        
        resetLayout: () => set({
          layout: {
            sidebar: true,
            toolbar: true,
            statusbar: true,
            maximized: false
          }
        }),
        
        exportState: () => {
          const state = get();
          return JSON.stringify({
            panels: state.panels,
            widgets: state.widgets,
            simulations: state.simulations,
            settings: state.settings
          });
        },
        
        importState: (stateString) => {
          try {
            const imported = JSON.parse(stateString);
            set({
              panels: imported.panels || [],
              widgets: imported.widgets || [],
              simulations: imported.simulations || [],
              settings: { ...get().settings, ...imported.settings }
            });
          } catch (error) {
            console.error('Failed to import state:', error);
          }
        }
      }),
      {
        name: 'overlay-simulation-panel-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist UI preferences and settings
          view: state.view,
          panelView: state.panelView,
          widgetView: state.widgetView,
          simulationView: state.simulationView,
          panelFilter: state.panelFilter,
          widgetFilter: state.widgetFilter,
          simulationFilter: state.simulationFilter,
          panelSort: state.panelSort,
          widgetSort: state.widgetSort,
          simulationSort: state.simulationSort,
          layout: state.layout,
          settings: state.settings
        }),
        version: 1
      }
    )
  )
);

// Selector hooks for specific data
export const usePanelData = () => useOverlaySimulationPanelStore(state => ({
  panels: state.panels,
  selectedPanel: state.selectedPanel,
  panelView: state.panelView,
  getPanel: state.getPanel,
  getSortedPanels: state.getSortedPanels
}));

export const useWidgetData = () => useOverlaySimulationPanelStore(state => ({
  widgets: state.widgets,
  selectedWidget: state.selectedWidget,
  widgetView: state.widgetView,
  getWidget: state.getWidget,
  getSortedWidgets: state.getSortedWidgets
}));

export const useSimulationData = () => useOverlaySimulationPanelStore(state => ({
  simulations: state.simulations,
  selectedSimulation: state.selectedSimulation,
  simulationView: state.simulationView,
  getSimulation: state.getSimulation,
  getSortedSimulations: state.getSortedSimulations
}));

export const usePanelLayout = () => useOverlaySimulationPanelStore(state => ({
  layout: state.layout,
  isDragging: state.isDragging,
  isResizing: state.isResizing,
  dragTarget: state.dragTarget,
  resizeTarget: state.resizeTarget,
  setLayout: state.setLayout,
  setDragState: state.setDragState,
  setResizeState: state.setResizeState
}));

export const usePanelSettings = () => useOverlaySimulationPanelStore(state => ({
  settings: state.settings,
  setSettings: state.setSettings
})); 