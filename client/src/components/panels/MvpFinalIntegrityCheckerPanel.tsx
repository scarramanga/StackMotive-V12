import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Shield, Download, Play, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useIntegrityCheckResults,
  useRunMvpAudit,
  useBlockMetadata,
  useComplianceReport,
  useGenerateRemediationPlan,
  useExportAuditReport,
  useMvpFinalIntegrityCheckerUtils,
  type AuditRequest,
  type IntegrityCheckResult,
  type StrictnessLevel,
} from '@/services/mvpFinalIntegrityCheckerService';

export const MvpFinalIntegrityCheckerPanel: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const { data: results, isLoading: resultsLoading } = useIntegrityCheckResults(userId);
  const { data: blockMetadata, isLoading: blocksLoading } = useBlockMetadata();
  const runAudit = useRunMvpAudit(userId);
  const generatePlan = useGenerateRemediationPlan(userId);
  const exportReport = useExportAuditReport(userId);
  const utils = useMvpFinalIntegrityCheckerUtils(userId);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedResult, setSelectedResult] = useState<IntegrityCheckResult | null>(null);
  const [auditConfig, setAuditConfig] = useState<AuditRequest>({
    includeBlocks: [],
    excludeBlocks: [],
    standards: ['enterprise', 'security', 'performance'],
    strictness: 'standard',
    generateReport: true,
    includeRemediation: true,
  });
  const [exportFormat, setExportFormat] = useState('pdf');

  const handleRunAudit = () => {
    runAudit.mutate(auditConfig, {
      onSuccess: (result) => {
        setSelectedResult(result);
        setActiveTab('results');
      },
    });
  };

  const handleGenerateRemediationPlan = () => {
    if (!selectedResult) return;
    generatePlan.mutate(selectedResult.id);
  };

  const handleExportReport = () => {
    if (!selectedResult) return;
    exportReport.mutate({ resultId: selectedResult.id, format: exportFormat });
  };

  const handleBlockSelection = (blockId: string, selected: boolean) => {
    if (selected) {
      setAuditConfig(prev => ({
        ...prev,
        includeBlocks: [...prev.includeBlocks!, blockId],
        excludeBlocks: prev.excludeBlocks?.filter(id => id !== blockId) || [],
      }));
    } else {
      setAuditConfig(prev => ({
        ...prev,
        includeBlocks: prev.includeBlocks?.filter(id => id !== blockId) || [],
        excludeBlocks: [...prev.excludeBlocks!, blockId],
      }));
    }
  };

  const latestResult = results?.[0];
  const totalBlocks = blockMetadata?.length || 0;
  const compliantBlocks = latestResult?.blockResults.filter(b => b.status === 'compliant').length || 0;
  const failedBlocks = latestResult?.blockResults.filter(b => b.status === 'non_compliant').length || 0;
  const overallScore = latestResult?.overallScore || 0;

  const isLoading = resultsLoading || blocksLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            MVP Final Integrity Checker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalBlocks}</div>
              <div className="text-sm text-muted-foreground">Total Blocks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{compliantBlocks}</div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedBlocks}</div>
              <div className="text-sm text-muted-foreground">Non-Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: overallScore > 80 ? '#10B981' : overallScore > 60 ? '#F59E0B' : '#EF4444' }}>
                {overallScore.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleRunAudit}
          disabled={runAudit.isPending}
          size="lg"
        >
          {runAudit.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Full Audit...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Full Integrity Check
            </>
          )}
        </Button>
        {selectedResult && (
          <>
            <Button
              variant="outline"
              onClick={handleGenerateRemediationPlan}
              disabled={generatePlan.isPending}
            >
              Generate Remediation Plan
            </Button>
            <Button
              variant="outline"
              onClick={handleExportReport}
              disabled={exportReport.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="remediation">Remediation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {latestResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Health Score</span>
                    <div className="flex items-center gap-2">
                      <Progress value={overallScore} className="w-32" />
                      <span className="text-sm font-medium">{overallScore.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded">
                      <div className="text-sm font-medium text-green-800">Compliant Blocks</div>
                      <div className="text-2xl font-bold text-green-600">{compliantBlocks}</div>
                      <div className="text-xs text-green-600">
                        {((compliantBlocks / totalBlocks) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded">
                      <div className="text-sm font-medium text-red-800">Non-Compliant Blocks</div>
                      <div className="text-2xl font-bold text-red-600">{failedBlocks}</div>
                      <div className="text-xs text-red-600">
                        {((failedBlocks / totalBlocks) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last audit: {new Date(latestResult.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No audit results available. Run an integrity check to see system health.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Audit History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading audit history...</span>
                </div>
              ) : results && results.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Blocks Checked</TableHead>
                      <TableHead>Compliance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.slice(0, 5).map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{new Date(result.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={result.status === 'completed' ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={result.overallScore} className="w-16" />
                            <span className="text-sm">{result.overallScore.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{result.blockResults.length}</TableCell>
                        <TableCell>
                          <Badge
                            variant={result.complianceStatus.overall === 'compliant' ? 'default' : 'destructive'}
                          >
                            {utils.formatComplianceLevel(result.complianceStatus.overall)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedResult(result)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No audit history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Strictness Level</label>
                <Select
                  value={auditConfig.strictness}
                  onValueChange={(value) => setAuditConfig(prev => ({ ...prev, strictness: value as StrictnessLevel }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lenient">Lenient</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="pedantic">Pedantic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Standards to Check</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['enterprise', 'security', 'performance', 'compliance', 'maintainability'].map((standard) => (
                    <div key={standard} className="flex items-center space-x-2">
                      <Checkbox
                        id={standard}
                        checked={auditConfig.standards?.includes(standard)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAuditConfig(prev => ({ ...prev, standards: [...prev.standards!, standard] }));
                          } else {
                            setAuditConfig(prev => ({ ...prev, standards: prev.standards?.filter(s => s !== standard) }));
                          }
                        }}
                      />
                      <label htmlFor={standard} className="text-sm capitalize">{standard}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Blocks to Check</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 max-h-64 overflow-y-auto">
                  {blockMetadata?.map((block) => (
                    <div key={block.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        id={block.id}
                        checked={auditConfig.includeBlocks?.length === 0 || auditConfig.includeBlocks?.includes(block.id)}
                        onCheckedChange={(checked) => handleBlockSelection(block.id, checked as boolean)}
                      />
                      <label htmlFor={block.id} className="text-sm">
                        Block {block.number}: {block.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="generateReport"
                    checked={auditConfig.generateReport}
                    onCheckedChange={(checked) => setAuditConfig(prev => ({ ...prev, generateReport: checked as boolean }))}
                  />
                  <label htmlFor="generateReport" className="text-sm">Generate Report</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeRemediation"
                    checked={auditConfig.includeRemediation}
                    onCheckedChange={(checked) => setAuditConfig(prev => ({ ...prev, includeRemediation: checked as boolean }))}
                  />
                  <label htmlFor="includeRemediation" className="text-sm">Include Remediation</label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Export Format</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Results</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold">{selectedResult.blockResults.length}</div>
                      <div className="text-sm text-muted-foreground">Blocks Checked</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold">{selectedResult.systemChecks.filter(c => c.result.passed).length}</div>
                      <div className="text-sm text-muted-foreground">System Checks Passed</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded">
                      <div className="text-2xl font-bold">
                        {selectedResult.blockResults.reduce((sum, block) => sum + block.issues.length, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Issues</div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Block</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead>Compliance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedResult.blockResults.map((block) => (
                        <TableRow key={block.blockId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">Block {block.blockNumber}</div>
                              <div className="text-sm text-muted-foreground">{block.blockName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {block.status === 'compliant' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : block.status === 'non_compliant' ? (
                                <XCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                              <Badge
                                variant={block.status === 'compliant' ? 'default' : 'destructive'}
                                style={{ backgroundColor: utils.getBlockStatusColor(block.status) }}
                              >
                                {utils.formatBlockStatus(block.status)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={block.score} className="w-16" />
                              <span className="text-sm">{block.score.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{block.issues.length}</Badge>
                              {block.issues.filter(i => i.severity === 'critical').length > 0 && (
                                <Badge variant="destructive">
                                  {block.issues.filter(i => i.severity === 'critical').length} Critical
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={block.compliance.score > 80 ? 'default' : 'destructive'}
                            >
                              {block.compliance.score.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Run an integrity check to see detailed results
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remediation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Remediation Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {generatePlan.data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold">{generatePlan.data.summary.totalActions}</div>
                      <div className="text-sm text-muted-foreground">Total Actions</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded">
                      <div className="text-2xl font-bold">{generatePlan.data.summary.criticalActions}</div>
                      <div className="text-sm text-muted-foreground">Critical Actions</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold">{generatePlan.data.summary.estimatedEffort}h</div>
                      <div className="text-sm text-muted-foreground">Estimated Effort</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold">{(generatePlan.data.summary.successProbability * 100).toFixed(0)}%</div>
                      <div className="text-sm text-muted-foreground">Success Probability</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Remediation Actions</h4>
                    {generatePlan.data.actions.slice(0, 10).map((action) => (
                      <div key={action.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={action.priority === 'urgent' ? 'destructive' : 'outline'}>
                              {action.priority}
                            </Badge>
                            <span className="font-medium">{action.title}</span>
                          </div>
                          <Badge variant="outline">{action.effort}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Generate a remediation plan to see recommended actions
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {runAudit.isSuccess && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            Integrity check completed successfully! Overall score: {runAudit.data?.overallScore.toFixed(1)}%
          </AlertDescription>
        </Alert>
      )}

      {runAudit.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Failed to run integrity check. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 