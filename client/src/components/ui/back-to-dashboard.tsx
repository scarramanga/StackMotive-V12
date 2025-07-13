import React from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackToDashboardProps {
  path?: string;
  label?: string;
  className?: string;
}

export const BackToDashboard: React.FC<BackToDashboardProps> = ({ 
  path = '/paper-trading/dashboard', 
  label = '← Back to Dashboard',
  className = '' 
}) => {
  const [_, navigate] = useLocation();

  return (
    <Button
      variant="ghost"
      onClick={() => navigate(path)}
      className={`hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      <ChevronLeft className="w-4 h-4 mr-1" />
      {label}
    </Button>
  );
}; 