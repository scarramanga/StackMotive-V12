import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: "positive" | "negative" | "neutral";
  };
  subtitle?: string;
  icon?: string;
  iconColor?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  subtitle,
  icon,
  iconColor = "primary",
  className,
}) => {
  const iconColorClasses = {
    primary: "text-primary bg-primary bg-opacity-10",
    success: "text-success bg-success bg-opacity-10",
    warning: "text-warning bg-warning bg-opacity-10",
    danger: "text-danger bg-destructive bg-opacity-10",
    info: "text-info bg-info bg-opacity-10",
  };
  
  const changeColorClasses = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-neutral-500 dark:text-neutral-400",
  };
  
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
            <h3 className="text-2xl font-semibold mt-1">{value}</h3>
            <div className="flex items-center mt-1">
              {change && (
                <>
                  <span className={cn("text-sm flex items-center", changeColorClasses[change.type])}>
                    {change.type === "positive" && <i className="ri-arrow-up-s-fill"></i>}
                    {change.type === "negative" && <i className="ri-arrow-down-s-fill"></i>}
                    {change.value}
                  </span>
                  {subtitle && (
                    <span className="text-neutral-500 dark:text-neutral-400 text-xs ml-2">{subtitle}</span>
                  )}
                </>
              )}
              {!change && subtitle && (
                <span className="text-neutral-500 dark:text-neutral-400 text-xs">{subtitle}</span>
              )}
            </div>
          </div>
          {icon && (
            <div className={cn("p-2 rounded-lg", iconColorClasses[iconColor])}>
              <i className={cn(icon, "text-xl")}></i>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
