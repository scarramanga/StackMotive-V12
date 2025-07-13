// Block 30: Asset Tagging System - Types
export interface AssetTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
  usageCount: number;
}

export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
  value: number;
  allocation: number;
}

export interface TaggedAsset extends Asset {
  tags: AssetTag[];
}

export type AssetType = 'equity' | 'crypto' | 'cash' | 'bond' | 'commodity' | 'real_estate' | 'alternative';

export interface TagFilter {
  includeTags: string[];
  excludeTags: string[];
  operator: 'AND' | 'OR';
}

export interface TagStats {
  totalTags: number;
  totalTaggedAssets: number;
  mostUsedTags: AssetTag[];
  untaggedAssets: string[];
}

export interface AssetTaggingState {
  tags: AssetTag[];
  assetTags: Map<string, Set<string>>;
  selectedTags: string[];
  isLoading: boolean;
  error: string | null;
}

export interface AssetTaggingActions {
  createTag: (name: string, color: string, description?: string) => AssetTag;
  deleteTag: (tagId: string) => boolean;
  tagAsset: (assetSymbol: string, tagIds: string[]) => void;
  untagAsset: (assetSymbol: string, tagIds: string[]) => void;
  getAssetTags: (assetSymbol: string) => AssetTag[];
  getAssetsWithTag: (tagId: string) => string[];
  searchAssetsByTag: (tagName: string) => string[];
  setSelectedTags: (tagIds: string[]) => void;
  exportTags: () => { tags: AssetTag[], assetTags: Record<string, string[]> };
  importTags: (data: { tags: AssetTag[], assetTags: Record<string, string[]> }) => void;
} 