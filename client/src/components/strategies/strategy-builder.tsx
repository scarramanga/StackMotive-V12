import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface StrategyBuilderProps {
  template?: any;
  onSave: (strategyData: any) => void;
  onCancel: () => void;
}

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  template,
  onSave,
  onCancel,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [strategyData, setStrategyData] = useState({
    name: template ? `${template.name} Strategy` : "",
    description: "",
    symbol: "",
    exchange: "Tiger",
    indicators: [] as any[],
    entryConditions: [] as any[],
    exitConditions: [] as any[],
    riskPercentage: 2,
    takeProfit: 5,
    stopLoss: 2,
    trailingStop: false,
    martingale: false,
    timeframe: "1h",
  });
  
  const exchanges = [
    { value: "Tiger", label: "Tiger" },
    { value: "IBKR", label: "Interactive Brokers" },
    { value: "KuCoin", label: "KuCoin" },
    { value: "Kraken", label: "Kraken" },
  ];
  
  const timeframes = [
    { value: "1m", label: "1 Minute" },
    { value: "5m", label: "5 Minutes" },
    { value: "15m", label: "15 Minutes" },
    { value: "30m", label: "30 Minutes" },
    { value: "1h", label: "1 Hour" },
    { value: "4h", label: "4 Hours" },
    { value: "1d", label: "1 Day" },
    { value: "1w", label: "1 Week" },
  ];
  
  const indicators = [
    { value: "sma", label: "Simple Moving Average (SMA)" },
    { value: "ema", label: "Exponential Moving Average (EMA)" },
    { value: "rsi", label: "Relative Strength Index (RSI)" },
    { value: "macd", label: "Moving Average Convergence Divergence (MACD)" },
    { value: "bollinger", label: "Bollinger Bands" },
    { value: "stochastic", label: "Stochastic Oscillator" },
    { value: "atr", label: "Average True Range (ATR)" },
    { value: "volume", label: "Volume" },
  ];
  
  const handleChange = (field: string, value: any) => {
    setStrategyData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleAddIndicator = (indicator: string) => {
    if (!strategyData.indicators.find(ind => ind.type === indicator)) {
      setStrategyData(prev => ({
        ...prev,
        indicators: [...prev.indicators, {
          type: indicator,
          parameters: getDefaultParameters(indicator),
        }],
      }));
      
      toast({
        title: "Indicator Added",
        description: `${indicators.find(ind => ind.value === indicator)?.label} has been added to your strategy.`,
      });
    }
  };
  
  const handleRemoveIndicator = (indicator: string) => {
    setStrategyData(prev => ({
      ...prev,
      indicators: prev.indicators.filter(ind => ind.type !== indicator),
    }));
  };
  
  const getDefaultParameters = (indicator: string) => {
    switch (indicator) {
      case "sma":
      case "ema":
        return { period: 20 };
      case "rsi":
        return { period: 14, overbought: 70, oversold: 30 };
      case "macd":
        return { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 };
      case "bollinger":
        return { period: 20, deviations: 2 };
      case "stochastic":
        return { kPeriod: 14, dPeriod: 3, slowing: 3 };
      case "atr":
        return { period: 14 };
      case "volume":
        return { period: 20 };
      default:
        return {};
    }
  };
  
  const renderIndicatorConfig = (indicator: any) => {
    switch (indicator.type) {
      case "sma":
      case "ema":
        return (
          <div className="space-y-2">
            <Label>Period</Label>
            <Input 
              type="number" 
              value={indicator.parameters.period} 
              onChange={(e) => {
                const period = parseInt(e.target.value);
                if (period > 0) {
                  const updatedIndicators = strategyData.indicators.map(ind => 
                    ind.type === indicator.type 
                      ? { ...ind, parameters: { ...ind.parameters, period } } 
                      : ind
                  );
                  handleChange("indicators", updatedIndicators);
                }
              }}
              min="1"
            />
          </div>
        );
      
      case "rsi":
        return (
          <div className="space-y-4">
            <div>
              <Label>Period</Label>
              <Input 
                type="number" 
                value={indicator.parameters.period} 
                onChange={(e) => {
                  const period = parseInt(e.target.value);
                  if (period > 0) {
                    const updatedIndicators = strategyData.indicators.map(ind => 
                      ind.type === indicator.type 
                        ? { ...ind, parameters: { ...ind.parameters, period } } 
                        : ind
                    );
                    handleChange("indicators", updatedIndicators);
                  }
                }}
                min="1"
              />
            </div>
            <div>
              <Label>Overbought Level</Label>
              <Input 
                type="number" 
                value={indicator.parameters.overbought} 
                onChange={(e) => {
                  const overbought = parseInt(e.target.value);
                  if (overbought >= 0 && overbought <= 100) {
                    const updatedIndicators = strategyData.indicators.map(ind => 
                      ind.type === indicator.type 
                        ? { ...ind, parameters: { ...ind.parameters, overbought } } 
                        : ind
                    );
                    handleChange("indicators", updatedIndicators);
                  }
                }}
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label>Oversold Level</Label>
              <Input 
                type="number" 
                value={indicator.parameters.oversold} 
                onChange={(e) => {
                  const oversold = parseInt(e.target.value);
                  if (oversold >= 0 && oversold <= 100) {
                    const updatedIndicators = strategyData.indicators.map(ind => 
                      ind.type === indicator.type 
                        ? { ...ind, parameters: { ...ind.parameters, oversold } } 
                        : ind
                    );
                    handleChange("indicators", updatedIndicators);
                  }
                }}
                min="0"
                max="100"
              />
            </div>
          </div>
        );
      
      // Add more cases for other indicators as needed
        
      default:
        return <p className="text-sm text-neutral-500">Configure parameters for this indicator.</p>;
    }
  };
  
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      onSave(strategyData);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prevStep => prevStep - 1);
    } else {
      onCancel();
    }
  };
  
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return strategyData.name && strategyData.symbol && strategyData.exchange;
      case 2:
        return strategyData.indicators.length > 0;
      case 3:
        return true; // Risk management always valid for now
      default:
        return false;
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>
          {template ? `Create Strategy: ${template.name}` : "Create New Trading Strategy"}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={`step${currentStep}`} className="space-y-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger 
              value="step1" 
              disabled={currentStep !== 1}
              className={currentStep >= 1 ? "bg-primary bg-opacity-10" : ""}
            >
              Basic Setup
            </TabsTrigger>
            <TabsTrigger 
              value="step2" 
              disabled={currentStep !== 2}
              className={currentStep >= 2 ? "bg-primary bg-opacity-10" : ""}
            >
              Indicators & Rules
            </TabsTrigger>
            <TabsTrigger 
              value="step3" 
              disabled={currentStep !== 3}
              className={currentStep >= 3 ? "bg-primary bg-opacity-10" : ""}
            >
              Risk Management
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="step1" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strategy-name">Strategy Name</Label>
              <Input 
                id="strategy-name" 
                value={strategyData.name} 
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter strategy name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="strategy-description">Description</Label>
              <Input 
                id="strategy-description" 
                value={strategyData.description} 
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Short description of your strategy"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="strategy-symbol">Trading Symbol/Pair</Label>
              <Input 
                id="strategy-symbol" 
                value={strategyData.symbol} 
                onChange={(e) => handleChange("symbol", e.target.value)}
                placeholder="e.g., AAPL, BTC/USD"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="strategy-exchange">Exchange/Broker</Label>
              <Select
                value={strategyData.exchange}
                onValueChange={(value) => handleChange("exchange", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent>
                  {exchanges.map((exchange) => (
                    <SelectItem key={exchange.value} value={exchange.value}>
                      {exchange.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="strategy-timeframe">Timeframe</Label>
              <Select
                value={strategyData.timeframe}
                onValueChange={(value) => handleChange("timeframe", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((timeframe) => (
                    <SelectItem key={timeframe.value} value={timeframe.value}>
                      {timeframe.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="step2" className="space-y-4">
            <div className="space-y-4">
              <Label>Select Indicators</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {indicators.map((indicator) => (
                  <Button
                    key={indicator.value}
                    variant={strategyData.indicators.find(ind => ind.type === indicator.value) ? "secondary" : "outline"}
                    onClick={() => {
                      if (strategyData.indicators.find(ind => ind.type === indicator.value)) {
                        handleRemoveIndicator(indicator.value);
                      } else {
                        handleAddIndicator(indicator.value);
                      }
                    }}
                    className="justify-start"
                  >
                    {strategyData.indicators.find(ind => ind.type === indicator.value) ? (
                      <i className="ri-checkbox-circle-fill mr-2"></i>
                    ) : (
                      <i className="ri-add-circle-line mr-2"></i>
                    )}
                    {indicator.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {strategyData.indicators.length > 0 && (
              <div className="space-y-4 mt-6">
                <Label>Configure Indicators</Label>
                <div className="space-y-4">
                  {strategyData.indicators.map((indicator) => (
                    <Card key={indicator.type} className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">
                          {indicators.find(ind => ind.value === indicator.type)?.label}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveIndicator(indicator.type)}
                          className="text-destructive"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </Button>
                      </div>
                      {renderIndicatorConfig(indicator)}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="step3" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="risk-percentage">Risk Per Trade (%)</Label>
                  <span className="text-sm font-medium">{strategyData.riskPercentage}%</span>
                </div>
                <Slider
                  id="risk-percentage"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={[strategyData.riskPercentage]}
                  onValueChange={(value) => handleChange("riskPercentage", value[0])}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Maximum amount of your portfolio to risk on each trade.
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="take-profit">Take Profit (%)</Label>
                  <span className="text-sm font-medium">{strategyData.takeProfit}%</span>
                </div>
                <Slider
                  id="take-profit"
                  min={1}
                  max={20}
                  step={0.5}
                  value={[strategyData.takeProfit]}
                  onValueChange={(value) => handleChange("takeProfit", value[0])}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                  <span className="text-sm font-medium">{strategyData.stopLoss}%</span>
                </div>
                <Slider
                  id="stop-loss"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={[strategyData.stopLoss]}
                  onValueChange={(value) => handleChange("stopLoss", value[0])}
                />
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="trailing-stop" className="cursor-pointer">Trailing Stop Loss</Label>
                    <p className="text-xs text-neutral-500">
                      Stop loss that moves with price to protect profits
                    </p>
                  </div>
                  <Switch
                    id="trailing-stop"
                    checked={strategyData.trailingStop}
                    onCheckedChange={(value) => handleChange("trailingStop", value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="martingale" className="cursor-pointer">Martingale System</Label>
                    <p className="text-xs text-neutral-500">
                      Increase position size after losses (high risk)
                    </p>
                  </div>
                  <Switch
                    id="martingale"
                    checked={strategyData.martingale}
                    onCheckedChange={(value) => handleChange("martingale", value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!isStepValid()}
          className={currentStep === 3 ? "bg-gradient-primary" : ""}
        >
          {currentStep === 3 ? "Create Strategy" : "Next"}
        </Button>
      </CardFooter>
    </Card>
  );
};
