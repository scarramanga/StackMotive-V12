// Block 30: Asset Tagging System - Hook
import { useState, useEffect, useCallback } from 'react';
import { AssetTag, AssetTaggingState, TagStats } from '../types/assetTagging';
import { assetTaggingEngine } from '../engines/AssetTaggingEngine';

export function useAssetTagging() {
  const [state, setState] = useState<AssetTaggingState>({
    tags: [],
    assetTags: new Map(),
    selectedTags: [],
    isLoading: false,
    error: null
  });

  // Initialize tags
  useEffect(() => {
    setState(prev => ({
      ...prev,
      tags: assetTaggingEngine.getAllTags()
    }));
  }, []);

  // Create new tag
  const createTag = useCallback((name: string, color: string, description?: string) => {
    try {
      const newTag = assetTaggingEngine.createTag(name, color, description);
      setState(prev => ({
        ...prev,
        tags: assetTaggingEngine.getAllTags(),
        error: null
      }));
      return newTag;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create tag'
      }));
      throw error;
    }
  }, []);

  // Delete tag
  const deleteTag = useCallback((tagId: string) => {
    try {
      const success = assetTaggingEngine.deleteTag(tagId);
      if (success) {
        setState(prev => ({
          ...prev,
          tags: assetTaggingEngine.getAllTags(),
          selectedTags: prev.selectedTags.filter(id => id !== tagId),
          error: null
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete tag'
      }));
      return false;
    }
  }, []);

  // Tag an asset
  const tagAsset = useCallback((assetSymbol: string, tagIds: string[]) => {
    try {
      assetTaggingEngine.tagAsset(assetSymbol, tagIds);
      setState(prev => ({
        ...prev,
        tags: assetTaggingEngine.getAllTags(), // Refresh to update usage counts
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to tag asset'
      }));
    }
  }, []);

  // Untag an asset
  const untagAsset = useCallback((assetSymbol: string, tagIds: string[]) => {
    try {
      assetTaggingEngine.untagAsset(assetSymbol, tagIds);
      setState(prev => ({
        ...prev,
        tags: assetTaggingEngine.getAllTags(), // Refresh to update usage counts
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to untag asset'
      }));
    }
  }, []);

  // Get tags for an asset
  const getAssetTags = useCallback((assetSymbol: string) => {
    return assetTaggingEngine.getAssetTags(assetSymbol);
  }, []);

  // Get assets with a specific tag
  const getAssetsWithTag = useCallback((tagId: string) => {
    return assetTaggingEngine.getAssetsWithTag(tagId);
  }, []);

  // Search assets by tag name
  const searchAssetsByTag = useCallback((tagName: string) => {
    return assetTaggingEngine.searchAssetsByTag(tagName);
  }, []);

  // Set selected tags for filtering
  const setSelectedTags = useCallback((tagIds: string[]) => {
    setState(prev => ({
      ...prev,
      selectedTags: tagIds
    }));
  }, []);

  // Get tag suggestions for an asset
  const getTagSuggestions = useCallback((assetSymbol: string) => {
    return assetTaggingEngine.getTagSuggestions(assetSymbol);
  }, []);

  // Export tags
  const exportTags = useCallback(() => {
    return assetTaggingEngine.exportTags();
  }, []);

  // Import tags
  const importTags = useCallback((data: { tags: AssetTag[], assetTags: Record<string, string[]> }) => {
    try {
      assetTaggingEngine.importTags(data);
      setState(prev => ({
        ...prev,
        tags: assetTaggingEngine.getAllTags(),
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to import tags'
      }));
    }
  }, []);

  // Get tagging statistics
  const getTagStats = useCallback((): TagStats => {
    const tags = assetTaggingEngine.getAllTags();
    const exportData = assetTaggingEngine.exportTags();
    
    return {
      totalTags: tags.length,
      totalTaggedAssets: Object.keys(exportData.assetTags).length,
      mostUsedTags: tags.slice(0, 5), // Top 5 most used
      untaggedAssets: [] // Would need asset list to calculate
    };
  }, []);

  return {
    // State
    tags: state.tags,
    selectedTags: state.selectedTags,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    createTag,
    deleteTag,
    tagAsset,
    untagAsset,
    getAssetTags,
    getAssetsWithTag,
    searchAssetsByTag,
    setSelectedTags,
    getTagSuggestions,
    exportTags,
    importTags,
    getTagStats
  };
} 