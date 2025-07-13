// Block 30: Asset Tagging System - Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AssetTag, AssetTaggingState, TagFilter } from '../types/assetTagging';
import { assetTaggingEngine } from '../engines/AssetTaggingEngine';

interface AssetTaggingStore extends AssetTaggingState {
  // State
  activeFilter: TagFilter;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshTags: () => void;
  
  // Tag management
  createTag: (name: string, color: string, description?: string) => AssetTag;
  deleteTag: (tagId: string) => boolean;
  updateTag: (tagId: string, updates: Partial<AssetTag>) => boolean;
  
  // Asset tagging
  tagAsset: (assetSymbol: string, tagIds: string[]) => void;
  untagAsset: (assetSymbol: string, tagIds: string[]) => void;
  bulkTagAssets: (assetSymbols: string[], tagIds: string[]) => void;
  
  // Filtering
  setSelectedTags: (tagIds: string[]) => void;
  setActiveFilter: (filter: TagFilter) => void;
  applyFilter: (assets: string[]) => string[];
  
  // Search
  searchAssetsByTag: (tagName: string) => string[];
  
  // Import/Export
  exportTags: () => { tags: AssetTag[], assetTags: Record<string, string[]> };
  importTags: (data: { tags: AssetTag[], assetTags: Record<string, string[]> }) => void;
  
  // Utility
  getTagStats: () => {
    totalTags: number;
    totalTaggedAssets: number;
    mostUsedTags: AssetTag[];
  };
}

export const useAssetTaggingStore = create<AssetTaggingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tags: [],
      assetTags: new Map(),
      selectedTags: [],
      isLoading: false,
      error: null,
      activeFilter: {
        includeTags: [],
        excludeTags: [],
        operator: 'AND'
      },

      // Basic actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      refreshTags: () => {
        set({ tags: assetTaggingEngine.getAllTags() });
      },

      // Tag management
      createTag: (name, color, description) => {
        try {
          const newTag = assetTaggingEngine.createTag(name, color, description);
          set({ 
            tags: assetTaggingEngine.getAllTags(),
            error: null 
          });
          return newTag;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create tag' });
          throw error;
        }
      },

      deleteTag: (tagId) => {
        try {
          const success = assetTaggingEngine.deleteTag(tagId);
          if (success) {
            const state = get();
            set({ 
              tags: assetTaggingEngine.getAllTags(),
              selectedTags: state.selectedTags.filter(id => id !== tagId),
              error: null 
            });
          }
          return success;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete tag' });
          return false;
        }
      },

      updateTag: (tagId, updates) => {
        try {
          const tags = get().tags;
          const tagIndex = tags.findIndex(tag => tag.id === tagId);
          if (tagIndex === -1) return false;

          const updatedTags = [...tags];
          updatedTags[tagIndex] = { ...updatedTags[tagIndex], ...updates };
          
          set({ tags: updatedTags, error: null });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update tag' });
          return false;
        }
      },

      // Asset tagging
      tagAsset: (assetSymbol, tagIds) => {
        try {
          assetTaggingEngine.tagAsset(assetSymbol, tagIds);
          set({ 
            tags: assetTaggingEngine.getAllTags(), // Refresh usage counts
            error: null 
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to tag asset' });
        }
      },

      untagAsset: (assetSymbol, tagIds) => {
        try {
          assetTaggingEngine.untagAsset(assetSymbol, tagIds);
          set({ 
            tags: assetTaggingEngine.getAllTags(), // Refresh usage counts
            error: null 
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to untag asset' });
        }
      },

      bulkTagAssets: (assetSymbols, tagIds) => {
        try {
          assetSymbols.forEach(symbol => {
            assetTaggingEngine.tagAsset(symbol, tagIds);
          });
          set({ 
            tags: assetTaggingEngine.getAllTags(),
            error: null 
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to bulk tag assets' });
        }
      },

      // Filtering
      setSelectedTags: (tagIds) => set({ selectedTags: tagIds }),
      
      setActiveFilter: (filter) => set({ activeFilter: filter }),
      
      applyFilter: (assets) => {
        const { activeFilter } = get();
        
        if (activeFilter.includeTags.length === 0 && activeFilter.excludeTags.length === 0) {
          return assets;
        }

        return assets.filter(assetSymbol => {
          const assetTags = assetTaggingEngine.getAssetTags(assetSymbol).map(tag => tag.id);
          
          // Check exclude tags first
          if (activeFilter.excludeTags.length > 0) {
            const hasExcludedTag = activeFilter.excludeTags.some(tagId => assetTags.includes(tagId));
            if (hasExcludedTag) return false;
          }

          // Check include tags
          if (activeFilter.includeTags.length > 0) {
            if (activeFilter.operator === 'AND') {
              return activeFilter.includeTags.every(tagId => assetTags.includes(tagId));
            } else {
              return activeFilter.includeTags.some(tagId => assetTags.includes(tagId));
            }
          }

          return true;
        });
      },

      // Search
      searchAssetsByTag: (tagName) => {
        return assetTaggingEngine.searchAssetsByTag(tagName);
      },

      // Import/Export
      exportTags: () => {
        return assetTaggingEngine.exportTags();
      },

      importTags: (data) => {
        try {
          assetTaggingEngine.importTags(data);
          set({ 
            tags: assetTaggingEngine.getAllTags(),
            error: null 
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to import tags' });
        }
      },

      // Utility
      getTagStats: () => {
        const tags = get().tags;
        const exportData = assetTaggingEngine.exportTags();
        
        return {
          totalTags: tags.length,
          totalTaggedAssets: Object.keys(exportData.assetTags).length,
          mostUsedTags: tags.slice(0, 5)
        };
      }
    }),
    {
      name: 'asset-tagging-store',
      partialize: (state) => ({
        tags: state.tags,
        selectedTags: state.selectedTags,
        activeFilter: state.activeFilter
      })
    }
  )
); 