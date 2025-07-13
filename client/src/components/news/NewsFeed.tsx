import React, { useState } from 'react';
import { useNewsFeed } from '../../hooks/useNewsFeedAPI';

const NewsFeed: React.FC = () => {
  const { newsItems, filterNews } = useNewsFeed();
  const [asset, setAsset] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Unique assets/categories for dropdowns
  const allAssets = Array.from(new Set(newsItems.map(n => n.asset)));
  const allCategories = Array.from(new Set(newsItems.map(n => n.category)));

  function handleFilter() {
    filterNews({
      asset: asset || undefined,
      category: category || undefined,
      dateRange: dateFrom && dateTo ? [dateFrom, dateTo] : undefined,
    });
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">News Feed</h2>
      <div className="flex flex-wrap gap-3 mb-2">
        <div>
          <label className="block text-xs font-medium mb-1">Asset</label>
          <select className="border rounded px-2 py-1" value={asset} onChange={e => setAsset(e.target.value)}>
            <option value="">All</option>
            {allAssets.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Category</label>
          <select className="border rounded px-2 py-1" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">From</label>
          <input type="date" className="border rounded px-2 py-1" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">To</label>
          <input type="date" className="border rounded px-2 py-1" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button
          className="self-end px-3 py-1 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          onClick={() => { handleFilter(); }}
        >
          Filter
        </button>
      </div>
      <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
        {newsItems.length === 0 && <div className="text-gray-400 text-center py-8">No news found for filter.</div>}
        {newsItems.map(item => (
          <div key={item.id} className="rounded-lg shadow p-4 bg-gray-50 dark:bg-gray-800 flex flex-col gap-2">
            <div className="flex gap-2 items-center mb-1">
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">{item.headline}</span>
              <span className="ml-auto px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">{item.asset}</span>
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">{item.category}</span>
            </div>
            <div className="text-gray-700 dark:text-gray-200 text-sm">{item.summary}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(item.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed; 