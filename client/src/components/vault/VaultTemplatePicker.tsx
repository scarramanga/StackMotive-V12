import React, { useState } from 'react';
import { getAllTemplates, getTemplateById } from '../../hooks/useTemplateLoader';

const CATEGORIES = [
  'All',
  ...Array.from(new Set(getAllTemplates().map(t => t.category)))
];

const VaultTemplatePicker: React.FC = () => {
  const [category, setCategory] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const templates = getAllTemplates().filter(t => category === 'All' || t.category === category);

  const handleApply = (id: string) => {
    // Console only, no mutation
    // eslint-disable-next-line no-console
    console.log('[Block 42] Apply Vault Template:', id);
    alert(`Template "${id}" would be applied to Vault (console only).`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Vault Strategy Templates</h2>
      <div className="flex gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`px-3 py-1 rounded ${category === cat ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <div
            key={t.id}
            className={`border rounded-lg p-4 flex flex-col shadow-sm transition-all duration-150 ${selectedId === t.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}
            onClick={() => setSelectedId(t.id)}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">{t.name}</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{t.category}</span>
            </div>
            <div className="text-gray-700 dark:text-gray-200 mb-2 text-sm">{t.description}</div>
            <ul className="mb-3 text-xs text-gray-600 dark:text-gray-300">
              {t.beliefs.slice(0, 3).map((b, i) => (
                <li key={i} className="mb-1">“{b.text}” <span className="ml-2 text-blue-700 dark:text-blue-300">(Confidence: {b.confidence})</span></li>
              ))}
            </ul>
            <button
              className="mt-auto px-3 py-1 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              onClick={e => { e.stopPropagation(); handleApply(t.id); }}
            >
              Apply to Vault
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VaultTemplatePicker; 