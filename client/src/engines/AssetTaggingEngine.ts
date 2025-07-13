// Block 30: Asset Tagging System - Engine
import { AssetTag, Asset, TaggedAsset } from '../types/assetTagging';

export class AssetTaggingEngine {
  private tags: Map<string, AssetTag> = new Map();
  private assetTags: Map<string, Set<string>> = new Map();

  /**
   * Create a new custom tag
   */
  createTag(name: string, color: string, description?: string): AssetTag {
    const tag: AssetTag = {
      id: this.generateTagId(),
      name,
      color,
      description,
      createdAt: new Date(),
      usageCount: 0
    };
    
    this.tags.set(tag.id, tag);
    return tag;
  }

  /**
   * Get all available tags
   */
  getAllTags(): AssetTag[] {
    return Array.from(this.tags.values())
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Apply tags to an asset
   */
  tagAsset(assetSymbol: string, tagIds: string[]): void {
    if (!this.assetTags.has(assetSymbol)) {
      this.assetTags.set(assetSymbol, new Set());
    }
    
    const assetTagSet = this.assetTags.get(assetSymbol)!;
    
    // Add new tags
    tagIds.forEach(tagId => {
      if (this.tags.has(tagId)) {
        assetTagSet.add(tagId);
        // Increment usage count
        const tag = this.tags.get(tagId)!;
        tag.usageCount++;
      }
    });
  }

  /**
   * Remove tags from an asset
   */
  untagAsset(assetSymbol: string, tagIds: string[]): void {
    const assetTagSet = this.assetTags.get(assetSymbol);
    if (!assetTagSet) return;

    tagIds.forEach(tagId => {
      if (assetTagSet.has(tagId)) {
        assetTagSet.delete(tagId);
        // Decrement usage count
        const tag = this.tags.get(tagId);
        if (tag && tag.usageCount > 0) {
          tag.usageCount--;
        }
      }
    });
  }

  /**
   * Get tags for a specific asset
   */
  getAssetTags(assetSymbol: string): AssetTag[] {
    const tagIds = this.assetTags.get(assetSymbol);
    if (!tagIds) return [];
    
    return Array.from(tagIds)
      .map(id => this.tags.get(id))
      .filter(tag => tag !== undefined) as AssetTag[];
  }

  /**
   * Get all assets with a specific tag
   */
  getAssetsWithTag(tagId: string): string[] {
    const assets: string[] = [];
    
    this.assetTags.forEach((tagSet, assetSymbol) => {
      if (tagSet.has(tagId)) {
        assets.push(assetSymbol);
      }
    });
    
    return assets;
  }

  /**
   * Search assets by tag name
   */
  searchAssetsByTag(tagName: string): string[] {
    const matchingTags = Array.from(this.tags.values())
      .filter(tag => tag.name.toLowerCase().includes(tagName.toLowerCase()));
    
    const assets = new Set<string>();
    matchingTags.forEach(tag => {
      this.getAssetsWithTag(tag.id).forEach(asset => assets.add(asset));
    });
    
    return Array.from(assets);
  }

  /**
   * Delete a tag (removes from all assets)
   */
  deleteTag(tagId: string): boolean {
    const tag = this.tags.get(tagId);
    if (!tag) return false;

    // Remove from all assets
    this.assetTags.forEach((tagSet) => {
      tagSet.delete(tagId);
    });

    // Remove the tag itself
    this.tags.delete(tagId);
    return true;
  }

  /**
   * Get tag suggestions based on asset type/category
   */
  getTagSuggestions(assetSymbol: string): string[] {
    const suggestions: string[] = [];
    
    // Basic suggestions based on asset symbol patterns
    if (assetSymbol.includes('BTC') || assetSymbol.includes('ETH')) {
      suggestions.push('Crypto', 'Digital Asset', 'Store of Value');
    }
    
    if (assetSymbol.includes('USD') || assetSymbol.includes('CASH')) {
      suggestions.push('Cash', 'Fiat', 'Liquidity');
    }
    
    if (assetSymbol.includes('GOLD') || assetSymbol.includes('GLD')) {
      suggestions.push('Precious Metals', 'Real Asset', 'Inflation Hedge');
    }
    
    return suggestions;
  }

  /**
   * Export tags configuration
   */
  exportTags(): { tags: AssetTag[], assetTags: Record<string, string[]> } {
    const assetTagsRecord: Record<string, string[]> = {};
    
    this.assetTags.forEach((tagSet, assetSymbol) => {
      assetTagsRecord[assetSymbol] = Array.from(tagSet);
    });
    
    return {
      tags: this.getAllTags(),
      assetTags: assetTagsRecord
    };
  }

  /**
   * Import tags configuration
   */
  importTags(data: { tags: AssetTag[], assetTags: Record<string, string[]> }): void {
    // Clear existing
    this.tags.clear();
    this.assetTags.clear();
    
    // Import tags
    data.tags.forEach(tag => {
      this.tags.set(tag.id, tag);
    });
    
    // Import asset tags
    Object.entries(data.assetTags).forEach(([assetSymbol, tagIds]) => {
      this.assetTags.set(assetSymbol, new Set(tagIds));
    });
  }

  private generateTagId(): string {
    return `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const assetTaggingEngine = new AssetTaggingEngine(); 