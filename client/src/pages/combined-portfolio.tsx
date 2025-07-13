import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackLink } from '@/components/ui/back-link';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Newspaper, 
  RefreshCcw,
  Share2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type EquityItem = {
  Symbol: string;
  shares: number;
  Value: number;
  pnl_pct: string;
  price: number;
  news: Array<{
    title: string;
    url: string;
    source: string;
  }>;
};

type CryptoItem = {
  Symbol: string;
  amount: number;
  source: string;
  price: number | null;
  Value: number;
  news: Array<{
    title: string;
    url: string;
    source: string;
  }>;
};

type CombinedPortfolio = {
  equities: EquityItem[];
  crypto: CryptoItem[];
};

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#8DD1E1', '#A4DE6C', '#D0ED57', '#FFC658'
];

export default function CombinedPortfolioPage() {
  const { toast } = useToast();
  const [selectedAsset, setSelectedAsset] = useState<EquityItem | CryptoItem | null>(null);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  
  const { data, isLoading, isError, refetch } = useQuery<CombinedPortfolio>({
    queryKey: ['/api/combined-portfolio'],
    refetchOnWindowFocus: false,
  });

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: 'Portfolio refreshed',
      description: 'Your portfolio data has been updated.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Skeleton className="h-[300px] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Portfolio</CardTitle>
          <CardDescription>
            There was an issue fetching your portfolio data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate total values and create data for pie chart
  const totalEquityValue = data.equities.reduce((sum, item) => sum + item.Value, 0);
  const totalCryptoValue = data.crypto.reduce((sum, item) => sum + item.Value, 0);
  const totalPortfolioValue = totalEquityValue + totalCryptoValue;

  const equityPieData = data.equities
    .filter(item => item.Value > totalEquityValue * 0.02) // Filter out small positions for better visibility
    .map(item => ({
      name: item.Symbol,
      value: item.Value,
    }));

  // Add an "Others" category for the small positions
  const smallEquities = data.equities.filter(item => item.Value <= totalEquityValue * 0.02);
  if (smallEquities.length > 0) {
    equityPieData.push({
      name: 'Others',
      value: smallEquities.reduce((sum, item) => sum + item.Value, 0),
    });
  }

  const cryptoPieData = data.crypto
    .filter(item => item.Value > totalCryptoValue * 0.02)
    .map(item => ({
      name: item.Symbol,
      value: item.Value,
    }));

  // Add an "Others" category for the small positions
  const smallCryptos = data.crypto.filter(item => item.Value <= totalCryptoValue * 0.02);
  if (smallCryptos.length > 0) {
    cryptoPieData.push({
      name: 'Others',
      value: smallCryptos.reduce((sum, item) => sum + item.Value, 0),
    });
  }

  // Asset allocation data
  const allocationData = [
    { name: 'Equities', value: totalEquityValue },
    { name: 'Crypto', value: totalCryptoValue },
  ];

  // Format for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1) + '%';
  };

  const handleViewNews = (asset: EquityItem | CryptoItem) => {
    setSelectedAsset(asset);
    setNewsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <BackLink href="/analysis">← Back to Analysis</BackLink>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Combined Portfolio</h1>
          <p className="text-muted-foreground">
            View your combined equities and cryptocurrency holdings
          </p>
        </div>
        <Button onClick={handleRefresh} className="flex items-center">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEquityValue)}</div>
            <div className="text-xs text-muted-foreground">
              {formatPercentage(totalEquityValue, totalPortfolioValue)} of portfolio
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crypto</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCryptoValue)}</div>
            <div className="text-xs text-muted-foreground">
              {formatPercentage(totalCryptoValue, totalPortfolioValue)} of portfolio
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">News Updates</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.equities.reduce((sum, item) => sum + item.news.length, 0) + 
                data.crypto.reduce((sum, item) => sum + item.news.length, 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              Related news items about your assets
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
          <CardDescription>
            Breakdown of your portfolio by asset class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Value']} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Holdings */}
      <Tabs defaultValue="equities">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="equities">Equities</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="equities" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Equity Holdings</CardTitle>
              <CardDescription>
                Stock positions across all your accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="md:grid md:grid-cols-2 gap-6">
                <div className="h-[300px] mb-6 md:mb-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={equityPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          name.length > 6 ? 
                            `${name.substring(0, 6)}...` : 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {equityPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Value']} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">News</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.equities
                        .sort((a, b) => b.Value - a.Value)
                        .map((equity) => (
                          <TableRow key={equity.Symbol}>
                            <TableCell className="font-medium">{equity.Symbol}</TableCell>
                            <TableCell className="text-right">{equity.shares.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${equity.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${equity.Value.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {equity.news.length > 0 ? (
                                <Badge 
                                  variant="secondary" 
                                  className="cursor-pointer"
                                  onClick={() => handleViewNews(equity)}
                                >
                                  {equity.news.length} items
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="crypto" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cryptocurrency Holdings</CardTitle>
              <CardDescription>
                Your digital asset portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="md:grid md:grid-cols-2 gap-6">
                <div className="h-[300px] mb-6 md:mb-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cryptoPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {cryptoPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Value']} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">News</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.crypto
                        .sort((a, b) => b.Value - a.Value)
                        .map((crypto) => (
                          <TableRow key={crypto.Symbol}>
                            <TableCell className="font-medium">{crypto.Symbol}</TableCell>
                            <TableCell className="text-right">{crypto.amount.toLocaleString(undefined, {
                              maximumFractionDigits: 8
                            })}</TableCell>
                            <TableCell className="text-right">
                              ${crypto.price !== null ? crypto.price.toFixed(2) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">${crypto.Value.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {crypto.news.length > 0 ? (
                                <Badge 
                                  variant="secondary" 
                                  className="cursor-pointer"
                                  onClick={() => handleViewNews(crypto)}
                                >
                                  {crypto.news.length} items
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* News Dialog */}
      <Dialog open={newsDialogOpen} onOpenChange={setNewsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              News for {selectedAsset?.Symbol}
            </DialogTitle>
            <DialogDescription>
              Latest news and updates related to this asset
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {selectedAsset?.news.length === 0 ? (
              <p className="text-center text-muted-foreground p-4">
                No news available for this asset.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedAsset?.news.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <h3 className="text-lg font-medium mb-1">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {item.title}
                        </a>
                      </h3>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Source: {item.source}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}