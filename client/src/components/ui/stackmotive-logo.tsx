import React from "react";
import { cn } from "@/lib/utils";

interface StackMotiveLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  isDark?: boolean;
}

export const StackMotiveLogo: React.FC<StackMotiveLogoProps> = ({
  className,
  size = "md",
  variant = "full",
  isDark = false,
}) => {
  const sizeClasses = {
    sm: { icon: "w-8 h-8", text: "text-lg" },
    md: { icon: "w-10 h-10", text: "text-xl" },
    lg: { icon: "w-12 h-12", text: "text-2xl" },
    xl: { icon: "w-16 h-16", text: "text-3xl" },
  };

  return (
    <div className={cn("flex items-center", className)}>
      {/* Logo icon with blue-green gradient */}
      <div className={cn(
        "rounded-md relative overflow-hidden bg-gradient-primary flex items-center justify-center",
        sizeClasses[size].icon
      )}>
        {/* Chart icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-2/3 h-2/3 text-white"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      </div>

      {/* Text logo */}
      {variant === "full" && (
        <span className={cn(
          "ml-2 font-semibold font-poppins text-gradient-primary",
          sizeClasses[size].text
        )}>
          StackMotive
        </span>
      )}
    </div>
  );
};

export default StackMotiveLogo;
