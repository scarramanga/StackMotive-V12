import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal, Home } from "lucide-react"

import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  href: string;
  label: string;
  active?: boolean;
}

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
    items?: BreadcrumbItem[]
  }
>(({ separator, items, ...props }, ref) => (
  <nav
    ref={ref}
    aria-label="breadcrumb"
    className="flex items-center text-sm"
    {...props}
  >
    {items && items.length > 0 && (
      <ol className="flex flex-wrap items-center gap-1.5 break-words sm:gap-2.5">
        {items.map((item, index) => (
          <React.Fragment key={item.href}>
            <li className="inline-flex items-center gap-1.5">
              {index === 0 && <Home className="h-3.5 w-3.5 mr-1" />}
              {item.active ? (
                <span 
                  role="link"
                  aria-disabled="true"
                  aria-current="page"
                  className="text-foreground font-medium"
                >
                  {item.label}
                </span>
              ) : (
                <a 
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              )}
            </li>
            {index < items.length - 1 && (
              <li
                role="presentation"
                aria-hidden="true"
                className="text-muted-foreground"
              >
                {separator ?? <ChevronRight className="h-3.5 w-3.5" />}
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    )}
    {!items && props.children}
  </nav>
))
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("text-foreground font-medium", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("text-muted-foreground", className)}
    {...props}
  >
    {children ?? <ChevronRight className="h-3.5 w-3.5" />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

// Helper function to generate breadcrumbs based on the current path
export const getBreadcrumbs = (path: string, customLabels?: Record<string, string>): BreadcrumbItem[] => {
  if (!path || path === '/') {
    return [{
      href: '/',
      label: 'Home',
      active: true
    }];
  }

  const segments = path.split('/').filter(Boolean);
  let currentPath = '';
  
  const breadcrumbs: BreadcrumbItem[] = [
    {
      href: '/',
      label: 'Home',
    }
  ];

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    // Use custom label if provided
    if (customLabels && customLabels[currentPath]) {
      label = customLabels[currentPath];
    }

    breadcrumbs.push({
      href: currentPath,
      label,
      active: isLast
    });
  });

  return breadcrumbs;
};

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}