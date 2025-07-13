import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface QuickAccessItem {
  id: string;
  title: string;
  icon: string;
  path: string;
}

interface QuickAccessProps {
  items?: QuickAccessItem[];
  className?: string;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({
  items = [],
  className,
}) => {
  // Sample quick access items
  const sampleItems: QuickAccessItem[] = [
    {
      id: "1",
      title: "Technical Analysis",
      icon: "ri-line-chart-line",
      path: "/analysis/technical",
    },
    {
      id: "2",
      title: "Create Strategy",
      icon: "ri-robot-line",
      path: "/strategies/new",
    },
    {
      id: "3",
      title: "Trading Journal",
      icon: "ri-file-list-3-line",
      path: "/journal",
    },
    {
      id: "4",
      title: "Tax Calculator",
      icon: "ri-calculator-line",
      path: "/tax-calculator",
    },
  ];
  
  const displayItems = items.length ? items : sampleItems;
  
  return (
    <Card className={className}>
      <CardHeader className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <CardTitle className="font-semibold">Quick Access</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {displayItems.map((item) => (
            <Link key={item.id} href={item.path}>
              <a className="p-3 bg-neutral-50 dark:bg-neutral-750 rounded-lg text-center hover:bg-neutral-100 dark:hover:bg-neutral-700">
                <i className={cn(item.icon, "text-2xl text-primary mb-1")}></i>
                <div className="text-sm font-medium">{item.title}</div>
              </a>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAccess;
