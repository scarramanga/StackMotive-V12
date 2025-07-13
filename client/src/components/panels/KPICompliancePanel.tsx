import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  TrendingDown,
  Clock,
  Target,
  BarChart3,
  Info,
  Settings,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useAuth } from '../../hooks/useAuth';
import { 
  KPIComplianceService, 
  KPIResult, 
  ComplianceOverview,
  KPIThreshold
} from '../../services/kpiComplianceService';

const kpiService = new KPIComplianceService();

interface KPICompliancePanelProps {
  kpiThresholds?: KPIThreshold[];
  onConfigureThreshold?: (kpiId: string) => void;
}

export const KPICompliancePanel: React.FC<KPICompliancePanelProps> = ({ 
  kpiThresholds,
  onConfigureThreshold
}) => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // State management
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch KPI compliance data
  const { data: complianceData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/compliance/kpi-results', activeVaultId],
    queryFn: () => kpiService.getKPIComplianceResults(activeVaultId, kpiThresholds),
    enabled: !!user && !!activeVaultId,
    refetchInterval: 300000, // Every 5 minutes
  });

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle category filter
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Filter KPIs by category
  const filteredKPIs = complianceData?.results?.filter(result => 
    selectedCategory === 'all' || result.kpi.category === selectedCategory
  ) || [];

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const iconName = kpiService.getCategoryIcon(category as any);
    switch (iconName) {
      case 'shield':
        return <Shield className="h-4 w-4" />;
      case 'bar-chart-3':
        return <BarChart3 className="h-4 w-4" />;
      case 'target':
        return <Target className="h-4 w-4" />;
      case 'trending-down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  // Get unique categories for filtering
  const categories = ['all', ...new Set(filteredKPIs.map(result => result.kpi.category))];

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading compliance data: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Loading compliance data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!complianceData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No compliance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            KPI Compliance Monitor
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Compliance Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{complianceData.overview.totalKPIs}</div>
            <div className="text-xs text-muted-foreground">Total KPIs</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{complianceData.overview.passing}</div>
            <div className="text-xs text-muted-foreground">Passing</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{complianceData.overview.warnings}</div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{complianceData.overview.failing}</div>
            <div className="text-xs text-muted-foreground">Failing</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className={`text-2xl font-bold ${kpiService.getOverallStatusText(complianceData.overview.overallScore).color}`}>
              {complianceData.overview.overallScore}%
            </div>
            <div className="text-xs text-muted-foreground">
              {kpiService.getOverallStatusText(complianceData.overview.overallScore).text}
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => handleCategoryChange(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* KPI Results */}
        {isExpanded && (
          <div className="space-y-4">
            {filteredKPIs.map((result) => (
              <KPICard
                key={result.kpi.id}
                result={result}
                service={kpiService}
                onConfigureThreshold={onConfigureThreshold}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Individual KPI Card component
const KPICard: React.FC<{ 
  result: KPIResult;
  service: KPIComplianceService;
  onConfigureThreshold?: (kpiId: string) => void;
}> = ({ result, service, onConfigureThreshold }) => {
  const { kpi, currentValue, status, rationale, trend } = result;

  return (
    <div className="p-4 border border-border rounded-lg bg-background">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted/50 rounded-lg">
            {(() => {
              const iconName = service.getCategoryIcon(kpi.category);
              switch (iconName) {
                case 'shield':
                  return <Shield className="h-4 w-4" />;
                case 'bar-chart-3':
                  return <BarChart3 className="h-4 w-4" />;
                case 'target':
                  return <Target className="h-4 w-4" />;
                case 'trending-down':
                  return <TrendingDown className="h-4 w-4" />;
                default:
                  return <Info className="h-4 w-4" />;
              }
            })()}
          </div>
          <div>
            <div className="font-medium text-foreground">{kpi.name}</div>
            <div className="text-sm text-muted-foreground">{kpi.description}</div>
          </div>
        </div>
        
        <KPIStatusIndicator 
          status={status}
          rationale={rationale}
          priority={kpi.priority}
          service={service}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Current</div>
          <div className={`font-medium ${service.getKPIStatusColor(status)}`}>
            {service.formatKPIValue(currentValue, kpi.unit)}
          </div>
          {trend && (
            <div className={`text-xs ${service.getTrendIndicator(trend).color}`}>
              {service.getTrendIndicator(trend).text}
            </div>
          )}
        </div>
        <div>
          <div className="text-muted-foreground">Threshold</div>
          <div className="font-medium">
            {service.formatThreshold(kpi.threshold, kpi.unit, kpi.type)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Priority</div>
          <div className="font-medium capitalize">{kpi.priority}</div>
        </div>
      </div>

      {onConfigureThreshold && (
        <div className="mt-3 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConfigureThreshold(kpi.id)}
            className="text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configure Threshold
          </Button>
        </div>
      )}
    </div>
  );
};

// KPI Status Indicator component
const KPIStatusIndicator: React.FC<{ 
  status: 'pass' | 'fail' | 'warning';
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  service: KPIComplianceService;
}> = ({ status, rationale, priority, service }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getPriorityBadge = () => {
    if (status === 'pass') return null;
    
    return (
      <Badge variant="outline" className={`text-xs ${service.getPriorityBadgeClass(priority)}`}>
        {priority} priority
      </Badge>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`p-2 border rounded-lg cursor-help transition-colors ${service.getKPIStatusBackground(status)}`}>
            <div className="flex items-center justify-between">
              {getStatusIcon()}
              {getPriorityBadge()}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">
              {status === 'pass' ? 'Compliant' :
               status === 'fail' ? 'Non-Compliant' : 'Warning'}
            </div>
            <div className="text-sm text-muted-foreground">
              {rationale}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 