import React from 'react';
import { cn } from '@/lib/utils';

export interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'destructive' | 'info';
  children?: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-white dark:bg-neutral-900',
  success: 'bg-green-50 dark:bg-green-900',
  destructive: 'bg-red-50 dark:bg-red-900',
  info: 'bg-blue-50 dark:bg-blue-900',
};

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  variant = 'default',
  children,
  footer,
  actions,
  className = '',
}) => {
  return (
    <div className={cn(
      'rounded-2xl shadow-sm border border-border p-4 flex flex-col justify-between min-h-[120px] transition-colors',
      variantClasses[variant],
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {children && <div className="mb-2">{children}</div>}
      {footer && <div className="mt-2 text-xs text-muted-foreground">{footer}</div>}
      {actions && <div className="mt-2">{actions}</div>}
    </div>
  );
};

export default SummaryCard; 