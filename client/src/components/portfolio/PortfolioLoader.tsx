// Block 1: Portfolio Loader Component
import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Plus, RefreshCw, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

interface PortfolioPosition {
  id?: number;
  symbol: string;
  name?: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  assetClass: string;
  account: string;
  currency: string;
  syncSource: string;
  lastUpdated: string;
}

interface SyncStatus {
  id: number;
  userId: number;
  syncSource: string;
  status: string;
  recordsImported: number;
  errorMessage?: string;
  syncStarted: string;
  syncCompleted?: string;
}

interface PortfolioLoaderProps {
  userId: number;
}

const ASSET_CLASSES = [
  { value: 'equity', label: 'Equity' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'fund', label: 'Fund' },
  { value: 'bond', label: 'Bond' },
  { value: 'cash', label: 'Cash' },
];

const SYNC_SOURCES = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'csv', label: 'CSV Import' },
  { value: 'ibkr', label: 'Interactive Brokers' },
  { value: 'kucoin', label: 'KuCoin' },
  { value: 'kraken', label: 'Kraken' },
];

export default function PortfolioLoader({ userId }: PortfolioLoaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for CSV import
  const [csvData, setCsvData] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [showMapping, setShowMapping] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // State for manual entry
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualPosition, setManualPosition] = useState<Partial<PortfolioPosition>>({
    assetClass: 'equity',
    currency: 'USD',
    syncSource: 'manual',
    account: 'Manual Entry',
  });

  // Get portfolio positions
  const { data: portfolioData, isLoading: isLoadingPositions, refetch: refetchPositions } = useQuery({
    queryKey: ['portfolio-positions', userId],
    queryFn: async () => {
      const response = await fetch(`/api/portfolio/loader/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch portfolio positions');
      return response.json();
    },
    enabled: !!userId,
  });

  // Get sync status
  const { data: syncStatusData, refetch: refetchSyncStatus } = useQuery({
    queryKey: ['portfolio-sync-status', userId],
    queryFn: async () => {
      const response = await fetch(`/api/portfolio/loader/sync-status/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch sync status');
      return response.json();
    },
    enabled: !!userId,
    refetchInterval: 5000, // Check every 5 seconds
  });

  // CSV Import Mutation
  const csvImportMutation = useMutation({
    mutationFn: async ({ csvData, fieldMapping }: { csvData: string; fieldMapping: Record<string, string> }) => {
      const response = await fetch('/api/portfolio/loader/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData, fieldMapping, userId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'CSV import failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'CSV Import Successful',
        description: data.message,
      });
      refetchPositions();
      refetchSyncStatus();
      resetCsvImport();
    },
    onError: (error) => {
      toast({
        title: 'CSV Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Manual Position Mutation
  const addPositionMutation = useMutation({
    mutationFn: async (position: PortfolioPosition) => {
      const response = await fetch('/api/portfolio/loader/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, position }),
      });
      if (!response.ok) throw new Error('Failed to add position');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Position Added',
        description: 'Portfolio position added successfully',
      });
      refetchPositions();
      setShowManualDialog(false);
      setManualPosition({
        assetClass: 'equity',
        currency: 'USD',
        syncSource: 'manual',
        account: 'Manual Entry',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add Position',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete Position Mutation
  const deletePositionMutation = useMutation({
    mutationFn: async (positionId: number) => {
      const response = await fetch(`/api/portfolio/loader/${positionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete position');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Position Deleted',
        description: 'Portfolio position deleted successfully',
      });
      refetchPositions();
    },
    onError: (error) => {
      toast({
        title: 'Failed to Delete Position',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle CSV file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      setCsvData(csvText);
      
      // Parse CSV to get headers
      Papa.parse(csvText, {
        header: true,
        preview: 1,
        complete: (results) => {
          if (results.meta.fields) {
            setCsvHeaders(results.meta.fields);
            
            // Auto-detect common field mappings
            const autoMapping: Record<string, string> = {};
            results.meta.fields.forEach(header => {
              const lowerHeader = header.toLowerCase();
              if (lowerHeader.includes('symbol') || lowerHeader.includes('ticker')) {
                autoMapping.symbol = header;
              } else if (lowerHeader.includes('company') || lowerHeader.includes('name')) {
                autoMapping.name = header;
              } else if (lowerHeader.includes('shares') || lowerHeader.includes('quantity')) {
                autoMapping.quantity = header;
              } else if (lowerHeader.includes('average') && lowerHeader.includes('price')) {
                autoMapping.avgPrice = header;
              } else if (lowerHeader.includes('current') && lowerHeader.includes('price')) {
                autoMapping.currentPrice = header;
              } else if (lowerHeader.includes('currency')) {
                autoMapping.currency = header;
              }
            });
            
            setFieldMapping(autoMapping);
            setShowMapping(true);
          }
        },
      });
    };
    reader.readAsText(file);
  }, []);

  // Reset CSV import state
  const resetCsvImport = () => {
    setCsvData('');
    setCsvHeaders([]);
    setFieldMapping({});
    setShowMapping(false);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle CSV import
  const handleCsvImport = () => {
    if (!csvData || !fieldMapping.symbol || !fieldMapping.quantity || !fieldMapping.avgPrice) {
      toast({
        title: 'Invalid Mapping',
        description: 'Please map at least Symbol, Quantity, and Average Price fields',
        variant: 'destructive',
      });
      return;
    }
    
    setIsImporting(true);
    csvImportMutation.mutate({ csvData, fieldMapping });
  };

  // Handle manual position submission
  const handleManualSubmit = () => {
    if (!manualPosition.symbol || !manualPosition.quantity || !manualPosition.avgPrice) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in Symbol, Quantity, and Average Price',
        variant: 'destructive',
      });
      return;
    }
    
    addPositionMutation.mutate(manualPosition as PortfolioPosition);
  };

  const positions = portfolioData?.positions || [];
  const syncStatus = syncStatusData?.syncStatus as SyncStatus | null;

  return (
    <div className="space-y-6">
      {/* Header with Sync Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Loader</h2>
          <p className="text-muted-foreground">
            Import and manage your portfolio positions
          </p>
        </div>
        
        {syncStatus && (
          <div className="flex items-center space-x-2">
            {syncStatus.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {syncStatus.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
            {syncStatus.status === 'partial' && <Clock className="h-4 w-4 text-yellow-500" />}
            <div className="text-sm">
              <div className="font-medium">Last Sync: {syncStatus.syncSource}</div>
              <div className="text-muted-foreground">
                {syncStatus.recordsImported} positions imported
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import Options */}
      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">CSV Import</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>
        
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>CSV Import</span>
              </CardTitle>
              <CardDescription>
                Upload a CSV file from Sharesies or other brokers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showMapping ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-file">Select CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="mt-1"
                    />
                  </div>
                  
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertTitle>CSV Format Requirements</AlertTitle>
                    <AlertDescription>
                      Your CSV should include columns for Symbol, Quantity, and Average Price at minimum.
                      Common formats from Sharesies, IBKR, and other brokers are supported.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Field Mapping</h4>
                    <Button variant="outline" size="sm" onClick={resetCsvImport}>
                      Start Over
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'symbol', label: 'Symbol *', required: true },
                      { key: 'name', label: 'Company Name', required: false },
                      { key: 'quantity', label: 'Quantity *', required: true },
                      { key: 'avgPrice', label: 'Average Price *', required: true },
                      { key: 'currentPrice', label: 'Current Price', required: false },
                      { key: 'currency', label: 'Currency', required: false },
                    ].map(({ key, label, required }) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key}>
                          {label}
                          {required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Select
                          value={fieldMapping[key] || ''}
                          onValueChange={(value) => setFieldMapping(prev => ({ ...prev, [key]: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CSV column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- None --</SelectItem>
                            {csvHeaders.map(header => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleCsvImport} 
                      disabled={isImporting || csvImportMutation.isPending}
                      className="flex-1"
                    >
                      {(isImporting || csvImportMutation.isPending) && (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Import Positions
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Manual Entry</span>
              </CardTitle>
              <CardDescription>
                Add individual positions manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">Add Position</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Manual Position</DialogTitle>
                    <DialogDescription>
                      Enter the details of your portfolio position
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="symbol" className="text-right">Symbol *</Label>
                      <Input
                        id="symbol"
                        value={manualPosition.symbol || ''}
                        onChange={(e) => setManualPosition(prev => ({ ...prev, symbol: e.target.value }))}
                        className="col-span-3"
                        placeholder="e.g., AAPL"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input
                        id="name"
                        value={manualPosition.name || ''}
                        onChange={(e) => setManualPosition(prev => ({ ...prev, name: e.target.value }))}
                        className="col-span-3"
                        placeholder="e.g., Apple Inc."
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="quantity" className="text-right">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.000001"
                        value={manualPosition.quantity || ''}
                        onChange={(e) => setManualPosition(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                        className="col-span-3"
                        placeholder="10"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="avgPrice" className="text-right">Avg Price *</Label>
                      <Input
                        id="avgPrice"
                        type="number"
                        step="0.01"
                        value={manualPosition.avgPrice || ''}
                        onChange={(e) => setManualPosition(prev => ({ ...prev, avgPrice: parseFloat(e.target.value) }))}
                        className="col-span-3"
                        placeholder="150.00"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="assetClass" className="text-right">Asset Class</Label>
                      <Select
                        value={manualPosition.assetClass || 'equity'}
                        onValueChange={(value) => setManualPosition(prev => ({ ...prev, assetClass: value }))}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_CLASSES.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="account" className="text-right">Account</Label>
                      <Input
                        id="account"
                        value={manualPosition.account || 'Manual Entry'}
                        onChange={(e) => setManualPosition(prev => ({ ...prev, account: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleManualSubmit}
                      disabled={addPositionMutation.isPending}
                    >
                      {addPositionMutation.isPending && (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Position
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Portfolio Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Positions ({positions.length})</CardTitle>
          <CardDescription>
            Your current portfolio holdings from all sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPositions ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No positions found. Import your portfolio or add positions manually.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Asset Class</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position: PortfolioPosition) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">{position.symbol}</TableCell>
                    <TableCell>{position.name || '-'}</TableCell>
                    <TableCell className="text-right">{position.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {position.currency} {position.avgPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {position.currency} {(position.quantity * position.avgPrice).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{position.assetClass}</Badge>
                    </TableCell>
                    <TableCell>{position.account}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{position.syncSource}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => position.id && deletePositionMutation.mutate(position.id)}
                        disabled={deletePositionMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 