import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, TrendingUp, Plus, Settings, History, Target } from 'lucide-react';

interface TradeRule {
  id: string;
  userId: string;
  symbol: string;
  type: 'dca' | 'stop_loss';
  enabled: boolean;
  dcaAmount?: number;
  dcaFrequency?: 'daily' | 'weekly' | 'monthly';
  stopLossPercent?: number;
  alertsEnabled: boolean;
  createdAt: string;
  lastTriggered?: string;
}

interface RuleExecution {
  id: string;
  ruleId: string;
  symbol: string;
  type: 'dca' | 'stop_loss';
  amount: number;
  price: number;
  executedAt: string;
  status: 'completed' | 'failed' | 'pending';
}

export const DCAStopLossAssistant: React.FC<{ userId: string }> = ({ userId }) => {
  const [rules, setRules] = useState<TradeRule[]>([]);
  const [executions, setExecutions] = useState<RuleExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [ruleType, setRuleType] = useState<'dca' | 'stop_loss'>('dca');
  const [dcaAmount, setDcaAmount] = useState('');
  const [dcaFrequency, setDcaFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [stopLossPercent, setStopLossPercent] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    fetchRulesData();
  }, [userId]);

  const fetchRulesData = async () => {
    try {
      setLoading(true);
      const [rulesRes, executionsRes] = await Promise.all([
        fetch(`/api/rules/dca/${userId}`),
        fetch(`/api/rules/executions/${userId}`)
      ]);
      
      const rulesData = await rulesRes.json();
      const executionsData = await executionsRes.json();
      
      setRules(rulesData.rules || []);
      setExecutions(executionsData.executions || []);
      
      await fetch('/api/agent-memory/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'VIEW_DCA_STOP_LOSS',
          blockId: 10,
          data: { rulesCount: rulesData.rules?.length || 0 }
        })
      });
    } catch (err) {
      console.error('Failed to load rules data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      setSaving(true);
      const ruleData = {
        symbol: selectedSymbol,
        type: ruleType,
        enabled: true,
        ...(ruleType === 'dca' ? {
          dcaAmount: parseFloat(dcaAmount),
          dcaFrequency
        } : {
          stopLossPercent: parseFloat(stopLossPercent)
        }),
        alertsEnabled
      };
      
      await fetch(`/api/rules/update/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      
      await fetch('/api/agent-memory/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'CREATE_TRADE_RULE',
          blockId: 10,
          data: ruleData
        })
      });
      
      setSelectedSymbol('');
      setDcaAmount('');
      setStopLossPercent('');
      await fetchRulesData();
    } catch (err) {
      console.error('Failed to create rule:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await fetch(`/api/rules/toggle/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, enabled })
      });
      
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));
      
      await fetch('/api/agent-memory/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'TOGGLE_TRADE_RULE',
          blockId: 10,
          data: { ruleId, enabled }
        })
      });
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const dcaRules = rules.filter(r => r.type === 'dca');
  const stopLossRules = rules.filter(r => r.type === 'stop_loss');

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            DCA & Stop-Loss Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading rules...</div>
          ) : (
            <>
            <Tabs defaultValue="dca" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dca">DCA Rules</TabsTrigger>
                <TabsTrigger value="stop-loss">Stop-Loss Rules</TabsTrigger>
                <TabsTrigger value="create">Create Rule</TabsTrigger>
              </TabsList>

              <TabsContent value="dca" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Dollar-Cost Averaging Rules
                  </h3>
                  {dcaRules.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No DCA rules configured</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Triggered</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dcaRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.symbol}</TableCell>
                            <TableCell>${rule.dcaAmount}</TableCell>
                            <TableCell>{rule.dcaFrequency}</TableCell>
                            <TableCell>
                              <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                                {rule.enabled ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {rule.lastTriggered 
                                ? new Date(rule.lastTriggered).toLocaleDateString()
                                : 'Never'
                              }
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(enabled) => toggleRule(rule.id, enabled)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="stop-loss" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Stop-Loss Rules
                  </h3>
                  {stopLossRules.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No stop-loss rules configured</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Stop-Loss %</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Triggered</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stopLossRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.symbol}</TableCell>
                            <TableCell>{rule.stopLossPercent}%</TableCell>
                            <TableCell>
                              <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                                {rule.enabled ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {rule.lastTriggered 
                                ? new Date(rule.lastTriggered).toLocaleDateString()
                                : 'Never'
                              }
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(enabled) => toggleRule(rule.id, enabled)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New Rule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="symbol">Asset Symbol</Label>
                        <Input
                          id="symbol"
                          value={selectedSymbol}
                          onChange={(e) => setSelectedSymbol(e.target.value)}
                          placeholder="e.g., AAPL, BTC"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="ruleType">Rule Type</Label>
                        <Select value={ruleType} onValueChange={(value: any) => setRuleType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dca">Dollar-Cost Averaging</SelectItem>
                            <SelectItem value="stop_loss">Stop-Loss</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {ruleType === 'dca' ? (
                        <>
                          <div>
                            <Label htmlFor="dcaAmount">DCA Amount ($)</Label>
                            <Input
                              id="dcaAmount"
                              value={dcaAmount}
                              onChange={(e) => setDcaAmount(e.target.value)}
                              placeholder="100"
                              type="number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select value={dcaFrequency} onValueChange={(value: any) => setDcaFrequency(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <div>
                          <Label htmlFor="stopLoss">Stop-Loss Percentage (%)</Label>
                          <Input
                            id="stopLoss"
                            value={stopLossPercent}
                            onChange={(e) => setStopLossPercent(e.target.value)}
                            placeholder="10"
                            type="number"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="alerts">Enable Alerts</Label>
                        <Switch
                          id="alerts"
                          checked={alertsEnabled}
                          onCheckedChange={setAlertsEnabled}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleCreateRule}
                      disabled={saving || !selectedSymbol || (ruleType === 'dca' ? !dcaAmount : !stopLossPercent)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? 'Creating...' : 'Create Rule'}
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Execution History */}
            <Card className="p-4 mt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Executions
              </h3>
              {executions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No executions yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.slice(0, 10).map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell className="font-medium">{execution.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={execution.type === 'dca' ? 'default' : 'destructive'}>
                            {execution.type === 'dca' ? 'DCA' : 'Stop-Loss'}
                          </Badge>
                        </TableCell>
                        <TableCell>${execution.amount.toLocaleString()}</TableCell>
                        <TableCell>${execution.price.toFixed(2)}</TableCell>
                        <TableCell>{new Date(execution.executedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                            {execution.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DCAStopLossAssistant; 