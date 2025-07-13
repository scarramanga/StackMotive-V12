import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useSessionStore } from '../store/session';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, RefreshCw, Shield, Trash2, PlusCircle, KeyRound, Users, Settings, CreditCard, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Form schema for adding/editing a trading account
const accountFormSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  broker: z.string().min(1, "Broker is required"),
  accountNumber: z.string().optional(),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
  apiPassphrase: z.string().optional(),
  isActive: z.boolean().default(true),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AdminUser {
  id: number;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
  preferredCurrency: string;
  createdAt: string;
}

interface AccountSettings {
  maxUsers: number;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  defaultCurrency: string;
  maintenanceMode: boolean;
}

export default function AccountManagementPage() {
  const { user } = useSessionStore();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [connectingAccountId, setConnectingAccountId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("accounts");

  // Fetch trading accounts
  const { 
    data: tradingAccounts = [], 
    isLoading: isLoadingAccounts,
    error: accountsError,
    refetch: refetchAccounts
  } = useQuery({
    queryKey: ['/api/trading-accounts'],
    enabled: !!user,
  });

  // Fetch all users (admin only)
  const { 
    data: allUsers = [], 
    isLoading: isLoadingUsers,
    refetch: refetchUsers
  } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.isAdmin,
    staleTime: 60000
  });

  // Fetch account settings
  const { 
    data: accountSettings,
    isLoading: isLoadingSettings
  } = useQuery<AccountSettings>({
    queryKey: ['/api/admin/settings'],
    enabled: !!user && user.isAdmin,
    staleTime: 300000 // 5 minutes
  });

  // Create a new trading account
  const createAccount = useMutation({
    mutationFn: async (values: AccountFormValues) => {
      const response = await apiRequest("POST", "/api/trading-accounts", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-accounts'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Account Added",
        description: "Your trading account has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Account",
        description: error.message || "Failed to add trading account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete a trading account
  const deleteAccount = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/user/account');
    },
    onSuccess: () => {
      toast({
        title: 'Account Deleted',
        description: 'Your account has been deleted successfully.',
      });
      // Redirect to login or home page
    },
  });

  // Connect to a broker
  const connectBroker = useMutation({
    mutationFn: async (accountId: number) => {
      setConnectingAccountId(accountId);
      const response = await apiRequest("POST", `/api/broker/connect/${accountId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-accounts'] });
      toast({
        title: "Connection Successful",
        description: "Successfully connected to broker. Your portfolio data is now accessible.",
      });
      setConnectingAccountId(null);
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to broker. Please check your credentials and try again.",
        variant: "destructive",
      });
      setConnectingAccountId(null);
    },
  });

  // Disconnect from a broker
  const disconnectBroker = useMutation({
    mutationFn: async (accountId: number) => {
      const response = await apiRequest("POST", `/api/broker/disconnect/${accountId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-accounts'] });
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from broker.",
      });
    },
    onError: () => {
      toast({
        title: "Error Disconnecting",
        description: "Failed to disconnect from broker. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle user admin status
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      return apiRequest('POST', `/api/admin/users/${userId}/toggle-admin`, { isAdmin });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User admin status updated successfully",
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update user admin status",
        variant: "destructive",
      });
    }
  });

  // Reset user onboarding
  const resetOnboardingMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('POST', `/api/admin/users/${userId}/reset-onboarding`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User onboarding reset successfully",
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to reset user onboarding",
        variant: "destructive",
      });
    }
  });

  // Deactivate user
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('POST', `/api/admin/users/${userId}/deactivate`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deactivated successfully",
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to deactivate user",
        variant: "destructive",
      });
    }
  });

  // Account form
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      broker: "",
      accountNumber: "",
      apiKey: "",
      apiSecret: "",
      apiPassphrase: "",
      isActive: true,
    },
  });

  // Handle form submission
  const onSubmit = (values: AccountFormValues) => {
    createAccount.mutate(values);
  };

  // Handle broker type change in form
  const handleBrokerChange = (value: string) => {
    form.setValue("broker", value);
    // Reset passphrase field when changing broker
    if (value.toLowerCase() !== "kucoin") {
      form.setValue("apiPassphrase", "");
    }
  };

  // Render connection status badge
  const renderConnectionStatus = (status: string | null) => {
    if (!status) return <Badge variant="outline">Not Connected</Badge>;
    
    switch (status) {
      case 'CONNECTED':
        return <Badge variant="success" className="bg-green-500">Connected</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      case 'DISCONNECTED':
        return <Badge variant="outline">Disconnected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOnboardingStatus = (user: AdminUser) => {
    if (user.hasCompletedOnboarding) {
      return <Badge variant="default">Completed</Badge>;
    }
    return <Badge variant="secondary">Step {user.onboardingStep}/4</Badge>;
  };

  // Loading state
  if (!user) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="mb-4">Please log in to manage your trading accounts.</p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="container mx-auto py-6 space-y-8 max-w-5xl">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Trading Accounts</TabsTrigger>
          <TabsTrigger value="security">Security & Access</TabsTrigger>
        </TabsList>
        
        {/* ACCOUNTS TAB */}
        <TabsContent value="accounts" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Trading Accounts</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/trading-accounts/kucoin-env', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: 'My KuCoin Account' })
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.message || 'Failed to create KuCoin account');
                    }
                    
                    await queryClient.invalidateQueries({ queryKey: ['/api/trading-accounts'] });
                    
                    toast({
                      title: "KuCoin Account Created",
                      description: "Your KuCoin account has been created with your API credentials",
                    });
                  } catch (error: any) {
                    toast({
                      title: "Error Creating KuCoin Account",
                      description: error.message || "An error occurred",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Use My KuCoin API
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                      <DialogHeader>
                        <DialogTitle>Add Trading Account</DialogTitle>
                        <DialogDescription>
                          Connect to your brokerage or exchange. Your API credentials are encrypted and stored securely.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Name</FormLabel>
                              <FormControl>
                                <Input placeholder="My IBKR Account" {...field} />
                              </FormControl>
                              <FormDescription>
                                A friendly name to identify this account
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="broker"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Broker/Exchange</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={handleBrokerChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select broker/exchange" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="IBKR">Interactive Brokers</SelectItem>
                                  <SelectItem value="TIGER">Tiger Brokers</SelectItem>
                                  <SelectItem value="KUCOIN">KuCoin</SelectItem>
                                  <SelectItem value="KRAKEN">Kraken</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select your brokerage or cryptocurrency exchange
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="accountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Number (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Your account number" {...field} />
                              </FormControl>
                              <FormDescription>
                                Required for some brokers like IBKR
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="apiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Key</FormLabel>
                              <FormControl>
                                <Input placeholder="Your API key" {...field} />
                              </FormControl>
                              <FormDescription>
                                Available in your broker's API settings
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="apiSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Secret</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Your API secret" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Keep this secret secure
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {form.watch("broker").toLowerCase() === "kucoin" && (
                          <FormField
                            control={form.control}
                            name="apiPassphrase"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Passphrase</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="KuCoin API passphrase" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Required for KuCoin accounts
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Set as Active Account
                                </FormLabel>
                                <FormDescription>
                                  This will be used as the default account for trading
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createAccount.isPending}>
                          {createAccount.isPending ? "Adding..." : "Add Account"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {isLoadingAccounts ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : accountsError ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-medium">Failed to load accounts</h3>
                <p className="text-sm text-muted-foreground mt-1">Please refresh and try again.</p>
                <Button className="mt-4" onClick={() => refetchAccounts()}>Retry</Button>
              </CardContent>
            </Card>
          ) : tradingAccounts.length === 0 ? (
            <Card className="border-dashed border-2 border-primary/20">
              <CardContent className="pt-6 text-center">
                <h3 className="text-lg font-medium mb-2">No Trading Accounts Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your brokerage or exchange accounts to start trading.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {tradingAccounts.map((account: any) => (
                <Card key={account.id} className={account.isActive ? "border-primary" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{account.name}</CardTitle>
                        <CardDescription>{account.broker}</CardDescription>
                      </div>
                      {account.isActive && (
                        <Badge variant="outline" className="bg-primary/10 text-primary">Active</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Connection Status</Label>
                        {renderConnectionStatus(account.connectionStatus)}
                      </div>
                      {account.balance && (
                        <div className="flex justify-between items-center">
                          <Label>Balance</Label>
                          <span className="font-medium">{account.balance} {account.currency}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <Label>Last Synced</Label>
                        <span className="text-sm text-muted-foreground">
                          {account.lastSynced 
                            ? new Date(account.lastSynced).toLocaleString() 
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {account.connectionStatus === 'CONNECTED' ? (
                      <Button 
                        variant="outline" 
                        onClick={() => disconnectBroker.mutate(account.id)}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => connectBroker.mutate(account.id)}
                        disabled={connectingAccountId === account.id}
                      >
                        {connectingAccountId === account.id ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                            Connecting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this trading account?')) {
                          deleteAccount.mutate(account.id);
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          <Alert className="mt-6">
            <Shield className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              Your API credentials are encrypted and stored securely. We never store your API secrets in plain text.
              For added security, use API keys with read-only access if your broker supports it.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Manage your account security settings and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="2fa">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Enhance your account security by enabling 2FA
                    </p>
                  </div>
                  <Switch id="2fa" disabled />
                </div>
                <p className="text-sm text-muted-foreground">
                  Coming soon: Set up two-factor authentication for an additional layer of security
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="api-access">API Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Create and manage API keys for programmatic access
                    </p>
                  </div>
                  <Switch id="api-access" disabled />
                </div>
                <p className="text-sm text-muted-foreground">
                  Coming soon: Generate and manage API keys for external tools and services
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
              <CardDescription>
                View and manage your active sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        {navigator.userAgent}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Started: {new Date().toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
    </div>
  );
}