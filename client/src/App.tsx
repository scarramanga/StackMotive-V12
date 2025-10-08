// 🔐 STACKMOTIVE STABLE STATE LOCK (DO NOT EDIT BELOW THIS LINE)
// This file was confirmed stable on: 2025-06-08
// Covered: AuthProvider, Onboarding Redirect, Paper Trading Setup, Dashboard Gate
// Use only Cursor-pinned prompts to modify

import React, { useEffect, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Strategies from "@/pages/strategies";
import Trading from "@/pages/trading";
import Analytics from "@/pages/analytics";
import Education from "@/pages/education";
import { ThemeProvider } from "next-themes";
import { Loading } from '@/components/ui/loading';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import UserProfile from "@/pages/UserProfile";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';

// Import new pages
import TradeView from "@/pages/trading/trade-view";
import StrategiesPage from "@/pages/trading/strategies";
import MACDCrossoverStrategy from "@/pages/trading/strategies/macd-crossover";
import MACDCrossoverBacktest from "@/pages/trading/strategies/macd-crossover/backtest";
import NewStrategy from "@/pages/trading/strategies/new";
import NewPaperTradingAccount from "@/pages/paper-trading/new";
import PaperTradingDashboard from "@/pages/paper-trading/dashboard";
import StrategySelector from "@/pages/paper-trading/strategy";
import AIStrategyBuilder from "@/pages/trading/ai-strategy-builder";
import NewsPage from "@/pages/news";
import WhaleTrackingPage from "@/pages/whale-tracking";
import ReportsPage from "@/pages/reports";
import CustomReportPage from "@/pages/reports/custom";
import TaxCalculatorPage from "@/pages/tax-calculator";
import SettingsPage from "@/pages/settings";
import OnboardingPage from "@/pages/onboarding";
import AccountManagementPage from "@/pages/account-management";
import CombinedPortfolioPage from "@/pages/combined-portfolio";
import TechnicalAnalysisPage from "@/pages/technical-analysis";
import MarketSentimentPage from "@/pages/market-sentiment";
import AdminTestersPage from "@/pages/admin-testers";
import ScheduledTradesPage from "@/pages/scheduled-trades";
// TEMPORARILY COMMENTED OUT - tax.tsx has syntax errors blocking build (not part of Blocks 1-10)
// import TaxReportsPage from "@/pages/reports/tax";
import AdvancedAnalyticsPage from "@/pages/advanced-analytics";
import TradingJournalPage from "@/pages/journal";
import NavigationTestPage from "@/pages/navigation-test";
import TestRoutesPage from "@/pages/test-routes";
import DebugNavigationPage from "@/pages/debug-navigation";

const PUBLIC_ROUTES = ['/login', '/register', '/reset-password'];

// Routes that are accessible without completing onboarding
const ALLOWED_ROUTES = [
  '/logout',
  '/settings',
  '/terms',
  '/privacy',
  '/onboarding'
];

// Router component moved outside to prevent context issues
function Router() {
  const [location] = useLocation();
  const { user, loading } = useAuth();

  const skipLoadingCheck = true;
  
  // Show loading while auth state is being determined
  if (loading && !skipLoadingCheck) {
    return <Loading fullscreen />;
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(location);

  if (!user && !isPublicRoute && !skipLoadingCheck) {
    return <FullScreenLoader message="Setting up your account..." />;
  }

  // All redirection logic is now handled by the AuthProvider
  // Router just renders the routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile" component={UserProfile} />
      <Route path="/strategies" component={Strategies} />
      <Route path="/trading" component={Trading} />
      <Route path="/trading/trade" component={TradeView} />
      <Route path="/trading/strategies" component={StrategiesPage} />
      <Route path="/trading/strategies/macd-crossover" component={MACDCrossoverStrategy} />
      <Route path="/trading/strategies/macd-crossover/backtest" component={MACDCrossoverBacktest} />
      <Route path="/trading/strategies/new" component={NewStrategy} />
      <Route path="/paper-trading/new" component={NewPaperTradingAccount} />
      <Route path="/paper-trading/dashboard" component={PaperTradingDashboard} />
      <Route path="/paper-trading/strategy" component={StrategySelector} />
      <Route path="/trading/ai-strategy-builder" component={AIStrategyBuilder} />
      <Route path="/news" component={NewsPage} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/education" component={Education} />
      <Route path="/whale-tracking" component={WhaleTrackingPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/reports/custom" component={CustomReportPage} />
      <Route path="/tax-calculator" component={TaxCalculatorPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/account-management" component={AccountManagementPage} />
      <Route path="/combined-portfolio" component={CombinedPortfolioPage} />
      <Route path="/analysis/technical" component={TechnicalAnalysisPage} />
      <Route path="/analysis/sentiment" component={MarketSentimentPage} />
      <Route path="/analysis/portfolio" component={Analytics} />
      <Route path="/advanced-analytics" component={AdvancedAnalyticsPage} />
      <Route path="/admin-testers" component={AdminTestersPage} />
      <Route path="/scheduled-trades" component={ScheduledTradesPage} />
              {/* TEMPORARILY COMMENTED OUT - tax.tsx has syntax errors blocking build (not part of Blocks 1-10) */}
        {/* <Route path="/reports/tax" component={TaxReportsPage} /> */}
      <Route path="/journal" component={TradingJournalPage} />
      <Route path="/navigation-test" component={NavigationTestPage} />
      <Route path="/test-routes" component={TestRoutesPage} />
      <Route path="/debug-navigation" component={DebugNavigationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // 🔐 DO NOT REORDER THESE WRAPPERS
  type WrapperOrder = [
    'ThemeProvider',
    'QueryClientProvider',
    'AuthProvider',
    'UserSettingsProvider',
    'PortfolioProvider',
    'Router'
  ];
  
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserSettingsProvider>
            <PortfolioProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </PortfolioProvider>
          </UserSettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
