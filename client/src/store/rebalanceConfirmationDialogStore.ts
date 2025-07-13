// Block 27: Rebalance Confirmation Dialog - Store
// Zustand store for rebalance confirmation dialog management

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  RebalanceConfirmationDialog,
  ValidationResult
} from '../types/rebalanceConfirmationDialog';

interface RebalanceConfirmationDialogState {
  // Data
  dialogs: RebalanceConfirmationDialog[];
  
  // Selection
  selectedDialog: string | null;
  
  // UI State
  showValidationDetails: boolean;
  autoValidate: boolean;
  confirmationRequired: boolean;
  
  // Settings
  settings: {
    theme: 'light' | 'dark' | 'auto';
    autoClose: boolean;
    autoCloseDelay: number;
    showStepProgress: boolean;
    enableKeyboardNavigation: boolean;
    requireDoubleConfirmation: boolean;
    showWarnings: boolean;
    playNotificationSounds: boolean;
  };
  
  // Actions
  setDialogs: (dialogs: RebalanceConfirmationDialog[]) => void;
  addDialog: (dialog: RebalanceConfirmationDialog) => void;
  updateDialog: (id: string, updates: Partial<RebalanceConfirmationDialog>) => void;
  removeDialog: (id: string) => void;
  setSelectedDialog: (id: string | null) => void;
  
  setShowValidationDetails: (show: boolean) => void;
  setAutoValidate: (auto: boolean) => void;
  setConfirmationRequired: (required: boolean) => void;
  
  setSettings: (settings: Partial<RebalanceConfirmationDialogState['settings']>) => void;
  
  // Computed getters
  getDialog: (id: string) => RebalanceConfirmationDialog | undefined;
  getOpenDialogs: () => RebalanceConfirmationDialog[];
  getExpiredDialogs: () => RebalanceConfirmationDialog[];
  getValidDialogs: () => RebalanceConfirmationDialog[];
  getInvalidDialogs: () => RebalanceConfirmationDialog[];
  
  // Utilities
  clearExpiredDialogs: () => void;
  exportDialogData: () => string;
  importDialogData: (data: string) => void;
}

export const useRebalanceConfirmationDialogStore = create<RebalanceConfirmationDialogState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial data
        dialogs: [],
        
        // Initial selection
        selectedDialog: null,
        
        // Initial UI state
        showValidationDetails: false,
        autoValidate: true,
        confirmationRequired: true,
        
        // Initial settings
        settings: {
          theme: 'light',
          autoClose: false,
          autoCloseDelay: 5000,
          showStepProgress: true,
          enableKeyboardNavigation: true,
          requireDoubleConfirmation: false,
          showWarnings: true,
          playNotificationSounds: false
        },
        
        // Dialog actions
        setDialogs: (dialogs) => set({ dialogs }),
        addDialog: (dialog) => set((state) => ({ 
          dialogs: [...state.dialogs, dialog] 
        })),
        updateDialog: (id, updates) => set((state) => ({
          dialogs: state.dialogs.map(d => 
            d.id === id ? { ...d, ...updates } : d
          )
        })),
        removeDialog: (id) => set((state) => ({
          dialogs: state.dialogs.filter(d => d.id !== id),
          selectedDialog: state.selectedDialog === id ? null : state.selectedDialog
        })),
        setSelectedDialog: (id) => set({ selectedDialog: id }),
        
        // UI actions
        setShowValidationDetails: (show) => set({ showValidationDetails: show }),
        setAutoValidate: (auto) => set({ autoValidate: auto }),
        setConfirmationRequired: (required) => set({ confirmationRequired: required }),
        
        // Settings actions
        setSettings: (settings) => set((state) => ({
          settings: { ...state.settings, ...settings }
        })),
        
        // Computed getters
        getDialog: (id) => {
          const state = get();
          return state.dialogs.find(d => d.id === id);
        },
        
        getOpenDialogs: () => {
          const state = get();
          return state.dialogs.filter(d => d.isOpen);
        },
        
        getExpiredDialogs: () => {
          const state = get();
          const now = new Date();
          return state.dialogs.filter(d => d.expiresAt && d.expiresAt < now);
        },
        
        getValidDialogs: () => {
          const state = get();
          return state.dialogs.filter(d => d.validation.isValid);
        },
        
        getInvalidDialogs: () => {
          const state = get();
          return state.dialogs.filter(d => !d.validation.isValid);
        },
        
        // Utilities
        clearExpiredDialogs: () => set((state) => {
          const now = new Date();
          return {
            dialogs: state.dialogs.filter(d => !d.expiresAt || d.expiresAt >= now)
          };
        }),
        
        exportDialogData: () => {
          const state = get();
          return JSON.stringify({
            dialogs: state.dialogs.map(d => ({
              id: d.id,
              title: d.title,
              rebalanceData: d.rebalanceData,
              userActions: d.userActions,
              validation: d.validation,
              createdAt: d.createdAt,
              updatedAt: d.updatedAt
            })),
            settings: state.settings
          });
        },
        
        importDialogData: (data) => {
          try {
            const imported = JSON.parse(data);
            set({
              dialogs: imported.dialogs || [],
              settings: { ...get().settings, ...imported.settings }
            });
          } catch (error) {
            console.error('Failed to import dialog data:', error);
          }
        }
      }),
      {
        name: 'rebalance-confirmation-dialog-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist settings and UI preferences only
          showValidationDetails: state.showValidationDetails,
          autoValidate: state.autoValidate,
          confirmationRequired: state.confirmationRequired,
          settings: state.settings
        }),
        version: 1
      }
    )
  )
);

// Selector hooks for specific data
export const useDialogData = () => useRebalanceConfirmationDialogStore(state => ({
  dialogs: state.dialogs,
  selectedDialog: state.selectedDialog,
  getDialog: state.getDialog
}));

export const useDialogUI = () => useRebalanceConfirmationDialogStore(state => ({
  showValidationDetails: state.showValidationDetails,
  autoValidate: state.autoValidate,
  confirmationRequired: state.confirmationRequired,
  setShowValidationDetails: state.setShowValidationDetails,
  setAutoValidate: state.setAutoValidate,
  setConfirmationRequired: state.setConfirmationRequired
}));

export const useDialogSettings = () => useRebalanceConfirmationDialogStore(state => ({
  settings: state.settings,
  setSettings: state.setSettings
}));

export const useDialogStats = () => useRebalanceConfirmationDialogStore(state => ({
  totalDialogs: state.dialogs.length,
  openDialogs: state.getOpenDialogs().length,
  expiredDialogs: state.getExpiredDialogs().length,
  validDialogs: state.getValidDialogs().length,
  invalidDialogs: state.getInvalidDialogs().length
})); 