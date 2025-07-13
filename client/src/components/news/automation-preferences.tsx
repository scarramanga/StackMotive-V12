import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Settings, Bell, Bot, Shield, Sliders, Clock, BarChart } from 'lucide-react';

// Define the form schema
const automationFormSchema = z.object({
  strategyId: z.union([z.number().nullable(), z.string()]).optional(),
  symbol: z.string().optional(),
  automationLevel: z.enum(['notification', 'semi', 'full']),
  notificationChannels: z.array(z.string()),
  minSignalStrength: z.union([z.number().min(0).max(1), z.string()]),
  maxTradeAmount: z.union([z.number().min(0), z.string()]).optional(),
  cooldownPeriod: z.union([z.number().min(0), z.string()]).optional(),
  activeHours: z.record(z.boolean()).optional(),
});

type AutomationFormValues = z.infer<typeof automationFormSchema>;

interface AutomationPreferencesProps {
  userId: number;
  defaultStrategyId?: number;
  defaultSymbol?: string;
  onUpdate?: () => void;
}

export default function AutomationPreferences({
  userId,
  defaultStrategyId,
  defaultSymbol,
  onUpdate,
}: AutomationPreferencesProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get strategies for the dropdown
  const { data: strategies = [] } = useQuery({
    queryKey: ['/api/strategy/strategies'],
    enabled: open,
  });
  
  // Get existing automation preferences
  const { data: preferences = [], isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['/api/automation-preferences', userId],
    enabled: open,
  });
  
  // Find matching preference if it exists
  const matchingPreference = preferences.find((pref: any) => {
    if (defaultStrategyId && defaultSymbol) {
      return pref.strategyId === defaultStrategyId && pref.symbol === defaultSymbol;
    } else if (defaultStrategyId) {
      return pref.strategyId === defaultStrategyId && !pref.symbol;
    } else if (defaultSymbol) {
      return !pref.strategyId && pref.symbol === defaultSymbol;
    }
    return !pref.strategyId && !pref.symbol; // Global default
  });
  
  // Create automation preferences form
  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(automationFormSchema),
    defaultValues: {
      strategyId: defaultStrategyId?.toString() || 'all',
      symbol: defaultSymbol || '',
      automationLevel: 'notification',
      notificationChannels: ['in-app'],
      minSignalStrength: 0.7,
      maxTradeAmount: 1000,
      cooldownPeriod: 60, // minutes
      activeHours: {
        '0': false, // Sunday
        '1': true,
        '2': true,
        '3': true,
        '4': true,
        '5': true,
        '6': false, // Saturday
      },
    },
  });
  
  // Update form when matching preference is found
  useEffect(() => {
    if (matchingPreference) {
      form.reset({
        strategyId: matchingPreference.strategyId?.toString() || 'all',
        symbol: matchingPreference.symbol || '',
        automationLevel: matchingPreference.automationLevel,
        notificationChannels: matchingPreference.notificationChannels || ['in-app'],
        minSignalStrength: matchingPreference.minSignalStrength,
        maxTradeAmount: matchingPreference.maxTradeAmount,
        cooldownPeriod: matchingPreference.cooldownPeriod,
        activeHours: matchingPreference.activeHours || {
          '0': false, // Sunday
          '1': true,
          '2': true,
          '3': true,
          '4': true,
          '5': true,
          '6': false, // Saturday
        },
      });
    }
  }, [matchingPreference, form]);
  
  // Save automation preferences mutation
  const savePreferences = useMutation({
    mutationFn: async (values: AutomationFormValues) => {
      const data = {
        ...values,
        userId,
        strategyId: values.strategyId && values.strategyId !== 'all' ? parseInt(values.strategyId.toString()) : null,
      };
      
      const response = matchingPreference
        ? await apiRequest('PUT', `/api/automation-preferences/${matchingPreference.id}`, data)
        : await apiRequest('POST', '/api/automation-preferences', data);
        
      if (!response.ok) {
        throw new Error('Failed to save automation preferences');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation-preferences'] });
      toast({
        title: 'Preferences Saved',
        description: 'Your automation preferences have been updated.',
      });
      if (onUpdate) onUpdate();
      setOpen(false);
    },
    onError: () => {
      toast({
        title: 'Save Failed',
        description: 'Failed to save automation preferences.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  function onSubmit(values: AutomationFormValues) {
    savePreferences.mutate(values);
  }
  
  // Format the automation level for display
  const formatAutomationLevel = (level: string) => {
    switch (level) {
      case 'notification':
        return 'Notifications Only';
      case 'semi':
        return 'Semi-Automated';
      case 'full':
        return 'Fully Automated';
      default:
        return level;
    }
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings size={16} />
            <span>Automation Settings</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trading Automation Preferences</DialogTitle>
            <DialogDescription>
              Configure how the system should act on news sentiment and technical signals
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                {/* General Settings */}
                <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="strategyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strategy (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value?.toString() || 'all'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Apply to all strategies" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">Apply to all strategies</SelectItem>
                              {strategies.map((strategy: any) => (
                                <SelectItem key={strategy.id} value={strategy.id.toString()}>
                                  {strategy.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select a specific strategy or leave blank for global settings
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symbol (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., AAPL, BTC"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter a specific symbol or leave blank for all symbols
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="automationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Automation Level</FormLabel>
                        <FormDescription className="mt-1 mb-3">
                          Choose how automated you want the trading actions to be
                        </FormDescription>
                        <div className="grid grid-cols-3 gap-4">
                          <div 
                            className={`border rounded-lg p-4 cursor-pointer ${
                              field.value === 'notification' ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                            onClick={() => field.onChange('notification')}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Bell className="h-6 w-6 text-blue-500" />
                              <div className={field.value === 'notification' ? 'w-3 h-3 rounded-full bg-primary' : ''}></div>
                            </div>
                            <h4 className="font-medium mb-1">Notifications Only</h4>
                            <p className="text-sm text-muted-foreground">
                              Receive alerts but execute trades manually
                            </p>
                          </div>
                          
                          <div 
                            className={`border rounded-lg p-4 cursor-pointer ${
                              field.value === 'semi' ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                            onClick={() => field.onChange('semi')}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Shield className="h-6 w-6 text-yellow-500" />
                              <div className={field.value === 'semi' ? 'w-3 h-3 rounded-full bg-primary' : ''}></div>
                            </div>
                            <h4 className="font-medium mb-1">Semi-Automated</h4>
                            <p className="text-sm text-muted-foreground">
                              Prepare orders but require manual confirmation
                            </p>
                          </div>
                          
                          <div 
                            className={`border rounded-lg p-4 cursor-pointer ${
                              field.value === 'full' ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                            onClick={() => field.onChange('full')}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Bot className="h-6 w-6 text-green-500" />
                              <div className={field.value === 'full' ? 'w-3 h-3 rounded-full bg-primary' : ''}></div>
                            </div>
                            <h4 className="font-medium mb-1">Fully Automated</h4>
                            <p className="text-sm text-muted-foreground">
                              Execute trades automatically based on signals
                            </p>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="notificationChannels"
                    render={() => (
                      <FormItem>
                        <FormLabel>Notification Channels</FormLabel>
                        <FormDescription className="mt-1 mb-3">
                          Select where you want to receive notifications
                        </FormDescription>
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="notificationChannels"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('in-app')}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, 'in-app']);
                                      } else {
                                        field.onChange(current.filter(v => v !== 'in-app'));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="cursor-pointer font-normal">
                                  In-app notifications
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="notificationChannels"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('email')}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, 'email']);
                                      } else {
                                        field.onChange(current.filter(v => v !== 'email'));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="cursor-pointer font-normal">
                                  Email alerts
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="notificationChannels"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('sms')}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, 'sms']);
                                      } else {
                                        field.onChange(current.filter(v => v !== 'sms'));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="cursor-pointer font-normal">
                                  SMS text messages
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="notificationChannels"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('push')}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, 'push']);
                                      } else {
                                        field.onChange(current.filter(v => v !== 'push'));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="cursor-pointer font-normal">
                                  Mobile push notifications
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                  <FormField
                    control={form.control}
                    name="minSignalStrength"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Minimum Signal Strength</FormLabel>
                          <Badge variant="outline">
                            {typeof field.value === 'string' 
                              ? parseFloat(field.value).toFixed(2) 
                              : field.value.toFixed(2)}
                          </Badge>
                        </div>
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={[typeof field.value === 'string' ? parseFloat(field.value) : field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="mt-2"
                          />
                        </FormControl>
                        <FormDescription>
                          Only notify or execute trades when the sentiment signal is at least this strong
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                {/* Advanced Settings */}
                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="maxTradeAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Trade Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="1000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || '')}
                            value={field.value?.toString() || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum amount to trade on a single signal (in your account's base currency)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cooldownPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cooldown Period (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="60"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                            value={field.value?.toString() || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum time between automated trades for the same symbol
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savePreferences.isPending}>
                  {savePreferences.isPending ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></span>
                      Saving...
                    </>
                  ) : 'Save Preferences'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Current Preferences Display */}
      {matchingPreference && (
        <Card className="mt-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Current Automation Settings</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setOpen(true)}
              >
                <Sliders size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Mode:</span>
                <Badge variant="outline" className="ml-auto">
                  {formatAutomationLevel(matchingPreference.automationLevel)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <BarChart size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Min. Signal:</span>
                <Badge variant="outline" className="ml-auto">
                  {matchingPreference.minSignalStrength.toFixed(2)}
                </Badge>
              </div>
              
              {matchingPreference.maxTradeAmount && (
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Max Amount:</span>
                  <Badge variant="outline" className="ml-auto">
                    ${matchingPreference.maxTradeAmount}
                  </Badge>
                </div>
              )}
              
              {matchingPreference.cooldownPeriod && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Cooldown:</span>
                  <Badge variant="outline" className="ml-auto">
                    {matchingPreference.cooldownPeriod} min
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}