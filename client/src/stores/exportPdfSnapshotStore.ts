// Block 84: Export to PDF Snapshot - Store
// Zustand State Management for PDF Generation

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ExportPDFSnapshotEngine } from '../engines/ExportPDFSnapshotEngine';
import {
  PDFSnapshot,
  PDFTemplate,
  ExportPDFSnapshotState,
  PDFFileInfo,
  SharingConfig,
  ExportStatus
} from '../types/exportPdfSnapshot';

interface ExportPDFSnapshotStore extends ExportPDFSnapshotState {
  // Engine reference
  engine: ExportPDFSnapshotEngine;
  
  // Actions
  actions: {
    // Snapshot operations
    createSnapshot: (config: Omit<PDFSnapshot, 'id' | 'userId' | 'createdAt'>) => Promise<PDFSnapshot>;
    updateSnapshot: (id: string, updates: Partial<PDFSnapshot>) => Promise<PDFSnapshot>;
    deleteSnapshot: (id: string) => Promise<void>;
    loadSnapshots: () => Promise<void>;
    
    // Generation operations
    generatePDF: (snapshotId: string) => Promise<PDFFileInfo>;
    downloadPDF: (snapshotId: string) => Promise<void>;
    previewPDF: (snapshotId: string) => Promise<string>;
    cancelGeneration: (snapshotId: string) => void;
    
    // Template operations
    loadTemplates: () => Promise<void>;
    createTemplate: (template: Omit<PDFTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PDFTemplate>;
    updateTemplate: (id: string, updates: Partial<PDFTemplate>) => Promise<PDFTemplate>;
    deleteTemplate: (id: string) => Promise<void>;
    
    // Sharing operations
    shareSnapshot: (snapshotId: string, sharingConfig: SharingConfig) => Promise<string>;
    getSharedSnapshot: (shareId: string) => Promise<PDFSnapshot>;
    
    // Selection and UI state
    setCurrentSnapshot: (snapshotId: string | null) => void;
    toggleSnapshotSelection: (snapshotId: string) => void;
    clearSelection: () => void;
    
    // Generation state management
    addGeneratingSnapshot: (snapshotId: string) => void;
    removeGeneratingSnapshot: (snapshotId: string) => void;
    
    // Cache management
    invalidateCache: (snapshotId?: string) => void;
    refreshData: () => Promise<void>;
    
    // Error handling
    setError: (snapshotId: string, error: string) => void;
    clearError: (snapshotId: string) => void;
    clearAllErrors: () => void;
  };
  
  // Computed values
  computed: {
    getCurrentSnapshot: () => PDFSnapshot | null;
    getSnapshotsByStatus: (status: ExportStatus) => PDFSnapshot[];
    getGeneratingSnapshots: () => PDFSnapshot[];
    getSharedSnapshots: () => PDFSnapshot[];
    getSnapshotStats: () => {
      totalSnapshots: number;
      completedSnapshots: number;
      generatingSnapshots: number;
      failedSnapshots: number;
      sharedSnapshots: number;
      totalFileSize: number;
      totalDownloads: number;
    } | null;
    getTemplatesByType: (templateType: string) => PDFTemplate[];
  };
}

export const useExportPDFSnapshotStore = create<ExportPDFSnapshotStore>()(
  persist(
    (set, get) => ({
      // Initial state
      snapshots: {},
      templates: {},
      currentSnapshotId: null,
      generatingSnapshots: {},
      selectedSnapshotIds: [],
      lastUpdated: {},
      cacheExpiry: 10 * 60 * 1000, // 10 minutes
      errors: {},
      
      // Engine instance
      engine: ExportPDFSnapshotEngine.getInstance(),
      
      // Actions
      actions: {
        // Create new snapshot
        createSnapshot: async (config) => {
          const { engine } = get();
          
          try {
            const newSnapshot = engine.createSnapshot(config);
            
            set((state) => ({
              snapshots: {
                ...state.snapshots,
                [newSnapshot.id]: newSnapshot
              },
              currentSnapshotId: newSnapshot.id,
              lastUpdated: {
                ...state.lastUpdated,
                [newSnapshot.id]: new Date()
              }
            }));
            
            return newSnapshot;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create snapshot';
            get().actions.setError('create', errorMessage);
            throw error;
          }
        },
        
        // Update snapshot
        updateSnapshot: async (id, updates) => {
          const { engine } = get();
          
          try {
            const updatedSnapshot = engine.updateSnapshot(id, updates);
            
            set((state) => ({
              snapshots: {
                ...state.snapshots,
                [id]: updatedSnapshot
              },
              lastUpdated: {
                ...state.lastUpdated,
                [id]: new Date()
              }
            }));
            
            return updatedSnapshot;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update snapshot';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Delete snapshot
        deleteSnapshot: async (id) => {
          const { engine } = get();
          
          try {
            engine.deleteSnapshot(id);
            
            set((state) => {
              const { [id]: deletedSnapshot, ...remainingSnapshots } = state.snapshots;
              const { [id]: deletedUpdate, ...remainingUpdates } = state.lastUpdated;
              const { [id]: deletedGenerating, ...remainingGenerating } = state.generatingSnapshots;
              const { [id]: deletedErrors, ...remainingErrors } = state.errors;
              
              return {
                snapshots: remainingSnapshots,
                currentSnapshotId: state.currentSnapshotId === id ? null : state.currentSnapshotId,
                selectedSnapshotIds: state.selectedSnapshotIds.filter(snapshotId => snapshotId !== id),
                lastUpdated: remainingUpdates,
                generatingSnapshots: remainingGenerating,
                errors: remainingErrors
              };
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete snapshot';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Load all snapshots
        loadSnapshots: async () => {
          const { engine } = get();
          
          try {
            const snapshots = engine.getSnapshots();
            const snapshotDict = snapshots.reduce((acc, snapshot) => {
              acc[snapshot.id] = snapshot;
              return acc;
            }, {} as Record<string, PDFSnapshot>);
            
            const now = new Date();
            const lastUpdated = snapshots.reduce((acc, snapshot) => {
              acc[snapshot.id] = now;
              return acc;
            }, {} as Record<string, Date>);
            
            set((state) => ({
              snapshots: snapshotDict,
              lastUpdated,
              currentSnapshotId: state.currentSnapshotId || (snapshots.length > 0 ? snapshots[0].id : null)
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load snapshots';
            get().actions.setError('load', errorMessage);
            throw error;
          }
        },
        
        // Generate PDF
        generatePDF: async (snapshotId) => {
          const { engine } = get();
          
          try {
            // Mark as generating
            get().actions.addGeneratingSnapshot(snapshotId);
            
            // Update snapshot status
            set((state) => ({
              snapshots: {
                ...state.snapshots,
                [snapshotId]: {
                  ...state.snapshots[snapshotId],
                  status: 'generating'
                }
              }
            }));
            
            const fileInfo = await engine.generatePDF(snapshotId);
            
            // Update snapshot with completion
            const updatedSnapshot = engine.getSnapshot(snapshotId);
            if (updatedSnapshot) {
              set((state) => ({
                snapshots: {
                  ...state.snapshots,
                  [snapshotId]: updatedSnapshot
                },
                lastUpdated: {
                  ...state.lastUpdated,
                  [snapshotId]: new Date()
                }
              }));
            }
            
            return fileInfo;
          } catch (error) {
            // Update snapshot status to failed
            set((state) => ({
              snapshots: {
                ...state.snapshots,
                [snapshotId]: {
                  ...state.snapshots[snapshotId],
                  status: 'failed'
                }
              }
            }));
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
            get().actions.setError(snapshotId, errorMessage);
            throw error;
          } finally {
            // Remove from generating
            get().actions.removeGeneratingSnapshot(snapshotId);
          }
        },
        
        // Download PDF
        downloadPDF: async (snapshotId) => {
          const { engine } = get();
          
          try {
            await engine.downloadPDF(snapshotId);
            
            // Update download count
            const updatedSnapshot = engine.getSnapshot(snapshotId);
            if (updatedSnapshot) {
              set((state) => ({
                snapshots: {
                  ...state.snapshots,
                  [snapshotId]: updatedSnapshot
                },
                lastUpdated: {
                  ...state.lastUpdated,
                  [snapshotId]: new Date()
                }
              }));
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to download PDF';
            get().actions.setError(snapshotId, errorMessage);
            throw error;
          }
        },
        
        // Preview PDF
        previewPDF: async (snapshotId) => {
          const { engine } = get();
          
          try {
            const previewUrl = await engine.previewPDF(snapshotId);
            
            // Update snapshot if preview was generated
            const updatedSnapshot = engine.getSnapshot(snapshotId);
            if (updatedSnapshot) {
              set((state) => ({
                snapshots: {
                  ...state.snapshots,
                  [snapshotId]: updatedSnapshot
                },
                lastUpdated: {
                  ...state.lastUpdated,
                  [snapshotId]: new Date()
                }
              }));
            }
            
            return previewUrl;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate preview';
            get().actions.setError(snapshotId, errorMessage);
            throw error;
          }
        },
        
        // Cancel generation
        cancelGeneration: (snapshotId) => {
          const { engine } = get();
          
          try {
            engine.cancelGeneration(snapshotId);
            
            // Update local state
            get().actions.removeGeneratingSnapshot(snapshotId);
            
            set((state) => ({
              snapshots: {
                ...state.snapshots,
                [snapshotId]: {
                  ...state.snapshots[snapshotId],
                  status: 'cancelled'
                }
              }
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to cancel generation';
            get().actions.setError(snapshotId, errorMessage);
          }
        },
        
        // Load templates
        loadTemplates: async () => {
          const { engine } = get();
          
          try {
            const templates = engine.getTemplates();
            const templateDict = templates.reduce((acc, template) => {
              acc[template.id] = template;
              return acc;
            }, {} as Record<string, PDFTemplate>);
            
            set({ templates: templateDict });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load templates';
            get().actions.setError('templates', errorMessage);
            throw error;
          }
        },
        
        // Create template
        createTemplate: async (template) => {
          const { engine } = get();
          
          try {
            const newTemplate = engine.createTemplate(template);
            
            set((state) => ({
              templates: {
                ...state.templates,
                [newTemplate.id]: newTemplate
              }
            }));
            
            return newTemplate;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create template';
            get().actions.setError('template_create', errorMessage);
            throw error;
          }
        },
        
        // Update template
        updateTemplate: async (id, updates) => {
          const { engine } = get();
          
          try {
            const updatedTemplate = engine.updateTemplate(id, updates);
            
            set((state) => ({
              templates: {
                ...state.templates,
                [id]: updatedTemplate
              }
            }));
            
            return updatedTemplate;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Delete template
        deleteTemplate: async (id) => {
          const { engine } = get();
          
          try {
            engine.deleteTemplate(id);
            
            set((state) => {
              const { [id]: deletedTemplate, ...remainingTemplates } = state.templates;
              return { templates: remainingTemplates };
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Share snapshot
        shareSnapshot: async (snapshotId, sharingConfig) => {
          const { engine } = get();
          
          try {
            const shareUrl = await engine.shareSnapshot(snapshotId, sharingConfig);
            
            // Update snapshot in local state
            const updatedSnapshot = engine.getSnapshot(snapshotId);
            if (updatedSnapshot) {
              set((state) => ({
                snapshots: {
                  ...state.snapshots,
                  [snapshotId]: updatedSnapshot
                },
                lastUpdated: {
                  ...state.lastUpdated,
                  [snapshotId]: new Date()
                }
              }));
            }
            
            return shareUrl;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to share snapshot';
            get().actions.setError(snapshotId, errorMessage);
            throw error;
          }
        },
        
        // Get shared snapshot
        getSharedSnapshot: async (shareId) => {
          const { engine } = get();
          
          try {
            return await engine.getSharedSnapshot(shareId);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to get shared snapshot';
            get().actions.setError('share', errorMessage);
            throw error;
          }
        },
        
        // Set current snapshot
        setCurrentSnapshot: (snapshotId) => {
          set({ currentSnapshotId: snapshotId });
        },
        
        // Toggle snapshot selection
        toggleSnapshotSelection: (snapshotId) => {
          set((state) => ({
            selectedSnapshotIds: state.selectedSnapshotIds.includes(snapshotId)
              ? state.selectedSnapshotIds.filter(id => id !== snapshotId)
              : [...state.selectedSnapshotIds, snapshotId]
          }));
        },
        
        // Clear selection
        clearSelection: () => {
          set({ selectedSnapshotIds: [] });
        },
        
        // Add generating snapshot
        addGeneratingSnapshot: (snapshotId) => {
          set((state) => ({
            generatingSnapshots: {
              ...state.generatingSnapshots,
              [snapshotId]: true
            }
          }));
        },
        
        // Remove generating snapshot
        removeGeneratingSnapshot: (snapshotId) => {
          set((state) => {
            const { [snapshotId]: deleted, ...remaining } = state.generatingSnapshots;
            return { generatingSnapshots: remaining };
          });
        },
        
        // Cache management
        invalidateCache: (snapshotId) => {
          if (snapshotId) {
            set((state) => {
              const { [snapshotId]: deleted, ...remaining } = state.lastUpdated;
              return { lastUpdated: remaining };
            });
          } else {
            set({ lastUpdated: {} });
          }
        },
        
        // Refresh data
        refreshData: async () => {
          await Promise.all([
            get().actions.loadSnapshots(),
            get().actions.loadTemplates()
          ]);
        },
        
        // Error handling
        setError: (snapshotId, error) => {
          set((state) => ({
            errors: {
              ...state.errors,
              [snapshotId]: error
            }
          }));
        },
        
        clearError: (snapshotId) => {
          set((state) => {
            const { [snapshotId]: deleted, ...remaining } = state.errors;
            return { errors: remaining };
          });
        },
        
        clearAllErrors: () => {
          set({ errors: {} });
        }
      },
      
      // Computed values
      computed: {
        // Get current snapshot
        getCurrentSnapshot: () => {
          const { snapshots, currentSnapshotId } = get();
          return currentSnapshotId ? snapshots[currentSnapshotId] || null : null;
        },
        
        // Get snapshots by status
        getSnapshotsByStatus: (status) => {
          const { snapshots } = get();
          return Object.values(snapshots).filter(snapshot => snapshot.status === status);
        },
        
        // Get generating snapshots
        getGeneratingSnapshots: () => {
          const { snapshots, generatingSnapshots } = get();
          return Object.values(snapshots).filter(snapshot => generatingSnapshots[snapshot.id]);
        },
        
        // Get shared snapshots
        getSharedSnapshots: () => {
          const { snapshots } = get();
          return Object.values(snapshots).filter(snapshot => snapshot.sharingConfig.isShareable);
        },
        
        // Get snapshot statistics
        getSnapshotStats: () => {
          const { snapshots } = get();
          const snapshotArray = Object.values(snapshots);
          
          if (snapshotArray.length === 0) return null;
          
          const completedSnapshots = snapshotArray.filter(s => s.status === 'completed').length;
          const generatingSnapshots = snapshotArray.filter(s => s.status === 'generating').length;
          const failedSnapshots = snapshotArray.filter(s => s.status === 'failed').length;
          const sharedSnapshots = snapshotArray.filter(s => s.sharingConfig.isShareable).length;
          
          const totalFileSize = snapshotArray.reduce((sum, snapshot) => 
            sum + (snapshot.fileInfo?.fileSize || 0), 0
          );
          
          const totalDownloads = snapshotArray.reduce((sum, snapshot) => 
            sum + (snapshot.fileInfo?.downloadCount || 0), 0
          );
          
          return {
            totalSnapshots: snapshotArray.length,
            completedSnapshots,
            generatingSnapshots,
            failedSnapshots,
            sharedSnapshots,
            totalFileSize,
            totalDownloads
          };
        },
        
        // Get templates by type
        getTemplatesByType: (templateType) => {
          const { templates } = get();
          return Object.values(templates).filter(template => template.templateType === templateType);
        }
      }
    }),
    {
      name: 'export-pdf-snapshot-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only essential state
        currentSnapshotId: state.currentSnapshotId,
        selectedSnapshotIds: state.selectedSnapshotIds,
        cacheExpiry: state.cacheExpiry
      })
    }
  )
);

// Initialize store
useExportPDFSnapshotStore.getState().actions.loadSnapshots();
useExportPDFSnapshotStore.getState().actions.loadTemplates();

export default useExportPDFSnapshotStore; 