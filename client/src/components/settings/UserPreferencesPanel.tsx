import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Palette, 
  Bell, 
  TrendingUp, 
  Shield, 
  Download, 
  Upload, 
  RefreshCw,
  Loader2,
  Check,
  AlertCircle,
  Monitor,
  Smartphone,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';

interface UserPreferences {
  // Display Preferences
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  
  // Currency and Regional
  baseCurrency: string;
  secondaryCurrency?: string;
  currencyDisplayFormat: string;
  
  // Dashboard Layout
  dashboardLayout: string;
  sidebarCollapsed: boolean;
  panelArrangement: string[];
  defaultPage: string;
  
  // Data Preferences
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number;
  dataRetentionDays: number;
  cacheEnabled: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  
  // Trading
  defaultOrderType: string;
  confirmTrades: boolean;
  showAdvancedTrading: boolean;
  paperTradingDefault: boolean;
  
  // Charts
  defaultChartType: string;
  chartTheme: string;
  showVolume: boolean;
  showIndicators: boolean;
  chartTimeframe: string;
  
  // Privacy
  profileVisibility: string;
  showPerformance: boolean;
  showHoldings: boolean;
  analyticsTracking: boolean;
  
  // Accessibility
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderSupport: boolean;
  
  // Performance
  lazyLoading: boolean;
  imageOptimization: boolean;
  animationEnabled: boolean;
  transitionSpeed: string;
  
  // Advanced
  debugMode: boolean;
  betaFeatures: boolean;
  developerMode: boolean;
}

interface ThemePreferences {
  themeMode: string;
  colorScheme: string;
  accentColor: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  containerWidth: string;
  borderRadius: string;
  customCss?: string;
}

const UserPreferencesPanel: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [themePreferences, setThemePreferences] = useState<ThemePreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Load preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      
      const [prefsResponse, themeResponse] = await Promise.all([
        fetch('/api/user-preferences'),
        fetch('/api/user-preferences/theme')
      ]);
      
      if (prefsResponse.ok) {
        const prefsData = await prefsResponse.json();
        setPreferences(prefsData);
      }
      
      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        setThemePreferences(themeData);
      }
      
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    if (preferences) {
      setPreferences(prev => ({
        ...prev!,
        [key]: value
      }));
      setHasChanges(true);
    }
  };

  const updateThemePreference = (key: keyof ThemePreferences, value: any) => {
    if (themePreferences) {
      setThemePreferences(prev => ({
        ...prev!,
        [key]: value
      }));
      setHasChanges(true);
    }
  };

  const savePreferences = async () => {
    if (!preferences || !themePreferences) return;
    
    try {
      setSaving(true);
      
      const [prefsResponse, themeResponse] = await Promise.all([
        fetch('/api/user-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences)
        }),
        fetch('/api/user-preferences/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(themePreferences)
        })
      ]);
      
      if (prefsResponse.ok && themeResponse.ok) {
        setHasChanges(false);
        toast({
          title: "Success",
          description: "Preferences saved successfully"
        });
      } else {
        throw new Error('Failed to save preferences');
      }
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetPreferences = async (category?: string) => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/user-preferences/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      
      if (response.ok) {
        await fetchPreferences();
        setHasChanges(false);
        toast({
          title: "Success",
          description: `Preferences reset successfully`
        });
      } else {
        throw new Error('Failed to reset preferences');
      }
      
    } catch (error) {
      console.error('Error resetting preferences:', error);
      toast({
        title: "Error",
        description: "Failed to reset preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const exportPreferences = async () => {
    try {
      const response = await fetch('/api/user-preferences/export');
      
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stackmotive-preferences-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Preferences exported successfully"
        });
      }
      
    } catch (error) {
      console.error('Error exporting preferences:', error);
      toast({
        title: "Error",
        description: "Failed to export preferences",
        variant: "destructive"
      });
    }
  };

  const importPreferences = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        const response = await fetch('/api/user-preferences/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await fetchPreferences();
          toast({
            title: "Success",
            description: "Preferences imported successfully"
          });
        } else {
          throw new Error('Failed to import preferences');
        }
        
      } catch (error) {
        console.error('Error importing preferences:', error);
        toast({
          title: "Error",
          description: "Failed to import preferences",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading preferences...</span>
        </div>
      </div>
    );
  }

  if (!preferences || !themePreferences) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p>Failed to load preferences</p>
          <Button onClick={fetchPreferences} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with save/reset actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">User Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Customize your StackMotive experience
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <AlertCircle className="w-3 h-3" />
              <span>Unsaved changes</span>
            </Badge>
          )}
          
          <Button
            onClick={savePreferences}
            disabled={!hasChanges || isSaving}
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Theme</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="trading" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Trading</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>Configure how StackMotive appears to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={preferences.language} onValueChange={(value) => updatePreference('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={preferences.timezone} onValueChange={(value) => updatePreference('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pacific/Auckland">Auckland (GMT+12)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (GMT+10)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={preferences.dateFormat} onValueChange={(value) => updatePreference('dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select value={preferences.timeFormat} onValueChange={(value) => updatePreference('timeFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency Settings</CardTitle>
              <CardDescription>Configure your preferred currencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseCurrency">Base Currency</Label>
                  <Select value={preferences.baseCurrency} onValueChange={(value) => updatePreference('baseCurrency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NZD">NZD - New Zealand Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="currencyDisplay">Currency Display</Label>
                  <Select value={preferences.currencyDisplayFormat} onValueChange={(value) => updatePreference('currencyDisplayFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="symbol">Symbol ($, €, £)</SelectItem>
                      <SelectItem value="code">Code (USD, EUR, GBP)</SelectItem>
                      <SelectItem value="name">Full Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme Mode</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={themePreferences.themeMode === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateThemePreference('themeMode', 'light')}
                    className="flex items-center space-x-2"
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant={themePreferences.themeMode === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateThemePreference('themeMode', 'dark')}
                    className="flex items-center space-x-2"
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </Button>
                  <Button
                    variant={themePreferences.themeMode === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateThemePreference('themeMode', 'system')}
                    className="flex items-center space-x-2"
                  >
                    <Laptop className="w-4 h-4" />
                    <span>System</span>
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Select value={themePreferences.fontSize} onValueChange={(value) => updateThemePreference('fontSize', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra_large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="borderRadius">Border Radius</Label>
                  <Select value={themePreferences.borderRadius} onValueChange={(value) => updateThemePreference('borderRadius', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="color"
                    value={themePreferences.accentColor}
                    onChange={(e) => updateThemePreference('accentColor', e.target.value)}
                    className="w-12 h-8 rounded border"
                  />
                  <Input
                    value={themePreferences.accentColor}
                    onChange={(e) => updateThemePreference('accentColor', e.target.value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Real-time browser notifications</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Critical alerts via SMS</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={preferences.smsNotifications}
                    onCheckedChange={(checked) => updatePreference('smsNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trading Preferences</CardTitle>
              <CardDescription>Configure your trading defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultOrderType">Default Order Type</Label>
                  <Select value={preferences.defaultOrderType} onValueChange={(value) => updatePreference('defaultOrderType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market Order</SelectItem>
                      <SelectItem value="limit">Limit Order</SelectItem>
                      <SelectItem value="stop">Stop Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="chartTimeframe">Default Chart Timeframe</Label>
                  <Select value={preferences.chartTimeframe} onValueChange={(value) => updatePreference('chartTimeframe', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1M">1 Minute</SelectItem>
                      <SelectItem value="5M">5 Minutes</SelectItem>
                      <SelectItem value="1H">1 Hour</SelectItem>
                      <SelectItem value="1D">1 Day</SelectItem>
                      <SelectItem value="1W">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="confirmTrades">Confirm Trades</Label>
                    <p className="text-sm text-muted-foreground">Require confirmation before executing trades</p>
                  </div>
                  <Switch
                    id="confirmTrades"
                    checked={preferences.confirmTrades}
                    onCheckedChange={(checked) => updatePreference('confirmTrades', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="paperTradingDefault">Paper Trading Default</Label>
                    <p className="text-sm text-muted-foreground">Start with paper trading by default</p>
                  </div>
                  <Switch
                    id="paperTradingDefault"
                    checked={preferences.paperTradingDefault}
                    onCheckedChange={(checked) => updatePreference('paperTradingDefault', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showAdvancedTrading">Advanced Trading Features</Label>
                    <p className="text-sm text-muted-foreground">Show advanced order types and features</p>
                  </div>
                  <Switch
                    id="showAdvancedTrading"
                    checked={preferences.showAdvancedTrading}
                    onCheckedChange={(checked) => updatePreference('showAdvancedTrading', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your data and privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="profileVisibility">Profile Visibility</Label>
                <Select value={preferences.profileVisibility} onValueChange={(value) => updatePreference('profileVisibility', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showPerformance">Share Performance</Label>
                    <p className="text-sm text-muted-foreground">Allow others to see your trading performance</p>
                  </div>
                  <Switch
                    id="showPerformance"
                    checked={preferences.showPerformance}
                    onCheckedChange={(checked) => updatePreference('showPerformance', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showHoldings">Share Holdings</Label>
                    <p className="text-sm text-muted-foreground">Allow others to see your current holdings</p>
                  </div>
                  <Switch
                    id="showHoldings"
                    checked={preferences.showHoldings}
                    onCheckedChange={(checked) => updatePreference('showHoldings', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analyticsTracking">Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground">Help improve StackMotive with usage analytics</p>
                  </div>
                  <Switch
                    id="analyticsTracking"
                    checked={preferences.analyticsTracking}
                    onCheckedChange={(checked) => updatePreference('analyticsTracking', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance & Advanced</CardTitle>
              <CardDescription>Advanced settings for power users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="debugMode">Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">Show debug information and logs</p>
                  </div>
                  <Switch
                    id="debugMode"
                    checked={preferences.debugMode}
                    onCheckedChange={(checked) => updatePreference('debugMode', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="betaFeatures">Beta Features</Label>
                    <p className="text-sm text-muted-foreground">Enable experimental features</p>
                  </div>
                  <Switch
                    id="betaFeatures"
                    checked={preferences.betaFeatures}
                    onCheckedChange={(checked) => updatePreference('betaFeatures', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="developerMode">Developer Mode</Label>
                    <p className="text-sm text-muted-foreground">Advanced developer tools and settings</p>
                  </div>
                  <Switch
                    id="developerMode"
                    checked={preferences.developerMode}
                    onCheckedChange={(checked) => updatePreference('developerMode', checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label>Data Management</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    onClick={exportPreferences}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </Button>
                  
                  <Label htmlFor="import" className="cursor-pointer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4" />
                        <span>Import</span>
                      </span>
                    </Button>
                    <input
                      id="import"
                      type="file"
                      accept=".json"
                      onChange={importPreferences}
                      className="hidden"
                    />
                  </Label>
                  
                  <Button
                    onClick={() => resetPreferences()}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 text-red-600"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset All</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserPreferencesPanel; 