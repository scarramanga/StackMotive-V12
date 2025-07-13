import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash, 
  Settings, 
  AlertCircle, 
  ArrowRight 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Enums for indicators and conditions
enum IndicatorType {
  RSI = 'RSI',
  MA = 'MA',
  EMA = 'EMA',
  MACD = 'MACD',
  BOLLINGER = 'BOLLINGER',
  VOLUME = 'VOLUME',
  PRICE = 'PRICE',
}

enum ConditionOperator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  EQUAL = '=',
  CROSSES_ABOVE = 'CROSSES_ABOVE',
  CROSSES_BELOW = 'CROSSES_BELOW',
}

interface StrategyBuilderProps {
  defaultStrategy?: any;
  onSave?: (strategy: any) => void;
  tradingAccounts?: any[];
}

// Strategy form schema
const strategySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  description: z.string().optional(),
  symbol: z.string().min(1, "Symbol is required"),
  exchange: z.string().min(1, "Exchange is required"),
  accountId: z.preprocess(
    (val) => (val === "" ? undefined : parseInt(val as string)),
    z.number().optional()
  ),
  riskPercentage: z.preprocess(
    (val) => (val === "" ? undefined : parseFloat(val as string)),
    z.number().min(0, "Risk must be 0 or positive").max(100, "Risk cannot exceed 100%").optional()
  ),
  status: z.enum(["active", "inactive", "testing"]).default("inactive"),
});

type StrategyFormValues = z.infer<typeof strategySchema>;

/**
 * Strategy Builder component for creating and editing trading strategies
 */
export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  defaultStrategy,
  onSave,
  tradingAccounts = []
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [indicators, setIndicators] = useState<any[]>(defaultStrategy?.indicators || []);
  const [entryConditions, setEntryConditions] = useState<any[]>(defaultStrategy?.entryConditions || []);
  const [exitConditions, setExitConditions] = useState<any[]>(defaultStrategy?.exitConditions || []);
  const [showIndicatorDialog, setShowIndicatorDialog] = useState(false);
  const [showConditionDialog, setShowConditionDialog] = useState(false);
  const [editingConditionType, setEditingConditionType] = useState<'entry' | 'exit'>('entry');
  
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategySchema),
    defaultValues: defaultStrategy || {
      name: '',
      description: '',
      symbol: '',
      exchange: '',
      accountId: undefined,
      riskPercentage: 1,
      status: 'inactive',
    }
  });
  
  // Submit handler
  const onSubmit = async (values: StrategyFormValues) => {
    if (indicators.length === 0) {
      toast({
        title: 'Missing indicators',
        description: 'Please add at least one indicator to your strategy',
        variant: 'destructive',
      });
      setActiveTab('indicators');
      return;
    }
    
    if (entryConditions.length === 0) {
      toast({
        title: 'Missing entry conditions',
        description: 'Please add at least one entry condition to your strategy',
        variant: 'destructive',
      });
      setActiveTab('conditions');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const strategyData = {
        ...values,
        indicators,
        entryConditions,
        exitConditions,
      };
      
      // Create or update strategy
      const apiUrl = defaultStrategy 
        ? `/api/strategy/strategies/${defaultStrategy.id}` 
        : '/api/strategy/strategies';
      
      const response = await apiRequest(
        defaultStrategy ? 'PUT' : 'POST',
        apiUrl,
        strategyData
      );

      console.log('Strategy saved successfully:', response);
      
      // Invalidate React Query cache for strategies
      queryClient.invalidateQueries({ queryKey: ['/api/strategy/strategies'] });
      
      // Callback if provided
      if (onSave) {
        onSave(strategyData);
      }
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast({
        title: 'Error saving strategy',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle adding a new indicator
  const handleAddIndicator = (indicatorData: any) => {
    setIndicators([...indicators, indicatorData]);
    setShowIndicatorDialog(false);
  };
  
  // Handle removing an indicator
  const handleRemoveIndicator = (index: number) => {
    setIndicators(indicators.filter((_, i) => i !== index));
  };
  
  // Handle adding a condition
  const handleAddCondition = (conditionData: any) => {
    if (editingConditionType === 'entry') {
      setEntryConditions([...entryConditions, conditionData]);
    } else {
      setExitConditions([...exitConditions, conditionData]);
    }
    setShowConditionDialog(false);
  };
  
  // Handle removing a condition
  const handleRemoveCondition = (type: 'entry' | 'exit', index: number) => {
    if (type === 'entry') {
      setEntryConditions(entryConditions.filter((_, i) => i !== index));
    } else {
      setExitConditions(exitConditions.filter((_, i) => i !== index));
    }
  };
  
  // Render indicator card
  const renderIndicator = (indicator: any, index: number) => {
    return (
      <div key={`indicator-${index}`} className="mb-2 border rounded-md p-3 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="font-medium">{indicator.type}</div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleRemoveIndicator(index)}
          >
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {indicator.type === IndicatorType.RSI && `Period: ${indicator.period}`}
          {indicator.type === IndicatorType.MA && `Type: Simple, Period: ${indicator.period}`}
          {indicator.type === IndicatorType.EMA && `Period: ${indicator.period}`}
          {indicator.type === IndicatorType.MACD && `Fast: ${indicator.fastPeriod}, Slow: ${indicator.slowPeriod}, Signal: ${indicator.signalPeriod}`}
          {indicator.type === IndicatorType.BOLLINGER && `Period: ${indicator.period}, Deviations: ${indicator.deviations}`}
        </div>
      </div>
    );
  };
  
  // Render condition card
  const renderCondition = (condition: any, index: number, type: 'entry' | 'exit') => {
    return (
      <div key={`${type}-condition-${index}`} className="mb-2 border rounded-md p-3 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="font-medium">
            {condition.indicator} {condition.operator} {condition.value}
            {condition.compareIndicator && (
              <span> {condition.compareIndicator}</span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleRemoveCondition(type, index)}
          >
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    );
  };
  
  // Indicator selector dialog
  const IndicatorDialog = () => {
    const [selectedType, setSelectedType] = useState<IndicatorType>(IndicatorType.RSI);
    const [period, setPeriod] = useState<number>(14);
    const [fastPeriod, setFastPeriod] = useState<number>(12);
    const [slowPeriod, setSlowPeriod] = useState<number>(26);
    const [signalPeriod, setSignalPeriod] = useState<number>(9);
    const [deviations, setDeviations] = useState<number>(2);
    
    const handleSaveIndicator = () => {
      let indicatorData: any = { type: selectedType };
      
      switch (selectedType) {
        case IndicatorType.RSI:
        case IndicatorType.MA:
        case IndicatorType.EMA:
          indicatorData.period = period;
          break;
        case IndicatorType.MACD:
          indicatorData.fastPeriod = fastPeriod;
          indicatorData.slowPeriod = slowPeriod;
          indicatorData.signalPeriod = signalPeriod;
          break;
        case IndicatorType.BOLLINGER:
          indicatorData.period = period;
          indicatorData.deviations = deviations;
          break;
      }
      
      handleAddIndicator(indicatorData);
    };
    
    return (
      <Dialog open={showIndicatorDialog} onOpenChange={setShowIndicatorDialog}>
        <DialogContent>
          <DialogTitle>Add Indicator</DialogTitle>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FormLabel>Indicator Type</FormLabel>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as IndicatorType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select indicator type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IndicatorType.RSI}>RSI (Relative Strength Index)</SelectItem>
                  <SelectItem value={IndicatorType.MA}>MA (Moving Average)</SelectItem>
                  <SelectItem value={IndicatorType.EMA}>EMA (Exponential Moving Average)</SelectItem>
                  <SelectItem value={IndicatorType.MACD}>MACD (Moving Average Convergence Divergence)</SelectItem>
                  <SelectItem value={IndicatorType.BOLLINGER}>Bollinger Bands</SelectItem>
                  <SelectItem value={IndicatorType.VOLUME}>Volume</SelectItem>
                  <SelectItem value={IndicatorType.PRICE}>Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* RSI, MA, EMA, Bollinger Bands Parameters */}
            {(selectedType === IndicatorType.RSI || 
              selectedType === IndicatorType.MA || 
              selectedType === IndicatorType.EMA ||
              selectedType === IndicatorType.BOLLINGER) && (
              <div className="space-y-2">
                <FormLabel>Period</FormLabel>
                <Input 
                  type="number" 
                  value={period} 
                  onChange={(e) => setPeriod(parseInt(e.target.value))} 
                  min={1}
                />
              </div>
            )}
            
            {/* Bollinger Bands Deviations */}
            {selectedType === IndicatorType.BOLLINGER && (
              <div className="space-y-2">
                <FormLabel>Standard Deviations</FormLabel>
                <Input 
                  type="number" 
                  value={deviations} 
                  onChange={(e) => setDeviations(parseFloat(e.target.value))} 
                  min={0.1}
                  step={0.1}
                />
              </div>
            )}
            
            {/* MACD Parameters */}
            {selectedType === IndicatorType.MACD && (
              <>
                <div className="space-y-2">
                  <FormLabel>Fast Period</FormLabel>
                  <Input 
                    type="number" 
                    value={fastPeriod} 
                    onChange={(e) => setFastPeriod(parseInt(e.target.value))} 
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>Slow Period</FormLabel>
                  <Input 
                    type="number" 
                    value={slowPeriod} 
                    onChange={(e) => setSlowPeriod(parseInt(e.target.value))} 
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>Signal Period</FormLabel>
                  <Input 
                    type="number" 
                    value={signalPeriod} 
                    onChange={(e) => setSignalPeriod(parseInt(e.target.value))} 
                    min={1}
                  />
                </div>
              </>
            )}
            
            <Button onClick={handleSaveIndicator} className="w-full">
              Add Indicator
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Condition dialog
  const ConditionDialog = () => {
    const [indicator, setIndicator] = useState<string>('');
    const [operator, setOperator] = useState<ConditionOperator>(ConditionOperator.GREATER_THAN);
    const [value, setValue] = useState<string>('');
    const [compareToIndicator, setCompareToIndicator] = useState<boolean>(false);
    const [compareIndicator, setCompareIndicator] = useState<string>('');
    
    const handleSaveCondition = () => {
      const conditionData = {
        indicator,
        operator,
        value: compareToIndicator ? undefined : value,
        compareIndicator: compareToIndicator ? compareIndicator : undefined,
      };
      
      handleAddCondition(conditionData);
    };
    
    return (
      <Dialog open={showConditionDialog} onOpenChange={setShowConditionDialog}>
        <DialogContent>
          <DialogTitle>
            Add {editingConditionType === 'entry' ? 'Entry' : 'Exit'} Condition
          </DialogTitle>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FormLabel>If</FormLabel>
              <Select value={indicator} onValueChange={setIndicator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select indicator" />
                </SelectTrigger>
                <SelectContent>
                  {indicators.map((ind, i) => (
                    <SelectItem key={i} value={ind.type}>
                      {ind.type}
                    </SelectItem>
                  ))}
                  <SelectItem value="PRICE">Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <FormLabel>Operator</FormLabel>
              <Select 
                value={operator} 
                onValueChange={(value) => setOperator(value as ConditionOperator)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ConditionOperator.GREATER_THAN}>Greater Than (&gt;)</SelectItem>
                  <SelectItem value={ConditionOperator.LESS_THAN}>Less Than (&lt;)</SelectItem>
                  <SelectItem value={ConditionOperator.EQUAL}>Equal (=)</SelectItem>
                  <SelectItem value={ConditionOperator.CROSSES_ABOVE}>Crosses Above</SelectItem>
                  <SelectItem value={ConditionOperator.CROSSES_BELOW}>Crosses Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Compare to</FormLabel>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Value</span>
                  <Switch
                    checked={compareToIndicator}
                    onCheckedChange={setCompareToIndicator}
                  />
                  <span className="text-sm">Indicator</span>
                </div>
              </div>
              
              {compareToIndicator ? (
                <Select value={compareIndicator} onValueChange={setCompareIndicator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select indicator" />
                  </SelectTrigger>
                  <SelectContent>
                    {indicators.map((ind, i) => (
                      <SelectItem key={i} value={ind.type}>
                        {ind.type}
                      </SelectItem>
                    ))}
                    <SelectItem value="PRICE">Price</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Value"
                />
              )}
            </div>
            
            <Button onClick={handleSaveCondition} className="w-full">
              Add Condition
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{defaultStrategy?.id ? 'Edit' : 'Create'} Strategy</CardTitle>
        <CardDescription>
          Build a trading strategy with technical indicators and entry/exit conditions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Form {...form}>
              <form className="space-y-4 py-4">
                {/* Strategy name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strategy Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Trading Strategy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your strategy..." 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Symbol */}
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="AAPL, BTC-USD, etc." {...field} />
                      </FormControl>
                      <FormDescription>
                        The asset this strategy will trade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Exchange */}
                <FormField
                  control={form.control}
                  name="exchange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exchange</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select exchange" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="IBKR">Interactive Brokers</SelectItem>
                          <SelectItem value="TIGER">Tiger Brokers</SelectItem>
                          <SelectItem value="KUCOIN">KuCoin</SelectItem>
                          <SelectItem value="KRAKEN">Kraken</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Trading Account */}
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Account</FormLabel>
                      <Select 
                        value={field.value ? field.value.toString() : ''} 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : '')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trading account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tradingAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.name} ({account.broker})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The account that will execute this strategy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Risk % per trade */}
                <FormField
                  control={form.control}
                  name="riskPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Percentage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1.0" 
                          min="0" 
                          max="100" 
                          step="0.1" 
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum percentage of account to risk per trade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active (Live Trading)</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="testing">Paper Trading / Testing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Active strategies will execute real trades
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="indicators">
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Technical Indicators</h3>
                <Button onClick={() => setShowIndicatorDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Indicator
                </Button>
              </div>
              
              <div className="space-y-2">
                {indicators.length > 0 ? (
                  indicators.map((indicator, index) => renderIndicator(indicator, index))
                ) : (
                  <div className="p-4 text-center text-gray-500 border rounded-md">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                    <p>No indicators added yet.</p>
                    <p className="text-sm">Add indicators to build your strategy.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="conditions">
            <div className="space-y-6 py-4">
              {/* Entry Conditions */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Entry Conditions</h3>
                  <Button 
                    onClick={() => {
                      setEditingConditionType('entry');
                      setShowConditionDialog(true);
                    }}
                    disabled={indicators.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry Rule
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {entryConditions.length > 0 ? (
                    entryConditions.map((condition, index) => 
                      renderCondition(condition, index, 'entry')
                    )
                  ) : (
                    <div className="p-4 text-center text-gray-500 border rounded-md">
                      <ArrowRight className="h-6 w-6 mx-auto mb-2" />
                      <p>No entry conditions defined.</p>
                      <p className="text-sm">Define when to enter trades.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Exit Conditions */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Exit Conditions</h3>
                  <Button 
                    onClick={() => {
                      setEditingConditionType('exit');
                      setShowConditionDialog(true);
                    }}
                    disabled={indicators.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exit Rule
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {exitConditions.length > 0 ? (
                    exitConditions.map((condition, index) => 
                      renderCondition(condition, index, 'exit')
                    )
                  ) : (
                    <div className="p-4 text-center text-gray-500 border rounded-md">
                      <ArrowRight className="h-6 w-6 mx-auto mb-2 transform rotate-180" />
                      <p>No exit conditions defined.</p>
                      <p className="text-sm">Define when to exit trades.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => onSave && onSave(null)}>
          Cancel
        </Button>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></span>
              {defaultStrategy?.id ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <span>{defaultStrategy?.id ? 'Update Strategy' : 'Create Strategy'}</span>
          )}
        </Button>
      </CardFooter>
      
      {/* Dialogs */}
      <IndicatorDialog />
      <ConditionDialog />
    </Card>
  );
};

export default StrategyBuilder;