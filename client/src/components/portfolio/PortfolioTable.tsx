import { useState } from 'react';

const LOCAL_STORAGE_KEY = 'customCategories';
function loadCustomCategories() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
const CATEGORY_MAP_KEY = 'assetCategoryMap';
function loadCategoryMap() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(CATEGORY_MAP_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveCategoryMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CATEGORY_MAP_KEY, JSON.stringify(map));
}

const PortfolioTable: React.FC = () => {
  const [customCategories] = useState(loadCustomCategories());
  const [categoryMap, setCategoryMap] = useState(loadCategoryMap());

  const handleCategoryChange = (assetId: string, catKey: string) => {
    const updated = { ...categoryMap, [assetId]: catKey };
    setCategoryMap(updated);
    saveCategoryMap(updated);
  };

  // In table row for each asset:
  // <select value={categoryMap[asset.id] || ''} onChange={e => handleCategoryChange(asset.id, e.target.value)}>
  //   <option value="">Uncategorized</option>
  //   {customCategories.map(cat => (
  //     <option key={cat.key} value={cat.key}>{cat.label}</option>
  //   ))}
  // </select>
}; 