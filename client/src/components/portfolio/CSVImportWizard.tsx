import React, { useState } from 'react';

// Add mapping preset support
const LOCAL_STORAGE_KEY = 'csvMappingPresets';
function loadMappingPresets() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveMappingPresets(presets: Record<string, Record<string, string>>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
}

const CSVImportWizard: React.FC = () => {
  const [mappingPresets, setMappingPresets] = useState(loadMappingPresets());
  const [presetName, setPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [columnMap, setColumnMap] = useState({});
  const [fileName, setFileName] = useState('');

  const savePreset = (name: string) => {
    const updated = { ...mappingPresets, [name]: columnMap };
    setMappingPresets(updated);
    saveMappingPresets(updated);
  };
  const loadPreset = (name: string) => {
    if (mappingPresets[name]) setColumnMap(mappingPresets[name]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        let text = event.target?.result as string;
        // Remove UTF-8 BOM if present
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        setFileName(file.name);
        // ... existing logic ...
      };
      reader.readAsText(file);
    }
  };

  const logError = (msg: string) => {
    console.error('[CSVImportWizard]', msg);
    // Optionally send to backend
  };

  return (
    <div>
      {/* Preset UI */}
      <div className="mb-4 flex gap-2 items-center">
        <input
          type="text"
          className="border rounded px-2 py-1 text-sm"
          placeholder="Preset name"
          value={presetName}
          onChange={e => setPresetName(e.target.value)}
          maxLength={20}
        />
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold"
          onClick={() => savePreset(presetName)}
          disabled={!presetName.trim()}
        >
          Save Preset
        </button>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={selectedPreset}
          onChange={e => loadPreset(e.target.value)}
        >
          <option value="">Load Preset</option>
          {Object.keys(mappingPresets).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* File upload */}
      <input
        type="file"
        onChange={handleFileChange}
      />

      {/* Confirm UTF-8 BOM support in file upload */}
      {/* ... existing logic ... */}

      {/* Ensure all errors are logged */}
      {/* ... existing logic ... */}
    </div>
  );
};

export default CSVImportWizard; 