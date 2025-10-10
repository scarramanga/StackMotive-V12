import React from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { KPICard } from '@/components/analytics/KPICard';
import { AllocationChart } from '@/components/analytics/AllocationChart';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getAccessToken } from '@/lib/auth';

export function PortfolioAnalytics() {
  const { data, totals, loading, error } = usePortfolioData();

  const handleExportSnapshot = async () => {
    try {
      const token = getAccessToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          type: 'portfolio_snapshot',
          format: 'csv',
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Determine file type from content-type
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const isCSV = contentType.includes('text/csv') || contentType.includes('text/plain');

      if (isJson) {
        const jsonData = await response.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (isCSV) {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback: try to download as blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export snapshot. Please try again.');
    }
  };

  // Format currency with no decimals
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage with sign and one decimal
  const formatPercent = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Format day P&L with currency and sign
  const formatDayPL = (value: number): string => {
    if (value === 0) return '$0';
    const sign = value >= 0 ? '+' : '';
    return sign + formatCurrency(Math.abs(value));
  };

  // Calculate allocation by asset class
  const allocationByAssetClass = React.useMemo(() => {
    const { positions } = data;
    if (positions.length === 0 || totals.total_value === 0) return [];

    const grouped = positions.reduce((acc, pos) => {
      const assetClass = pos.assetclass || 'Other';
      if (!acc[assetClass]) {
        acc[assetClass] = 0;
      }
      acc[assetClass] += pos.market_value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([label, value]) => ({
      label,
      value: (value / totals.total_value) * 100,
    }));
  }, [data.positions, totals.total_value]);

  // Calculate top symbols by weight
  const topSymbols = React.useMemo(() => {
    const { positions } = data;
    if (positions.length === 0 || totals.total_value === 0) return [];

    const sorted = [...positions]
      .sort((a, b) => b.market_value - a.market_value)
      .slice(0, 8);

    return sorted.map(pos => ({
      label: pos.symbol,
      value: (pos.market_value / totals.total_value) * 100,
    }));
  }, [data.positions, totals.total_value]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Analytics</h1>
        </div>

        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Allocation Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Analytics</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">Error loading portfolio data</p>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.positions.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Analytics</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No positions found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Analytics</h1>
        <Button onClick={handleExportSnapshot} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Snapshot
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Value"
          value={formatCurrency(totals.total_value)}
          data-testid="kpi-total-value"
        />
        <KPICard
          label="Positions"
          value={totals.positions_count.toString()}
          data-testid="kpi-positions"
        />
        <KPICard
          label="Unrealized P&L"
          value={formatPercent(totals.unrealized_pl_pct)}
          subtext="Total portfolio gain/loss"
          data-testid="kpi-unrealized-pl"
        />
        <KPICard
          label="Day P&L"
          value={formatDayPL(totals.day_pl || 0)}
          subtext="Today's change"
          data-testid="kpi-day-pl"
        />
      </div>

      {/* Allocation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationChart
          title="Allocation by Asset Class"
          items={allocationByAssetClass}
          data-testid="chart-asset-class"
        />
        <AllocationChart
          title="Top Symbols by Weight"
          items={topSymbols}
          data-testid="chart-top-symbols"
        />
      </div>
    </div>
  );
}

export default PortfolioAnalytics;

