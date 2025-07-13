import React, { useState } from 'react';
import { useStrategyProfile, STRATEGY_ARCHETYPES, StrategyArchetype } from '../../hooks/useStrategyProfile';

const StrategySelector: React.FC = () => {
  const { selected, setSelectedId, archetypes } = useStrategyProfile();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleApply = (archetype: StrategyArchetype) => {
    // Console only, no real mutation
    // eslint-disable-next-line no-console
    console.log('[Block 40] Apply to Vault:', archetype);
    alert(`Strategy "${archetype.name}" would be applied to Vault (console only).`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Strategy Selector</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {archetypes.map(archetype => {
          const isSelected = selected.id === archetype.id;
          const isPreview = previewId === archetype.id;
          return (
            <div
              key={archetype.id}
              className={`border rounded-lg p-4 flex flex-col items-start shadow-sm transition-all duration-150 cursor-pointer ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-gray-50'} ${isPreview ? 'ring-2 ring-indigo-400' : ''}`}
              onClick={() => setSelectedId(archetype.id)}
              onMouseEnter={() => setPreviewId(archetype.id)}
              onMouseLeave={() => setPreviewId(null)}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{archetype.icon}</span>
                <span className="font-semibold text-lg">{archetype.name}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">{archetype.category}</span>
              </div>
              <div className="text-gray-700 mb-4 text-sm">{archetype.description}</div>
              <button
                className="mt-auto px-3 py-1 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                onClick={e => { e.stopPropagation(); handleApply(archetype); }}
              >
                Apply to Vault
              </button>
              {isPreview && (
                <div className="mt-3 p-3 rounded bg-indigo-50 text-indigo-900 text-xs shadow-inner">
                  <strong>Preview:</strong> {archetype.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StrategySelector; 