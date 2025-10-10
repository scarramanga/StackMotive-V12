import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  'data-testid'?: string;
}

export function KPICard({ label, value, subtext, 'data-testid': testId }: KPICardProps) {
  return (
    <Card data-testid={testId} className="border shadow-sm">
      <CardContent className="p-6">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {label}
        </div>
        <div className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">
          {value}
        </div>
        {subtext && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {subtext}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

