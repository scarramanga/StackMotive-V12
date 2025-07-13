import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  fullscreen?: boolean;
  message?: string;
  className?: string;
}

export function Loading({ fullscreen = false, message = 'Loading StackMotive...', className }: LoadingProps) {
  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4',
      fullscreen ? 'h-screen' : 'h-full',
      className
    )}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-xl text-muted-foreground">{message}</p>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-background">
        {content}
      </div>
    );
  }

  return content;
} 