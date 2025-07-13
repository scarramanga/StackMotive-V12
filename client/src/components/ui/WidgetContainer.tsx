import React from 'react';

export interface WidgetContainerProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ title, children, actions, className = '' }) => {
  return (
    <div className={`rounded-2xl border border-border bg-white dark:bg-neutral-900 shadow-sm p-4 mb-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {actions && <div>{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default WidgetContainer; 