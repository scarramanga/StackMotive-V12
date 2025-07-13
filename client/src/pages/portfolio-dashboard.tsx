// BLOCK 4 IMPLEMENTATION: Refactored to use SummaryCard, TabSection, and WidgetContainer for unified dashboard structure.
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, DollarSign, Percent, PieChart, Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import SummaryCard from '@/components/ui/SummaryCard';
import TabSection from '@/components/ui/TabSection';
import WidgetContainer from '@/components/ui/WidgetContainer';
import StrategySignals from '@/components/ui/StrategySignals';
import AssetViewTabs from '@/components/ui/AssetViewTabs';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Vault } from '@/hooks/useVaultAPI';

interface PortfolioSummary {
  totalValue: number;
  changePercent: number;
  changeValue: number;
  netWorth: number;
  assetCount: number;
}

const PortfolioDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('allocation');
  const { vaultList, activeVaultId, setActiveVaultId } = usePortfolio() as { vaultList: Vault[]; activeVaultId: string | null; setActiveVaultId: (id: string | null) => void; };
  const safeVaultList: Vault[] = Array.isArray(vaultList) ? vaultList : [];

  // Get portfolio summary data with real-time data from broker connections
  const { data: portfolioSummary, isLoading: isLoadingSummary } = useQuery<PortfolioSummary>({
    queryKey: ['/api/portfolio/summary', activeVaultId],
    queryFn: async () => {
      const url = activeVaultId ? `/api/portfolio/summary?vaultId=${activeVaultId}` : '/api/portfolio/summary';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch portfolio summary');
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 5 * 60 * 1000,
  });

  // Get holdings data from all connected brokers and exchanges
  const { data: holdings, isLoading: isLoadingHoldings } = useQuery({
    queryKey: ['/api/portfolio/holdings', activeVaultId],
    queryFn: async () => {
      const url = activeVaultId ? `/api/portfolio/holdings?vaultId=${activeVaultId}` : '/api/portfolio/holdings';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch holdings');
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 5 * 60 * 1000,
  });

  // Example strategies and signals (replace with real data as needed)
  const strategies = [
    { name: 'Aggressive', label: 'Aggressive', color: 'bg-purple-500', description: 'High risk, high reward' },
    { name: 'Balanced', label: 'Balanced', color: 'bg-blue-500', description: 'Moderate risk, diversified' },
    { name: 'Defensive', label: 'Defensive', color: 'bg-green-500', description: 'Low risk, capital preservation' },
  ];
  const signals = [
    { type: 'MACD Buy', symbol: 'ARKK', action: 'BUY', confidence: 'high' },
    { type: 'Whale Activity', symbol: 'BTC', action: 'BUY', confidence: 'medium' },
    { type: 'RSI Overbought', symbol: 'TSLA', action: 'SELL', confidence: 'high' },
  ];
  const [activeStrategy, setActiveStrategy] = useState('Aggressive');

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Sign in to view your portfolio</h2>
          <p className="text-muted-foreground">
            Track your investments across multiple exchanges and analyze your portfolio performance.
          </p>
        </div>
        <Button onClick={() => setLocation("/login")}>Sign In</Button>
      </div>
    );
  }

  // Summary card data
  const summaryCards = [
    {
      title: 'Total Portfolio Value',
      value: isLoadingSummary ? <Skeleton className="h-8 w-36" /> : formatCurrency(portfolioSummary?.totalValue || 0),
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      children: isLoadingSummary ? null : (
        <div className="flex items-center space-x-2">
          {portfolioSummary?.changePercent !== undefined ? (
            <Badge variant={portfolioSummary.changePercent >= 0 ? "default" : "destructive"}>
              {portfolioSummary.changePercent >= 0 ? (
                <ArrowUp className="mr-1 h-3 w-3" />
              ) : (
                <ArrowDown className="mr-1 h-3 w-3" />
              )}
              {Math.abs(portfolioSummary.changePercent).toFixed(2)}%
            </Badge>
          ) : null}
          <p className="text-xs text-muted-foreground">vs previous period</p>
        </div>
      )
    },
    {
      title: 'Net Worth',
      value: isLoadingSummary ? <Skeleton className="h-8 w-36" /> : formatCurrency(portfolioSummary?.netWorth || 0),
      icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
      footer: 'Includes all assets and cash'
    },
    {
      title: 'Total Change',
      value: isLoadingSummary ? <Skeleton className="h-8 w-36" /> : formatCurrency(portfolioSummary?.changeValue || 0),
      icon: <Percent className="h-4 w-4 text-muted-foreground" />,
      footer: 'Since inception'
    },
    {
      title: 'Assets',
      value: isLoadingSummary ? <Skeleton className="h-8 w-36" /> : (portfolioSummary?.assetCount || 0),
      icon: <PieChart className="h-4 w-4 text-muted-foreground" />,
      footer: 'Across all exchanges'
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Portfolio Selector Dropdown */}
      {(safeVaultList.length > 1) && (
        <div className="mb-4 flex items-center gap-2">
          <span className="font-medium">Portfolio:</span>
          <Select value={activeVaultId || undefined} onValueChange={setActiveVaultId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select portfolio" />
            </SelectTrigger>
            <SelectContent>
              {safeVaultList.map((vault, idx) => (
                <SelectItem key={vault.vault_id} value={vault.vault_id}>{`Portfolio ${idx + 1}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
          <p className="text-muted-foreground">
            Analyze your investments across multiple assets and exchanges
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/broker-setup">
              <Plus className="mr-2 h-4 w-4" /> Add Broker
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/manual-entry">
              <Plus className="mr-2 h-4 w-4" /> Manual Entry
            </Link>
          </Button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <SummaryCard key={i} {...card} />
        ))}
      </div>

      {/* Strategy & Signals Section */}
      <StrategySignals
        strategies={strategies}
        signals={signals}
        contextLabel="Live"
        activeStrategy={activeStrategy}
        onStrategyChange={setActiveStrategy}
      />

      {/* Unified AssetViewTabs */}
      <AssetViewTabs
        showPerformanceTab={true}
        preferenceKey="portfolioAssetTab"
        renderHoldings={() => (
          <WidgetContainer title="Holdings">
            {isLoadingHoldings ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : Array.isArray(holdings) && holdings.length ? (
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left font-medium">Symbol</th>
                        <th className="h-12 px-4 text-left font-medium">Name</th>
                        <th className="h-12 px-4 text-right font-medium">Quantity</th>
                        <th className="h-12 px-4 text-right font-medium">Price</th>
                        <th className="h-12 px-4 text-right font-medium">Value</th>
                        <th className="h-12 px-4 text-right font-medium">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(holdings) ? holdings : []).map((holding: any) => (
                        <tr key={holding.symbol} className="border-b">
                          <td className="p-4 align-middle font-medium">{holding.symbol}</td>
                          <td className="p-4 align-middle">{holding.name}</td>
                          <td className="p-4 align-middle text-right">{parseFloat(holding.quantity).toFixed(holding.assetType === 'CRYPTO' ? 6 : 2)}</td>
                          <td className="p-4 align-middle text-right">{formatCurrency(holding.currentPrice)}</td>
                          <td className="p-4 align-middle text-right">{formatCurrency(holding.value)}</td>
                          <td className="p-4 align-middle text-right">
                            <div className="flex items-center justify-end">
                              <Badge variant={holding.percentChange >= 0 ? "default" : "destructive"}>
                                {holding.percentChange >= 0 ? (
                                  <ArrowUp className="mr-1 h-3 w-3" />
                                ) : (
                                  <ArrowDown className="mr-1 h-3 w-3" />
                                )}
                                {Math.abs(holding.percentChange).toFixed(2)}%
                              </Badge>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <PieChart className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No holdings found</h3>
                <p className="text-muted-foreground mb-4">Add manual entries or connect your brokers to track your portfolio</p>
                <div className="flex gap-2">
                  <Button asChild>
                    <Link href="/broker-setup">
                      <Plus className="mr-2 h-4 w-4" /> Add Broker
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/manual-entry">
                      <Plus className="mr-2 h-4 w-4" /> Manual Entry
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </WidgetContainer>
        )}
        renderAllocation={() => (
          <WidgetContainer title="Allocation">
            {/* <AssetAllocationChart /> */}
            <></>
          </WidgetContainer>
        )}
        renderPerformance={() => (
          <WidgetContainer title="Performance">
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Performance tracking charts coming soon</p>
              </div>
            </div>
            <></>
          </WidgetContainer>
        )}
      />
    </div>
  );
};

export default PortfolioDashboard; 