import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import DrilldownAssetPage from '@/pages/drilldown/DrilldownAssetPage';

const Dashboard = lazy(() => import('@/pages/dashboard'));
const PaperTrading = lazy(() => import('@/pages/paper-trading/dashboard'));
const Watchlist = lazy(() => import('@/pages/watchlist'));
const Trading = lazy(() => import('@/pages/trading'));
const Reports = lazy(() => import('@/pages/reports'));
const TaxCalculator = lazy(() => import('@/pages/tax-calculator'));
const News = lazy(() => import('@/pages/news'));
const Journal = lazy(() => import('@/pages/journal'));
const WhaleTracking = lazy(() => import('@/pages/whale-tracking'));
const AccountManagement = lazy(() => import('@/pages/account-management'));
const NotFound = lazy(() => import('@/pages/not-found'));

const AppRoutes: React.FC = () => (
  <Router>
    <PageLayout>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/paper-trading/*" element={<PaperTrading />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/trading/*" element={<Trading />} />
          <Route path="/reports/*" element={<Reports />} />
          <Route path="/tax-calculator" element={<TaxCalculator />} />
          <Route path="/news" element={<News />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/whale-tracking" element={<WhaleTracking />} />
          <Route path="/account-management" element={<AccountManagement />} />
          <Route path="/asset/:symbol" element={<DrilldownAssetPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </PageLayout>
  </Router>
);

export default AppRoutes; 