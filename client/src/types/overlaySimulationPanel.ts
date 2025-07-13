// Block 26: Overlay Simulation Panel - Types
// TypeScript interfaces for overlay simulation panel and visualization

export interface SimulationPanel {
  id: string;
  name: string;
  description: string;
  
  // Configuration
  config: PanelConfig;
  layout: PanelLayout;
  widgets: SimulationWidget[];
  
  // Data
  simulation: SimulationData;
  results: SimulationResults;
  
  // State
  isActive: boolean;
  isVisible: boolean;
  isMaximized: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastRefresh: Date;
  
  // User preferences
  userSettings: UserSettings;
  
  // Real-time updates
  isRealTime: boolean;
  updateInterval: number;
  lastUpdate: Date;
}

export interface PanelConfig {
  // Display settings
  theme: 'light' | 'dark' | 'auto';
  colorScheme: ColorScheme;
  
  // Data settings
  timeRange: TimeRange;
  benchmarks: string[];
  baseCurrency: string;
  
  // Chart settings
  chartType: ChartType;
  showGrid: boolean;
  showLegend: boolean;
  showTooltips: boolean;
  
  // Performance settings
  autoRefresh: boolean;
  refreshInterval: number;
  
  // Export settings
  exportFormat: ExportFormat;
  includeMetadata: boolean;
  
  // Notification settings
  alertsEnabled: boolean;
  alertThresholds: AlertThreshold[];
}

export interface PanelLayout {
  type: 'single' | 'split' | 'grid' | 'tabbed';
  orientation: 'horizontal' | 'vertical';
  sections: LayoutSection[];
  
  // Responsive settings
  breakpoints: Breakpoint[];
  responsive: boolean;
  
  // Sizing
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface LayoutSection {
  id: string;
  title: string;
  type: SectionType;
  
  // Position and size
  position: Position;
  size: Size;
  
  // Content
  widgets: string[];
  
  // Behavior
  collapsible: boolean;
  resizable: boolean;
  movable: boolean;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}

export interface SimulationWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  
  // Configuration
  config: WidgetConfig;
  
  // Data
  dataSource: DataSource;
  filters: DataFilter[];
  
  // Layout
  position: Position;
  size: Size;
  
  // State
  isVisible: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastRefresh: Date;
}

export interface WidgetConfig {
  // Chart configuration
  chartConfig?: ChartConfig;
  
  // Table configuration
  tableConfig?: TableConfig;
  
  // Metrics configuration
  metricsConfig?: MetricsConfig;
  
  // Custom configuration
  customConfig?: Record<string, any>;
}

export interface ChartConfig {
  type: ChartType;
  data: ChartData;
  options: ChartOptions;
  
  // Styling
  colors: string[];
  theme: string;
  
  // Interactions
  zoomEnabled: boolean;
  panEnabled: boolean;
  crosshairEnabled: boolean;
  
  // Annotations
  annotations: ChartAnnotation[];
}

export interface ChartData {
  datasets: ChartDataset[];
  labels: string[];
  
  // Metadata
  startDate: Date;
  endDate: Date;
  frequency: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  
  // Styling
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  
  // Type-specific options
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  
  // Metadata
  type: 'line' | 'bar' | 'scatter' | 'area';
  yAxisID?: string;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  
  // Scales
  scales: ScaleOptions;
  
  // Plugins
  plugins: PluginOptions;
  
  // Interactions
  interaction: InteractionOptions;
}

export interface ScaleOptions {
  x: AxisOptions;
  y: AxisOptions;
  [key: string]: AxisOptions;
}

export interface AxisOptions {
  type: 'linear' | 'logarithmic' | 'category' | 'time';
  display: boolean;
  position: 'left' | 'right' | 'top' | 'bottom';
  
  // Styling
  title: {
    display: boolean;
    text: string;
  };
  
  // Formatting
  ticks: {
    callback?: (value: any) => string;
    format?: string;
  };
  
  // Range
  min?: number;
  max?: number;
  
  // Grid
  grid: {
    display: boolean;
    color: string;
  };
}

export interface PluginOptions {
  legend: {
    display: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  
  tooltip: {
    enabled: boolean;
    mode: 'point' | 'nearest' | 'x' | 'y';
  };
  
  title: {
    display: boolean;
    text: string;
  };
  
  zoom: {
    enabled: boolean;
    mode: 'x' | 'y' | 'xy';
  };
}

export interface InteractionOptions {
  mode: 'point' | 'nearest' | 'x' | 'y';
  intersect: boolean;
}

export interface ChartAnnotation {
  id: string;
  type: 'line' | 'box' | 'point' | 'label';
  value: any;
  label: string;
  color: string;
  
  // Positioning
  scaleID: string;
  
  // Styling
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
}

export interface TableConfig {
  columns: TableColumn[];
  sorting: TableSorting;
  filtering: TableFiltering;
  pagination: TablePagination;
  
  // Styling
  striped: boolean;
  hover: boolean;
  bordered: boolean;
  
  // Features
  exportable: boolean;
  searchable: boolean;
  selectable: boolean;
}

export interface TableColumn {
  id: string;
  header: string;
  accessor: string;
  
  // Formatting
  formatter?: (value: any) => string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'custom';
  
  // Styling
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align: 'left' | 'center' | 'right';
  
  // Behavior
  sortable: boolean;
  filterable: boolean;
  resizable: boolean;
  
  // Aggregation
  aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export interface TableSorting {
  column: string;
  direction: 'asc' | 'desc';
  multiSort: boolean;
}

export interface TableFiltering {
  enabled: boolean;
  filters: ColumnFilter[];
  globalFilter: string;
}

export interface ColumnFilter {
  column: string;
  operator: FilterOperator;
  value: any;
}

export interface TablePagination {
  enabled: boolean;
  pageSize: number;
  currentPage: number;
  totalItems: number;
  showSizeSelector: boolean;
  sizeOptions: number[];
}

export interface MetricsConfig {
  metrics: MetricDefinition[];
  layout: 'cards' | 'table' | 'list';
  
  // Formatting
  precision: number;
  showPercentage: boolean;
  showTrend: boolean;
  showSparkline: boolean;
  
  // Comparison
  compareWith: string[];
  showComparison: boolean;
  
  // Alerts
  alertsEnabled: boolean;
  alertThresholds: AlertThreshold[];
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  formula: string;
  
  // Formatting
  format: string;
  unit: string;
  precision: number;
  
  // Visualization
  color: string;
  icon?: string;
  
  // Thresholds
  thresholds: MetricThreshold[];
  
  // Metadata
  category: string;
  tags: string[];
}

export interface MetricThreshold {
  level: 'low' | 'medium' | 'high';
  value: number;
  operator: '>' | '<' | '=' | '>=' | '<=';
  color: string;
  message: string;
}

export interface AlertThreshold {
  id: string;
  metric: string;
  condition: AlertCondition;
  
  // Notification
  enabled: boolean;
  message: string;
  priority: 'low' | 'medium' | 'high';
  
  // Delivery
  channels: string[];
  
  // Metadata
  createdAt: Date;
  lastTriggered?: Date;
}

export interface AlertCondition {
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
  duration?: number; // in minutes
  consecutive?: boolean;
}

export interface SimulationData {
  id: string;
  name: string;
  description: string;
  
  // Configuration
  parameters: SimulationParameters;
  
  // Time series data
  timeSeries: TimeSeries[];
  
  // Performance data
  performance: PerformanceData;
  
  // Risk data
  risk: RiskData;
  
  // Trade data
  trades: TradeData[];
  
  // Benchmark data
  benchmarks: BenchmarkData[];
  
  // Metadata
  startDate: Date;
  endDate: Date;
  frequency: string;
  baseCurrency: string;
  
  // Status
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  
  // Results
  results: SimulationResults;
}

export interface SimulationParameters {
  // Portfolio settings
  initialCapital: number;
  cashAllocation: number;
  rebalanceFrequency: string;
  
  // Risk settings
  maxDrawdown: number;
  riskBudget: number;
  stopLoss: number;
  
  // Cost settings
  transactionCosts: number;
  managementFee: number;
  performanceFee: number;
  
  // Other settings
  includeDividends: boolean;
  reinvestDividends: boolean;
  taxRate: number;
  
  // Simulation settings
  monteCarlo: boolean;
  scenarios: number;
  randomSeed: number;
}

export interface TimeSeries {
  date: Date;
  values: TimeSeriesValue[];
}

export interface TimeSeriesValue {
  series: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface PerformanceData {
  // Returns
  totalReturn: number;
  annualizedReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  
  // Risk-adjusted returns
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  informationRatio: number;
  
  // Volatility
  volatility: number;
  downside: number;
  upside: number;
  
  // Drawdown
  maxDrawdown: number;
  averageDrawdown: number;
  drawdownDuration: number;
  
  // Win/Loss
  winRate: number;
  lossRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  
  // Periods
  bestPeriod: PeriodPerformance;
  worstPeriod: PeriodPerformance;
  
  // Monthly/Yearly breakdown
  monthlyReturns: MonthlyReturn[];
  yearlyReturns: YearlyReturn[];
}

export interface PeriodPerformance {
  period: string;
  return: number;
  startDate: Date;
  endDate: Date;
}

export interface MonthlyReturn {
  date: Date;
  return: number;
  benchmark: number;
  excess: number;
}

export interface YearlyReturn {
  year: number;
  return: number;
  benchmark: number;
  excess: number;
}

export interface RiskData {
  // Value at Risk
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  
  // Beta analysis
  beta: number;
  alpha: number;
  correlation: number;
  
  // Risk decomposition
  systematicRisk: number;
  specificRisk: number;
  
  // Concentration risk
  concentration: ConcentrationRisk;
  
  // Stress testing
  stressTesting: StressTestResult[];
}

export interface ConcentrationRisk {
  herfindahl: number;
  effectiveN: number;
  topPositions: number;
  maxWeight: number;
  
  // Sector concentration
  sectorConcentration: SectorConcentration[];
  
  // Country concentration
  countryConcentration: CountryConcentration[];
}

export interface SectorConcentration {
  sector: string;
  weight: number;
  contribution: number;
}

export interface CountryConcentration {
  country: string;
  weight: number;
  contribution: number;
}

export interface StressTestResult {
  scenario: string;
  impact: number;
  probability: number;
  description: string;
}

export interface TradeData {
  id: string;
  date: Date;
  symbol: string;
  
  // Trade details
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  
  // Costs
  commission: number;
  fees: number;
  
  // Performance
  pnl: number;
  pnlPercent: number;
  
  // Metadata
  strategy: string;
  signal: string;
  confidence: number;
}

export interface BenchmarkData {
  id: string;
  name: string;
  symbol: string;
  
  // Performance
  returns: number[];
  dates: Date[];
  
  // Comparison
  correlation: number;
  beta: number;
  alpha: number;
  
  // Metadata
  description: string;
  category: string;
  currency: string;
}

export interface SimulationResults {
  // Summary
  summary: ResultSummary;
  
  // Detailed results
  performance: PerformanceResults;
  risk: RiskResults;
  attribution: AttributionResults;
  
  // Visualizations
  charts: ChartResult[];
  tables: TableResult[];
  
  // Reports
  reports: ReportResult[];
  
  // Metadata
  generatedAt: Date;
  executionTime: number;
  version: string;
}

export interface ResultSummary {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  
  // Key insights
  keyInsights: string[];
  
  // Recommendations
  recommendations: string[];
  
  // Warnings
  warnings: string[];
}

export interface PerformanceResults {
  // Time series
  equity: EquityPoint[];
  returns: ReturnPoint[];
  drawdown: DrawdownPoint[];
  
  // Statistics
  statistics: PerformanceStatistic[];
  
  // Comparisons
  comparisons: ComparisonResult[];
}

export interface EquityPoint {
  date: Date;
  value: number;
  benchmark: number;
  drawdown: number;
}

export interface ReturnPoint {
  date: Date;
  return: number;
  benchmark: number;
  excess: number;
}

export interface DrawdownPoint {
  date: Date;
  drawdown: number;
  duration: number;
  recovery: number;
}

export interface PerformanceStatistic {
  name: string;
  value: number;
  benchmark?: number;
  percentile?: number;
  description: string;
}

export interface ComparisonResult {
  name: string;
  value: number;
  benchmark: number;
  difference: number;
  significant: boolean;
}

export interface RiskResults {
  // Risk metrics
  metrics: RiskMetric[];
  
  // Decomposition
  decomposition: RiskDecomposition;
  
  // Scenarios
  scenarios: ScenarioResult[];
}

export interface RiskMetric {
  name: string;
  value: number;
  percentile: number;
  interpretation: string;
}

export interface RiskDecomposition {
  systematic: number;
  specific: number;
  
  // Factor exposure
  factors: FactorExposure[];
  
  // Sector exposure
  sectors: SectorExposure[];
}

export interface FactorExposure {
  factor: string;
  exposure: number;
  contribution: number;
}

export interface SectorExposure {
  sector: string;
  exposure: number;
  contribution: number;
}

export interface ScenarioResult {
  scenario: string;
  impact: number;
  probability: number;
  description: string;
}

export interface AttributionResults {
  // Performance attribution
  performance: PerformanceAttribution[];
  
  // Risk attribution
  risk: RiskAttribution[];
  
  // Factor attribution
  factors: FactorAttribution[];
}

export interface PerformanceAttribution {
  component: string;
  contribution: number;
  weight: number;
  return: number;
}

export interface RiskAttribution {
  component: string;
  contribution: number;
  weight: number;
  risk: number;
}

export interface FactorAttribution {
  factor: string;
  exposure: number;
  contribution: number;
  return: number;
}

export interface ChartResult {
  id: string;
  title: string;
  type: ChartType;
  data: any;
  config: any;
}

export interface TableResult {
  id: string;
  title: string;
  columns: string[];
  data: any[];
  config: any;
}

export interface ReportResult {
  id: string;
  title: string;
  type: 'summary' | 'detailed' | 'compliance' | 'risk';
  content: string;
  format: 'html' | 'pdf' | 'json';
  
  // Metadata
  generatedAt: Date;
  template: string;
  parameters: Record<string, any>;
}

export interface UserSettings {
  // Display preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  
  // Data preferences
  baseCurrency: string;
  dateFormat: string;
  numberFormat: string;
  
  // Panel preferences
  defaultLayout: string;
  autoSave: boolean;
  autoRefresh: boolean;
  
  // Notification preferences
  notifications: boolean;
  emailAlerts: boolean;
  pushNotifications: boolean;
  
  // Export preferences
  defaultExportFormat: ExportFormat;
  includeCharts: boolean;
  includeData: boolean;
}

// Common types
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
  period: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  
  // Chart colors
  positive: string;
  negative: string;
  neutral: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  layout: PanelLayout;
}

export interface DataSource {
  type: 'simulation' | 'historical' | 'real-time' | 'synthetic';
  source: string;
  
  // Parameters
  parameters: Record<string, any>;
  
  // Caching
  cacheable: boolean;
  cacheKey?: string;
  cacheDuration?: number;
  
  // Refresh
  refreshable: boolean;
  refreshInterval?: number;
  lastRefresh?: Date;
}

export interface DataFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  active: boolean;
}

// Enums
export type ChartType = 
  | 'line'
  | 'bar'
  | 'area'
  | 'scatter'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'heatmap'
  | 'treemap'
  | 'candlestick'
  | 'ohlc'
  | 'waterfall'
  | 'funnel'
  | 'gauge'
  | 'sparkline';

export type WidgetType = 
  | 'chart'
  | 'table'
  | 'metrics'
  | 'text'
  | 'image'
  | 'iframe'
  | 'custom';

export type SectionType = 
  | 'header'
  | 'content'
  | 'sidebar'
  | 'footer'
  | 'modal'
  | 'tab'
  | 'accordion';

export type ExportFormat = 
  | 'pdf'
  | 'png'
  | 'jpeg'
  | 'svg'
  | 'csv'
  | 'excel'
  | 'json'
  | 'html';

export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_null'
  | 'is_not_null'
  | 'in'
  | 'not_in';

// Error types
export class PanelError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'PanelError';
  }
}

export class WidgetError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'WidgetError';
  }
}

export class DataError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'DataError';
  }
} 