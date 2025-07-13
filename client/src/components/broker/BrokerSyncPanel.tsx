// Block 4: Broker API Sync Panel
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { 
  Link, 
  Unlink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Trash2,
  Plus,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

interface TradingAccount {
  id: number;
  userId: number;
  name: string;
  broker: string;
  accountNumber?: string;
  isActive: boolean;
  balance?: number;
  currency?: string;
  createdAt: string;
  lastSynced?: string;
  connectionStatus?: string;
}

interface BrokerType {
  id: string;
  name: string;
  type: string;
  icon: string;
}

interface BrokerSyncPanelProps {
  userId: number;
}

const BROKER_CONFIGS = {
  ibkr: {
    name: 'Interactive Brokers',
    fields: [
      { key: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: false },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: false },
    ],
    description: 'Connect your Interactive Brokers account for stock trading',
    instructions: 'Requires TWS or IB Gateway running locally. Account number is required.',
  },
  kucoin: {
    name: 'KuCoin',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'apiPassphrase', label: 'API Passphrase', type: 'password', required: true },
    ],
    description: 'Connect your KuCoin account for cryptocurrency trading',
    instructions: 'Create API credentials in KuCoin Security settings with trading permissions.',
  },
  kraken: {
    name: 'Kraken',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
    description: 'Connect your Kraken account for cryptocurrency trading',
    instructions: 'Create API credentials in Kraken Security settings with trading permissions.',
  },
};

// Log action to Agent Memory
async function logToAgentMemory(
  userId: number,
  action: string,
  context?: string,
  userInput?: string,
  agentResponse?: string,
  metadata?: any
) {
  try {
    await fetch('/api/portfolio/loader/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        blockId: '4', // Block 4 - Broker API Sync Panel
        action,
        context,
        userInput,
        agentResponse,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }),
    });
  } catch (error) {
    console.error('Failed to log to Agent Memory:', error);
  }
}

export default function BrokerSyncPanel({ userId }: BrokerSyncPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for adding new broker connection
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [brokerCredentials, setBrokerCredentials] = useState<Record<string, string>>({});
  const [accountName, setAccountName] = useState('');
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  // Get trading accounts
  const { data: accountsData, isLoading: isLoadingAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['trading-accounts', userId],
    queryFn: async () => {
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch trading accounts');
      return response.json();
    },
    enabled: !!userId,
  });

  // Get broker types
  const { data: brokerTypesData } = useQuery({
    queryKey: ['broker-types'],
    queryFn: async () => {
      const response = await fetch('/api/brokers/types');
      if (!response.ok) throw new Error('Failed to fetch broker types');
      return response.json();
    },
  });

  // Add Broker Account Mutation
  const addAccountMutation = useMutation({
    mutationFn: async (accountData: any) => {
      const response = await fetch('/api/trading-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add broker account');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Broker Account Added',
        description: `${data.broker} account "${data.name}" has been added successfully`,
      });
      refetchAccounts();
      resetAddDialog();
      
      logToAgentMemory(
        userId,
        'broker_account_added',
        'User added a new broker account',
        JSON.stringify({ broker: selectedBroker, name: accountName }),
        `Added ${data.broker} account with ID ${data.id}`,
        { accountId: data.id, broker: data.broker }
      );
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add Account',
        description: error.message,
        variant: 'destructive',
      });
      
      logToAgentMemory(
        userId,
        'broker_account_add_failed',
        'Failed to add broker account',
        JSON.stringify({ broker: selectedBroker, name: accountName }),
        error.message,
        { error: error.message }
      );
    },
  });

  // Sync Account Mutation
  const syncAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const response = await fetch(`/api/accounts/${accountId}/sync`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync account');
      }
      return response.json();
    },
    onSuccess: (data, accountId) => {
      toast({
        title: 'Account Synced',
        description: 'Account data has been synchronized successfully',
      });
      refetchAccounts();
      
             const account = accounts.find((acc: TradingAccount) => acc.id === accountId);
       logToAgentMemory(
         userId,
         'broker_account_synced',
         'User manually synced broker account',
         undefined,
         `Synced ${account?.broker} account ${account?.name}`,
         { accountId, broker: account?.broker }
       );
    },
    onError: (error, accountId) => {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
      
             const account = accounts.find((acc: TradingAccount) => acc.id === accountId);
       logToAgentMemory(
         userId,
         'broker_account_sync_failed',
         'Broker account sync failed',
         undefined,
         error.message,
         { accountId, broker: account?.broker, error: error.message }
       );
    },
  });

  // Delete Account Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }
      return response.json();
    },
    onSuccess: (data, accountId) => {
      toast({
        title: 'Account Deleted',
        description: 'Broker account has been removed successfully',
      });
      refetchAccounts();
      
             const account = accounts.find((acc: TradingAccount) => acc.id === accountId);
       logToAgentMemory(
         userId,
         'broker_account_deleted',
         'User deleted a broker account',
         undefined,
         `Deleted ${account?.broker} account ${account?.name}`,
         { accountId, broker: account?.broker }
       );
    },
    onError: (error) => {
      toast({
        title: 'Failed to Delete Account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reset add dialog state
  const resetAddDialog = () => {
    setShowAddDialog(false);
    setSelectedBroker('');
    setBrokerCredentials({});
    setAccountName('');
    setShowCredentials({});
  };

  // Handle broker selection
  const handleBrokerSelect = (brokerId: string) => {
    setSelectedBroker(brokerId);
    setBrokerCredentials({});
    setAccountName(`My ${BROKER_CONFIGS[brokerId as keyof typeof BROKER_CONFIGS]?.name} Account`);
  };

  // Handle credential input
  const handleCredentialChange = (field: string, value: string) => {
    setBrokerCredentials(prev => ({ ...prev, [field]: value }));
  };

  // Toggle credential visibility
  const toggleCredentialVisibility = (field: string) => {
    setShowCredentials(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Handle add account submission
  const handleAddAccount = () => {
    if (!selectedBroker || !accountName) {
      toast({
        title: 'Missing Information',
        description: 'Please select a broker and enter an account name',
        variant: 'destructive',
      });
      return;
    }

    const brokerConfig = BROKER_CONFIGS[selectedBroker as keyof typeof BROKER_CONFIGS];
    const requiredFields = brokerConfig.fields.filter(field => field.required);
    
    for (const field of requiredFields) {
      if (!brokerCredentials[field.key]) {
        toast({
          title: 'Missing Credentials',
          description: `Please enter ${field.label}`,
          variant: 'destructive',
        });
        return;
      }
    }

    const accountData = {
      name: accountName,
      broker: selectedBroker.toUpperCase(),
      ...brokerCredentials,
      isActive: true,
    };

    addAccountMutation.mutate(accountData);
  };

  // Get connection status badge
  const getConnectionStatusBadge = (status?: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'ERROR':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'DISCONNECTED':
        return <Badge variant="secondary"><Unlink className="w-3 h-3 mr-1" />Disconnected</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const accounts = accountsData || [];
  const brokerTypes = brokerTypesData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Broker API Sync</h2>
          <p className="text-muted-foreground">
            Connect and manage your broker accounts for automated portfolio syncing
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Broker
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Broker Account</DialogTitle>
              <DialogDescription>
                Connect a new broker account for automated portfolio syncing
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Broker Selection */}
              <div className="space-y-2">
                <Label>Select Broker</Label>
                <Select value={selectedBroker} onValueChange={handleBrokerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a broker" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BROKER_CONFIGS).map(([id, config]) => (
                      <SelectItem key={id} value={id}>
                        {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account Name */}
              {selectedBroker && (
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="My Trading Account"
                  />
                </div>
              )}

              {/* Broker-specific fields */}
              {selectedBroker && BROKER_CONFIGS[selectedBroker as keyof typeof BROKER_CONFIGS] && (
                <>
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertTitle>Setup Instructions</AlertTitle>
                    <AlertDescription>
                      {BROKER_CONFIGS[selectedBroker as keyof typeof BROKER_CONFIGS].instructions}
                    </AlertDescription>
                  </Alert>
                  
                  {BROKER_CONFIGS[selectedBroker as keyof typeof BROKER_CONFIGS].fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          type={field.type === 'password' && !showCredentials[field.key] ? 'password' : 'text'}
                          value={brokerCredentials[field.key] || ''}
                          onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                        {field.type === 'password' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => toggleCredentialVisibility(field.key)}
                          >
                            {showCredentials[field.key] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetAddDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddAccount}
                disabled={!selectedBroker || !accountName || addAccountMutation.isPending}
              >
                {addAccountMutation.isPending && (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                )}
                Add Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts ({accounts.length})</CardTitle>
          <CardDescription>
            Manage your connected broker accounts and sync status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAccounts ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No broker accounts connected. Add a broker account to start syncing your portfolio.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Broker</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account: TradingAccount) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.name}
                      {account.isActive && (
                        <Badge variant="outline" className="ml-2">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{account.broker}</Badge>
                    </TableCell>
                    <TableCell>
                      {getConnectionStatusBadge(account.connectionStatus)}
                    </TableCell>
                    <TableCell className="text-right">
                      {account.balance !== null && account.balance !== undefined ? (
                        `${account.currency || 'USD'} ${account.balance.toLocaleString()}`
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {account.lastSynced ? (
                        new Date(account.lastSynced).toLocaleDateString()
                      ) : (
                        'Never'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncAccountMutation.mutate(account.id)}
                          disabled={syncAccountMutation.isPending}
                        >
                          <RefreshCw className={`w-4 h-4 ${syncAccountMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAccountMutation.mutate(account.id)}
                          disabled={deleteAccountMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sync Status Summary */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                                 <div className="text-2xl font-bold text-green-600">
                   {accounts.filter((acc: TradingAccount) => acc.connectionStatus === 'CONNECTED').length}
                 </div>
                 <div className="text-sm text-muted-foreground">Connected</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-red-600">
                   {accounts.filter((acc: TradingAccount) => acc.connectionStatus === 'ERROR').length}
                 </div>
                 <div className="text-sm text-muted-foreground">Errors</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-blue-600">
                   {accounts.filter((acc: TradingAccount) => acc.lastSynced && 
                     new Date(acc.lastSynced).getTime() > Date.now() - 24 * 60 * 60 * 1000
                   ).length}
                 </div>
                 <div className="text-sm text-muted-foreground">Synced Today</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold">
                   {accounts.reduce((sum: number, acc: TradingAccount) => sum + (acc.balance || 0), 0).toLocaleString()}
                 </div>
                <div className="text-sm text-muted-foreground">Total Balance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 