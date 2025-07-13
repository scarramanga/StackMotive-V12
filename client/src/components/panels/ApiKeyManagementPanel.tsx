import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Key, Plus, RotateCcw, Trash2, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useApiKeys,
  useAddApiKey,
  useUpdateApiKey,
  useRevokeApiKey,
  useRotateApiKey,
  useValidateApiKey,
  useKeyAuditLog,
  useKeySecurityReport,
  useApiKeyManagementUtils,
  type ApiKeyRequest,
  type ApiKeyRevocation,
  type ApiKeyRotation,
  type ApiKeyType,
  type ApiKeyStatus,
  type Environment,
} from '@/services/apiKeyManagementService';

export const ApiKeyManagementPanel: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const { data: apiKeys, isLoading } = useApiKeys(userId);
  const addApiKey = useAddApiKey(userId);
  const updateApiKey = useUpdateApiKey(userId);
  const revokeApiKey = useRevokeApiKey(userId);
  const rotateApiKey = useRotateApiKey(userId);
  const validateApiKey = useValidateApiKey(userId);
  const utils = useApiKeyManagementUtils(userId);

  const [activeTab, setActiveTab] = useState('keys');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [showKeyValue, setShowKeyValue] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState<Partial<ApiKeyRequest>>({
    name: '',
    description: '',
    keyType: 'read_only',
    provider: '',
    service: '',
    metadata: {
      environment: 'development',
      version: '1.0.0',
      tags: [],
      owner: userId,
      team: '',
      project: '',
      costCenter: '',
      notes: '',
    },
    expirationDays: 90,
  });
  const [revocationReason, setRevocationReason] = useState('');

  const handleCreateApiKey = () => {
    if (!newKey.name || !newKey.provider || !newKey.service) return;

    const request: ApiKeyRequest = {
      name: newKey.name,
      description: newKey.description || '',
      keyType: newKey.keyType || 'read_only',
      provider: newKey.provider,
      service: newKey.service,
      permissions: [],
      security: {
        encryption: {
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          saltLength: 32,
          iterations: 100000,
          keyLength: 32,
        },
        access: {
          ipWhitelist: [],
          userAgentRestrictions: [],
          referrerRestrictions: [],
          rateLimit: {
            requests: 1000,
            window: 3600,
            burst: 100,
            backoff: 1000,
          },
          timeRestrictions: [],
        },
        monitoring: {
          logAccess: true,
          logErrors: true,
          alertOnSuspiciousActivity: true,
          alertOnRateLimit: true,
          alertOnExpiry: true,
        },
        compliance: {
          dataResidency: 'US',
          retentionPeriod: 2592000,
          auditLogging: true,
          encryptionRequired: true,
        },
      },
      metadata: newKey.metadata!,
      expirationDays: newKey.expirationDays,
    };

    addApiKey.mutate(request, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setNewKey({
          name: '',
          description: '',
          keyType: 'read_only',
          provider: '',
          service: '',
          metadata: {
            environment: 'development',
            version: '1.0.0',
            tags: [],
            owner: userId,
            team: '',
            project: '',
            costCenter: '',
            notes: '',
          },
          expirationDays: 90,
        });
      },
    });
  };

  const handleRevokeKey = (keyId: string) => {
    const revocation: ApiKeyRevocation = {
      id: keyId,
      reason: 'no_longer_needed',
      comment: revocationReason,
      immediateRevocation: true,
      notifyUsers: false,
    };

    revokeApiKey.mutate(revocation, {
      onSuccess: () => {
        setRevocationReason('');
      },
    });
  };

  const handleRotateKey = (keyId: string) => {
    const rotation: ApiKeyRotation = {
      id: keyId,
      rotationType: 'manual',
      gracePeriod: 86400,
      notifyUsers: true,
      backupOldKey: true,
    };

    rotateApiKey.mutate(rotation);
  };

  const handleValidateKey = (keyId: string) => {
    validateApiKey.mutate(keyId);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeyValue(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const activeKeys = apiKeys?.filter(key => key.status === 'active').length || 0;
  const expiredKeys = apiKeys?.filter(key => key.status === 'expired').length || 0;
  const revokedKeys = apiKeys?.filter(key => key.status === 'revoked').length || 0;
  const totalKeys = apiKeys?.length || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalKeys}</div>
              <div className="text-sm text-muted-foreground">Total Keys</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{activeKeys}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{expiredKeys}</div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{revokedKeys}</div>
              <div className="text-sm text-muted-foreground">Revoked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newKey.name}
                  onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter key name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newKey.description}
                  onChange={(e) => setNewKey(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter key description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newKey.keyType}
                    onValueChange={(value) => setNewKey(prev => ({ ...prev, keyType: value as ApiKeyType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read_only">Read Only</SelectItem>
                      <SelectItem value="read_write">Read/Write</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Environment</Label>
                  <Select
                    value={newKey.metadata?.environment}
                    onValueChange={(value) => setNewKey(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata!, environment: value as Environment }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Provider</Label>
                  <Input
                    value={newKey.provider}
                    onChange={(e) => setNewKey(prev => ({ ...prev, provider: e.target.value }))}
                    placeholder="e.g., OpenAI, AWS, etc."
                  />
                </div>
                <div>
                  <Label>Service</Label>
                  <Input
                    value={newKey.service}
                    onChange={(e) => setNewKey(prev => ({ ...prev, service: e.target.value }))}
                    placeholder="e.g., GPT-4, S3, etc."
                  />
                </div>
              </div>
              <div>
                <Label>Expiration (Days)</Label>
                <Input
                  type="number"
                  value={newKey.expirationDays}
                  onChange={(e) => setNewKey(prev => ({ ...prev, expirationDays: parseInt(e.target.value) }))}
                  min="1"
                  max="365"
                />
              </div>
              <Button
                onClick={handleCreateApiKey}
                disabled={!newKey.name || !newKey.provider || !newKey.service || addApiKey.isPending}
                className="w-full"
              >
                {addApiKey.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create API Key'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys">Keys</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading API keys...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys?.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{key.name}</div>
                            <div className="text-sm text-muted-foreground">{key.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {utils.formatApiKeyType(key.keyType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{key.provider}</TableCell>
                        <TableCell>
                          <Badge
                            variant={key.status === 'active' ? 'default' : 'secondary'}
                            style={{ backgroundColor: utils.getStatusColor(key.status) }}
                          >
                            {utils.formatApiKeyStatus(key.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{key.metadata.environment}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {showKeyValue[key.id] ? key.encryptedKey : key.maskedKey}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleKeyVisibility(key.id)}
                            >
                              {showKeyValue[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleValidateKey(key.id)}
                              disabled={validateApiKey.isPending}
                            >
                              <Shield className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRotateKey(key.id)}
                              disabled={key.status !== 'active' || rotateApiKey.isPending}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeKey(key.id)}
                              disabled={key.status !== 'active' || revokeApiKey.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
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
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Select an API key to view its audit log
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {apiKeys?.map((key) => (
                  <div key={key.id} className="p-4 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{key.name}</h4>
                      <Badge
                        variant={utils.calculateSecurityScore(key) > 80 ? 'default' : 'destructive'}
                      >
                        {utils.calculateSecurityScore(key).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Security Score: {utils.calculateSecurityScore(key).toFixed(0)}/100
                    </div>
                    <div className="mt-2 text-xs">
                      Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {addApiKey.isSuccess && (
        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription>
            API key created successfully! Please save the key securely as it won't be shown again.
          </AlertDescription>
        </Alert>
      )}

      {validateApiKey.isSuccess && (
        <Alert variant={validateApiKey.data?.isValid ? 'default' : 'destructive'}>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Validation {validateApiKey.data?.isValid ? 'passed' : 'failed'} - 
            {validateApiKey.data?.errors.length || 0} errors, {validateApiKey.data?.warnings.length || 0} warnings
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 