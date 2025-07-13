import React from 'react';

export interface TabSectionProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  children: React.ReactNode;
  className?: string;
}

const TabSection: React.FC<TabSectionProps> = ({ tabs, activeTab, onChange, children, className = '' }) => {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-4 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors
              ${activeTab === tab
                ? 'bg-background border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => onChange(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
};

export default TabSection; 