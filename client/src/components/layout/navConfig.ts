import {
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
  Users,
  Receipt,
  Globe,
  Sliders
} from "lucide-react";
import { AppRoute, getAppRoutes } from '../../routes/appRoutes';

export const iconMap = {
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
  Users,
  Receipt,
  Globe,
  Sliders
};

export interface NavItem {
  label: string;
  path: string;
  requiresAuth?: boolean;
  requiresVault?: boolean;
}

export function getNavConfig(session: any, activeVaultId: string | null): NavItem[] {
  const routes = getAppRoutes(session, activeVaultId);
  return routes.map(r => ({
    label: r.label,
    path: r.path,
    requiresAuth: r.requiresAuth,
    requiresVault: r.requiresVault,
  }));
}

const navConfig = {
  sections: [
    {
      title: "Trading",
      icon: "LineChart",
      items: [
        { label: "Paper Trading Dashboard", icon: "Home", path: "/paper-trading/dashboard" },
        { label: "Trading", icon: "LineChart", path: "/trading/trade" },
        { label: "Browse Strategies", icon: "Bot", path: "/trading/strategies" },
        { label: "AI Strategy Builder", icon: "Zap", path: "/trading/ai-strategy-builder", badge: "New" },
        { label: "Scheduled Trades", icon: "Calendar", path: "/scheduled-trades" },
      ]
    },
    {
      title: "Analysis",
      icon: "BarChart",
      items: [
        { label: "Technical Analysis", icon: "BarChart", path: "/analysis/technical" },
        { label: "Portfolio Analytics", icon: "PieChart", path: "/analysis/portfolio" },
        { label: "Market Sentiment", icon: "TrendingUp", path: "/analysis/sentiment" },
        { label: "Whale Tracking", icon: "Eye", path: "/whale-tracking" },
      ]
    },
    {
      title: "Tax & Reporting",
      icon: "Receipt",
      items: [
        { label: "Tax Reports", icon: "Calculator", path: "/reports/tax", badge: "Enhanced" },
        { label: "Tax Calculator", icon: "Calculator", path: "/tax-calculator" },
        { label: "Reports Center", icon: "FileText", path: "/reports" },
        { label: "Custom Reports", icon: "List", path: "/reports/custom" },
      ]
    },
    {
      title: "Utilities",
      icon: "Landmark",
      items: [
        { label: "Trading Journal", icon: "BookOpen", path: "/journal" },
        { label: "News & Events", icon: "Newspaper", path: "/news" },
      ]
    },
    {
      title: "Administration",
      icon: "Shield",
      items: [
        { label: "User Management", icon: "Users", path: "/admin-testers" },
        { label: "Account Management", icon: "FileText", path: "/account-management" },
        { label: "Advanced Analytics", icon: "BarChart", path: "/advanced-analytics" },
      ]
    },
    {
      title: "AI Agents",
      icon: "Bot",
      items: [
        { label: "Advisor Panel", icon: "Bot", path: "/advisor", badge: "Beta" }
      ]
    },
    {
      title: "Market Overview",
      icon: "Globe",
      items: [
        { label: "Market Overview", icon: "Globe", path: "/dashboard/market" }
      ]
    },
    {
      title: "Preferences",
      icon: "Sliders",
      items: [
        { label: "Preferences", icon: "Sliders", path: "/settings/preferences" }
      ]
    }
  ]
};

export const navLinks = [
  {
    label: 'Disclaimer',
    href: '/legal/disclaimer',
    footer: true,
  },
];

export default navConfig; 