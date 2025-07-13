import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className, 
  size = "md", 
  withText = true 
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };
  
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn(
        "rounded-md relative overflow-hidden bg-gradient-primary flex items-center justify-center",
        sizeClasses[size]
      )}>
        <i className="ri-line-chart-line text-white text-xl"></i>
      </div>
      
      {withText && (
        <span className={cn(
          "ml-2 font-semibold font-poppins text-gradient-primary",
          textSizeClasses[size]
        )}>
          StackMotive
        </span>
      )}
    </div>
  );
};

export default Logo;
