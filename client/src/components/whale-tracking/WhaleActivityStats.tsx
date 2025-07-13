import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface WhaleActivityStatsProps {
  activities: any[] | undefined;
}

export const WhaleActivityStats: React.FC<WhaleActivityStatsProps> = ({
  activities
}) => {
  const stats = useMemo(() => {
    if (!activities || activities.length === 0) {
      return {
        totalBuyVolume: 0,
        totalSellVolume: 0,
        netVolume: 0,
        totalValueUsd: 0,
        symbolBreakdown: {},
        institutionBreakdown: {},
        symbolNetFlow: {}
      };
    }

    const totalBuyVolume = activities
      .filter((activity: any) => activity.action === 'BUY' || activity.action === 'ACCUMULATE')
      .reduce((sum: number, activity: any) => sum + parseInt(activity.valueUsd), 0);

    const totalSellVolume = activities
      .filter((activity: any) => activity.action === 'SELL' || activity.action === 'DISTRIBUTE')
      .reduce((sum: number, activity: any) => sum + parseInt(activity.valueUsd), 0);

    const netVolume = totalBuyVolume - totalSellVolume;
    const totalValueUsd = totalBuyVolume + totalSellVolume;

    // Group by symbol
    const symbolBreakdown = activities.reduce((acc: any, activity: any) => {
      const symbol = activity.symbol;
      if (!acc[symbol]) {
        acc[symbol] = 0;
      }
      acc[symbol] += parseInt(activity.valueUsd);
      return acc;
    }, {});

    // Group by institution
    const institutionBreakdown = activities.reduce((acc: any, activity: any) => {
      const institution = activity.institution;
      if (!acc[institution]) {
        acc[institution] = 0;
      }
      acc[institution] += parseInt(activity.valueUsd);
      return acc;
    }, {});

    // Calculate net flow by symbol
    const symbolNetFlow = activities.reduce((acc: any, activity: any) => {
      const symbol = activity.symbol;
      if (!acc[symbol]) {
        acc[symbol] = 0;
      }
      
      if (activity.action === 'BUY' || activity.action === 'ACCUMULATE') {
        acc[symbol] += parseInt(activity.valueUsd);
      } else if (activity.action === 'SELL' || activity.action === 'DISTRIBUTE') {
        acc[symbol] -= parseInt(activity.valueUsd);
      }
      
      return acc;
    }, {});

    return {
      totalBuyVolume,
      totalSellVolume,
      netVolume,
      totalValueUsd,
      symbolBreakdown,
      institutionBreakdown,
      symbolNetFlow
    };
  }, [activities]);

  const topSymbols = useMemo(() => {
    if (!stats.symbolBreakdown) return [];
    
    return Object.entries(stats.symbolBreakdown)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);
  }, [stats.symbolBreakdown]);

  const topInstitutions = useMemo(() => {
    if (!stats.institutionBreakdown) return [];
    
    return Object.entries(stats.institutionBreakdown)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);
  }, [stats.institutionBreakdown]);

  const topNetFlows = useMemo(() => {
    if (!stats.symbolNetFlow) return [];
    
    return Object.entries(stats.symbolNetFlow)
      .sort((a: any, b: any) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5);
  }, [stats.symbolNetFlow]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Buy Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.totalBuyVolume)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sell Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(stats.totalSellVolume)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netVolume >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {stats.netVolume >= 0 ? '+' : ''}{formatCurrency(Math.abs(stats.netVolume))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Activity Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalValueUsd)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Top Assets by Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {topSymbols.map(([symbol, volume]) => (
                <li key={symbol} className="flex justify-between items-center">
                  <span className="font-medium">{symbol}</span>
                  <span className="text-sm text-muted-foreground">{formatCurrency(volume as number)}</span>
                </li>
              ))}
              {topSymbols.length === 0 && (
                <li className="text-center py-4 text-muted-foreground">No data available</li>
              )}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Top Institutions by Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {topInstitutions.map(([institution, volume]) => (
                <li key={institution} className="flex justify-between items-center">
                  <span className="font-medium">{institution}</span>
                  <span className="text-sm text-muted-foreground">{formatCurrency(volume as number)}</span>
                </li>
              ))}
              {topInstitutions.length === 0 && (
                <li className="text-center py-4 text-muted-foreground">No data available</li>
              )}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Top Assets by Net Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {topNetFlows.map(([symbol, netFlow]) => (
                <li key={symbol} className="flex justify-between items-center">
                  <span className="font-medium">{symbol}</span>
                  <span className={`text-sm ${(netFlow as number) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {(netFlow as number) >= 0 ? '+' : ''}{formatCurrency(Math.abs(netFlow as number))}
                  </span>
                </li>
              ))}
              {topNetFlows.length === 0 && (
                <li className="text-center py-4 text-muted-foreground">No data available</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};