import React from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const BackLink: React.FC<BackLinkProps> = ({ href, children, className }) => {
  const [, navigate] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-4",
        className
      )}
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      {children}
    </button>
  );
}; 