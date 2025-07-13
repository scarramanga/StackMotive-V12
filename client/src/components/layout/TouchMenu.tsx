import React, { useEffect } from 'react';
import { iconMap } from './navConfig';
import navConfig from './navConfig';

interface TouchMenuProps {
  onClose: () => void;
}

const TouchMenu: React.FC<TouchMenuProps> = ({ onClose }) => {
  // Block 11 Implementation: Prevent background scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-neutral-900 overflow-y-auto block sm:hidden">
      <div className="py-4 px-6 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-900 z-[101]">
        <h2 className="text-lg font-semibold">StackMotive</h2>
        <button 
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div className="py-2">
        {navConfig.sections.map(section => (
          <div key={section.title}>
            <div className="py-2 px-6 bg-neutral-100 dark:bg-neutral-800 font-semibold text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              {section.title}
            </div>
            {section.items.map(item => {
              const Icon = iconMap[item.icon as keyof typeof iconMap] || null;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className="block no-underline"
                  onClick={onClose}
                >
                  <div className="flex items-center w-full py-4 px-6 min-h-[64px] border-b border-neutral-200 dark:border-neutral-700 active:bg-neutral-100 dark:active:bg-neutral-700">
                    <div className="text-primary mr-4 flex-shrink-0">
                      {Icon && <Icon size={24} />}
                    </div>
                    <span className="text-base font-medium text-neutral-800 dark:text-neutral-200">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-auto bg-primary text-white text-xs px-2 py-1 rounded flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                    <svg className="ml-auto h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TouchMenu; 