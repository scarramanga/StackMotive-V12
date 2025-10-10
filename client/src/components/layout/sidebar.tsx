// [Full updated file — 100% identical to your latest version, except for the fallback removed]

import React, { useState, useEffect } from "react";
import { NavLink } from 'react-router-dom';
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSessionStore } from '../../store/session';
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronDown,
  ChevronRight,
  Home,
  LineChart,
  Bot,
  Zap,
  Calendar,
  BarChart,
  PieChart,
  TrendingUp,
  Newspaper,
  FileText,
  List,
  Calculator,
  BookOpen,
  Landmark,
  Eye,
  Shield,
  Users
} from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BarChart3, Settings, Building } from "lucide-react";
import navConfig, { iconMap } from "@/components/layout/navConfig";

interface SidebarProps {
  collapsed?: boolean;
}

// Type for portfolio data
type CombinedPortfolio = {
  equities: Array<{ Value: number, [key: string]: any }>;
  crypto: Array<{ Value: number, [key: string]: any }>;
};

// Use the proper interface from the hook
import { type PaperTradingAccount } from '@/hooks/use-paper-trading';

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const [location, navigate] = useLocation();
  const user = useSessionStore(s => s.user);
  const logout = useSessionStore(s => s.clearSession);
  
  const { data: paperTradingAccount, isLoading: isLoadingPaperAccount } = useQuery<PaperTradingAccount>({
    queryKey: ['/api/user/paper-trading-account'],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // 🔍 Log sidebar portfolio data for debugging
  React.useEffect(() => {
    if (paperTradingAccount && user?.email === 'test15@stackmotiveapp.com') {
      console.log("🔍 SIDEBAR: Portfolio data received:", {
        id: paperTradingAccount.id,
        totalPortfolioValue: paperTradingAccount.totalPortfolioValue,
        cashBalance: paperTradingAccount.cashBalance,
        totalHoldingsValue: paperTradingAccount.totalHoldingsValue,
        totalProfitLoss: paperTradingAccount.totalProfitLoss,
        currentBalance: paperTradingAccount.currentBalance,
        initialBalance: paperTradingAccount.initialBalance
      });
    }
  }, [paperTradingAccount, user?.email]);
  
  const hasPaperTradingAccount = paperTradingAccount && !isLoadingPaperAccount;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Persistent section state
  const initializeSectionState = () => {
    const savedState = localStorage.getItem('sidebar-dropdown-state');
    const defaultExpanded: Record<string, boolean> = {};
    navConfig.sections.forEach(section => {
      defaultExpanded[section.title] = true;
    });
    return savedState ? { ...defaultExpanded, ...JSON.parse(savedState) } : defaultExpanded;
  };
  const [sectionExpandedState, setSectionExpandedState] = useState<Record<string, boolean>>(initializeSectionState);

  useEffect(() => {
    setSectionExpandedState(prev => {
      const newState: Record<string, boolean> = {};
      navConfig.sections.forEach(section => {
        newState[section.title] = prev[section.title] ?? true;
      });
      return newState;
    });
  }, [navConfig.sections]);

  const toggleSection = (sectionTitle: string) => {
    if (collapsed) return;
    const newState = {
      ...sectionExpandedState,
      [sectionTitle]: !sectionExpandedState[sectionTitle]
    };
    setSectionExpandedState(newState);
    localStorage.setItem('sidebar-dropdown-state', JSON.stringify(newState));
  };
  
  interface NavigationItem {
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: string;
  }

  const navigationItems: Array<{
    title: string;
    icon: React.ReactNode;
    items: NavigationItem[];
  }> = [
    {
      title: "Trading",
      icon: <LineChart size={collapsed ? 20 : 16} />,
      items: [
        { label: "Paper Trading Dashboard", icon: <Home size={collapsed ? 20 : 16} />, path: "/paper-trading/dashboard" },
        { label: "Trading", icon: <LineChart size={collapsed ? 20 : 16} />, path: "/trading/trade" },
        { label: "Browse Strategies", icon: <Bot size={collapsed ? 20 : 16} />, path: "/trading/strategies" },
        { label: "AI Strategy Builder", icon: <Zap size={collapsed ? 20 : 16} />, path: "/trading/ai-strategy-builder", badge: "New" },
        { label: "Scheduled Trades", icon: <Calendar size={collapsed ? 20 : 16} />, path: "/scheduled-trades" },
      ]
    },
    {
      title: "Analysis",
      icon: <BarChart size={collapsed ? 20 : 16} />,
      items: [
        { label: "Technical Analysis", icon: <BarChart size={collapsed ? 20 : 16} />, path: "/analysis/technical" },
        { label: "Portfolio Analytics", icon: <PieChart size={collapsed ? 20 : 16} />, path: "/analytics" },
        { label: "Market Sentiment", icon: <TrendingUp size={collapsed ? 20 : 16} />, path: "/analysis/sentiment" },
        { label: "Whale Tracking", icon: <Eye size={collapsed ? 20 : 16} />, path: "/whale-tracking" },
      ]
    },
    {
      title: "Reporting",
      icon: <FileText size={collapsed ? 20 : 16} />,
      items: [
        { label: "Reports Center", icon: <FileText size={collapsed ? 20 : 16} />, path: "/reports" },
        { label: "Custom Reports", icon: <List size={collapsed ? 20 : 16} />, path: "/reports/custom" },
        { label: "Tax Documents", icon: <Calculator size={collapsed ? 20 : 16} />, path: "/tax-calculator" },
      ]
    },
    {
      title: "Utilities",
      icon: <Landmark size={collapsed ? 20 : 16} />,
      items: [
        { label: "Trading Journal", icon: <BookOpen size={collapsed ? 20 : 16} />, path: "/journal" },
        { label: "News & Events", icon: <Newspaper size={collapsed ? 20 : 16} />, path: "/news" },
      ]
    }
  ];
  
  const isAdmin = user?.isAdmin || user?.email?.endsWith('@stackmotive.dev');
  
  const adminNavigationItems: Array<{
    title: string;
    icon: React.ReactNode;
    items: NavigationItem[];
  }> = isAdmin ? [
    {
      title: "Administration",
      icon: <Shield size={collapsed ? 20 : 16} />,
      items: [
        { label: "User Management", icon: <Users size={collapsed ? 20 : 16} />, path: "/admin-testers" },
        { label: "Account Management", icon: <FileText size={collapsed ? 20 : 16} />, path: "/account-management" },
        { label: "Advanced Analytics", icon: <BarChart size={collapsed ? 20 : 16} />, path: "/advanced-analytics" },
      ]
    }
  ] : [];
  
  const allNavigationItems = [...navigationItems, ...adminNavigationItems];
  
  const subNavigation: Record<string, NavigationItem[]> = {
    "/trading": [
      { label: "Spot Trading", icon: <LineChart size={16} />, path: "/trading/spot" },
      { label: "Futures Trading", icon: <LineChart size={16} />, path: "/trading/futures" },
      { label: "Options Trading", icon: <LineChart size={16} />, path: "/trading/options" },
    ],
    "/strategies": [
      { label: "My Strategies", icon: <Bot size={16} />, path: "/strategies/my-strategies" },
      { label: "Market Strategies", icon: <Bot size={16} />, path: "/strategies/market" },
      { label: "Create Strategy", icon: <Bot size={16} />, path: "/strategies/create" },
    ],
    "/analysis/technical": [
      { label: "Pattern Recognition", icon: <BarChart size={16} />, path: "/analysis/technical/patterns" },
      { label: "Indicator Builder", icon: <BarChart size={16} />, path: "/analysis/technical/indicators" },
    ],
    "/reports": [
      { label: "Performance Report", icon: <FileText size={16} />, path: "/reports/performance" },
      { label: "Monthly Statement", icon: <FileText size={16} />, path: "/reports/monthly" },
      { label: "Tax Reports", icon: <FileText size={16} />, path: "/reports/tax" },
    ],
  };
  
  const isActive = (path: string) => {
    if (path === '/') return location === path;
    return location === path || location.startsWith(`${path}/`);
  };
  
  const isInSection = (section: { items: { path: string }[] }) => {
    return section.items.some(item => isActive(item.path));
  };
  
  const findCurrentMainPath = () => {
    for (const section of navigationItems) {
      for (const item of section.items) {
        if (isActive(item.path)) return item.path;
      }
    }
    return null;
  };
  
  const currentMainPath = findCurrentMainPath();
  
  const getSubNavItems = (mainPath: string | null) => {
    if (!mainPath) return null;
    return subNavigation[mainPath as keyof typeof subNavigation] || null;
  };
  
  const currentSubNavItems = getSubNavItems(currentMainPath);
  
  return (
    <aside className={cn(
      "hidden sm:flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-200 z-40",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <NavLink to="/paper-trading/dashboard" className="flex items-center">
          {collapsed ? (
            <img src="/logo-icon.svg" alt="StackMotive" className="h-8 w-8" />
          ) : (
            <img src="/logo.svg" alt="StackMotive" className="h-8" />
          )}
        </NavLink>
      </div>

      {!collapsed && hasPaperTradingAccount && paperTradingAccount && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Paper Trading Account</div>
              <div className="text-sm font-medium flex items-center mt-1">
                <span className="text-success mr-1">●</span> {paperTradingAccount?.name}
              </div>
            </div>
            <NavLink to="/account-management">
              <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
                <Eye className="h-4 w-4" />
              </Button>
            </NavLink>
          </div>
          <div className="mt-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Portfolio Value</div>
            <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {paperTradingAccount?.totalPortfolioValue ? `$${Number(paperTradingAccount.totalPortfolioValue).toLocaleString()}` : '$0.00'}
            </div>
            <div className="flex justify-between items-center mt-2">
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Change</div>
                <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {paperTradingAccount?.totalProfitLoss ? `$${Number(paperTradingAccount.totalProfitLoss).toLocaleString()}` : '$0.00'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Holdings</div>
                <div className="text-sm font-medium">
                  {paperTradingAccount?.totalHoldingsValue ? `$${Number(paperTradingAccount.totalHoldingsValue).toLocaleString()}` : '$0.00'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Section with Overflow Fix */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {navConfig.sections.map((section, sectionIndex) => {
          const sectionActive = isInSection(section);
          const SectionIcon = iconMap[section.icon] || null;
          return (
            <div key={section.title} className="mb-2">
              <Collapsible 
                open={sectionExpandedState[section.title]} 
                onOpenChange={() => toggleSection(section.title)}
              >
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "w-full flex items-center justify-between p-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      sectionActive && "bg-neutral-100 dark:bg-neutral-800"
                    )}
                    data-cy={`sidebar-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center">
                      {SectionIcon}
                      {!collapsed && <span className="ml-3 text-sm font-medium">{section.title}</span>}
                    </div>
                    {!collapsed && (
                      sectionExpandedState[section.title] ? 
                        <ChevronDown size={16} /> : 
                        <ChevronRight size={16} />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                {!collapsed && (
                  <CollapsibleContent className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const ItemIcon = iconMap[item.icon] || null;
                      return (
                        <NavLink 
                          key={item.path} 
                          to={item.path}
                          className={cn(
                            "flex items-center justify-between px-6 py-2 text-sm rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
                            isActive(item.path) && "bg-blue-50 text-blue-700 border-r-2 border-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-500"
                          )}
                          data-cy={`sidebar-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <div className="flex items-center">
                            {ItemIcon}
                            <span className="ml-3">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </CollapsibleContent>
                )}
              </Collapsible>
            </div>
          );
        })}
      </nav>

      {/* Sub-navigation for current path */}
      {!collapsed && currentSubNavItems && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Quick Actions</div>
          <div className="space-y-1">
            {currentSubNavItems.map((subItem) => (
              <NavLink 
                key={subItem.path} 
                to={subItem.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  isActive(subItem.path) && "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                )}
              >
                {subItem.icon}
                <span className="ml-2">{subItem.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

