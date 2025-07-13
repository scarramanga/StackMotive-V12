import React, { useState } from 'react';

interface MultiSelectProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  ariaLabel?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, value, onChange, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  const toggleOption = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div className="relative w-full max-w-xs" tabIndex={0} aria-label={ariaLabel || label} onBlur={() => setOpen(false)}>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <button
        type="button"
        className="w-full border rounded px-2 py-1 text-left bg-white dark:bg-gray-900"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value.length ? value.join(', ') : <span className="text-gray-400">Select...</span>}
      </button>
      {open && (
        <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border rounded shadow mt-1 max-h-60 overflow-auto">
          <input
            type="search"
            className="w-full px-2 py-1 border-b"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search options"
            autoFocus
          />
          <ul role="listbox" aria-multiselectable="true">
            {filtered.map(opt => (
              <li
                key={opt}
                role="option"
                aria-selected={value.includes(opt)}
                className={`px-2 py-1 cursor-pointer ${value.includes(opt) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                onClick={() => toggleOption(opt)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') toggleOption(opt);
                }}
                tabIndex={0}
              >
                <input
                  type="checkbox"
                  checked={value.includes(opt)}
                  readOnly
                  className="mr-2 align-middle"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                {opt}
              </li>
            ))}
            {filtered.length === 0 && <li className="px-2 py-1 text-gray-400">No options</li>}
          </ul>
        </div>
      )}
    </div>
  );
}; 