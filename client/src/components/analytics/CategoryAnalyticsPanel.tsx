// Block 73: Category Analytics Panel
import React from 'react';
import { useDashboardData } from '../../hooks/use-dashboard-data';

const LOCAL_STORAGE_KEY = 'customCategories';
function loadCustomCategories() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

const CategoryAnalyticsPanel: React.FC = () => {
  const { data } = useDashboardData();
  const customCategories = loadCustomCategories();
  if (!data) return null;
  // Aggregate holdings by category
  const catSums: Record<string, number> = {};
  let total = 0;
  data.holdings.forEach(h => {
    const cat = customCategories.find(c => c.key === h.category) ? h.category : 'other';
    catSums[cat] = (catSums[cat] || 0) + h.totalValue;
    total += h.totalValue;
  });
  return (
    <section className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg mt-8">
      <h2 className="text-xl font-bold mb-4">Category Analytics</h2>
      <table className="min-w-full text-sm border rounded">
        <thead>
          <tr>
            <th className="text-left">Category</th>
            <th className="text-left">Total Value</th>
            <th className="text-left">% of Portfolio</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(catSums).map(([cat, value]) => (
            <tr key={cat}>
              <td>{cat}</td>
              <td>${value.toLocaleString()}</td>
              <td>{total > 0 ? ((value / total) * 100).toFixed(2) : '0.00'}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default CategoryAnalyticsPanel; 