import React, { useState } from 'react';

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  ariaLabel?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onAdd, onRemove, ariaLabel }) => {
  const [input, setInput] = useState('');
  const handleAdd = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag)) {
      onAdd(tag);
      setInput('');
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={ariaLabel || 'Tags'}>
      {tags.map(tag => (
        <span key={tag} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded px-2 py-0.5 text-xs flex items-center">
          {tag}
          <button
            type="button"
            className="ml-1 text-xs text-red-500 hover:text-red-700 focus:outline-none"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onRemove(tag)}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        className="border rounded px-1 py-0.5 text-xs w-20"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        placeholder="Add tag"
        aria-label="Add tag"
      />
      <button
        type="button"
        className="ml-1 px-2 py-0.5 text-xs bg-blue-500 text-white rounded"
        onClick={handleAdd}
        aria-label="Add tag button"
      >+
      </button>
    </div>
  );
}; 