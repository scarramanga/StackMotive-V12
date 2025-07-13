// Block 84: Export to PDF Snapshot - Types
// PDF Generation for Portfolio Reports and Analytics

export interface PDFSnapshot {
  id: string;
  userId: string;
  
  // Snapshot identification
  snapshotName: string;
  description?: string;
  
  // Content configuration
  content: PDFContent;
  
  // Template and styling
  template: PDFTemplate;
  styling: PDFStyling;
  
  // Generation settings
  generationConfig: GenerationConfig;
  
  // Status and metadata
  status: ExportStatus;
  createdAt: Date;
  generatedAt?: Date;
  expiresAt?: Date;
  
  // File information
  fileInfo?: PDFFileInfo;
  
  // AU/NZ specific
  auNzSettings?: AUNZPDFSettings;
  
  // Sharing and access
  sharingConfig: SharingConfig;
}

export interface PDFContent {
  // Content sections
  sections: PDFSection[];
  
  // Data sources
  dataSources: DataSource[];
  
  // Portfolio data
  portfolioData: PortfolioSnapshot;
  
  // Charts and visualizations
  charts: ChartConfig[];
  
  // Tables and data grids
  tables: TableConfig[];
  
  // Text content
  textBlocks: TextBlock[];
  
  // Images and media
  images: ImageConfig[];
  
  // Headers and footers
  header?: HeaderFooterConfig;
  footer?: HeaderFooterConfig;
  
  // Appendices
  appendices: AppendixConfig[];
}

export interface PDFSection {
  id: string;
  sectionType: SectionType;
  title: string;
  order: number;
  
  // Section configuration
  isEnabled: boolean;
  isRequired: boolean;
  
  // Content
  content: SectionContent;
  
  // Styling
  styling: SectionStyling;
  
  // Page settings
  pageBreak: PageBreakConfig;
  
  // Conditional rendering
  conditions?: RenderingCondition[];
}

export type SectionType = 
  | 'cover_page'
  | 'executive_summary'
  | 'portfolio_overview'
  | 'holdings_detail'
  | 'performance_analysis'
  | 'risk_analysis'
  | 'asset_allocation'
  | 'transactions_summary'
  | 'tax_summary'
  | 'compliance_report'
  | 'market_commentary'
  | 'recommendations'
  | 'appendix'
  | 'custom';

export interface SectionContent {
  // Data elements
  dataElements: DataElement[];
  
  // Charts
  charts: string[]; // Chart IDs
  
  // Tables
  tables: string[]; // Table IDs
  
  // Text content
  textBlocks: string[]; // Text block IDs
  
  // Custom content
  customContent?: Record<string, any>;
}

export interface DataElement {
  elementId: string;
  elementType: DataElementType;
  label: string;
  value: any;
  
  // Formatting
  format: DataFormat;
  
  // Display settings
  displaySettings: DisplaySettings;
  
  // Conditions
  conditions?: RenderingCondition[];
}

export type DataElementType = 
  | 'metric'
  | 'percentage'
  | 'currency'
  | 'date'
  | 'text'
  | 'number'
  | 'boolean'
  | 'list'
  | 'calculation';

export interface DataFormat {
  formatType: FormatType;
  precision?: number;
  currency?: string;
  dateFormat?: string;
  thousandsSeparator?: string;
  decimalSeparator?: string;
  prefix?: string;
  suffix?: string;
}

export type FormatType = 'number' | 'currency' | 'percentage' | 'date' | 'text' | 'custom';

export interface DisplaySettings {
  fontSize: number;
  fontWeight: FontWeight;
  color: string;
  alignment: TextAlignment;
  padding: Padding;
  margin: Margin;
}

export type FontWeight = 'normal' | 'bold' | 'lighter' | 'bolder';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface PDFTemplate {
  id: string;
  templateName: string;
  templateType: TemplateType;
  
  // Template configuration
  layout: LayoutConfig;
  
  // Default sections
  defaultSections: string[]; // Section IDs
  
  // Branding
  branding: BrandingConfig;
  
  // AU/NZ specific
  jurisdiction?: 'AU' | 'NZ';
  complianceTemplate?: boolean;
  
  // Template metadata
  version: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateType = 
  | 'standard_report'
  | 'executive_summary'
  | 'detailed_analysis'
  | 'tax_report'
  | 'compliance_report'
  | 'performance_report'
  | 'risk_report'
  | 'client_statement'
  | 'custom';

export interface LayoutConfig {
  // Page settings
  pageSize: PageSize;
  orientation: PageOrientation;
  margins: PageMargins;
  
  // Grid system
  columns: number;
  columnGap: number;
  
  // Sections layout
  sectionLayout: SectionLayoutType;
  
  // Typography
  typography: TypographyConfig;
  
  // Colors
  colorScheme: ColorScheme;
}

export type PageSize = 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
export type PageOrientation = 'portrait' | 'landscape';
export type SectionLayoutType = 'single_column' | 'two_column' | 'grid' | 'custom';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TypographyConfig {
  primaryFont: string;
  secondaryFont: string;
  headingFont?: string;
  
  // Font sizes
  fontSize: FontSizeConfig;
  
  // Line spacing
  lineHeight: number;
  
  // Letter spacing
  letterSpacing: number;
}

export interface FontSizeConfig {
  h1: number;
  h2: number;
  h3: number;
  body: number;
  small: number;
  caption: number;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
  success: string;
  warning: string;
  error: string;
}

export interface BrandingConfig {
  // Logo
  logo?: LogoConfig;
  
  // Company information
  companyName: string;
  companyInfo?: CompanyInfo;
  
  // Colors
  brandColors: BrandColors;
  
  // Watermark
  watermark?: WatermarkConfig;
  
  // Disclaimer
  disclaimer?: DisclaimerConfig;
}

export interface LogoConfig {
  imageUrl: string;
  position: LogoPosition;
  size: LogoSize;
  opacity?: number;
}

export type LogoPosition = 'header_left' | 'header_center' | 'header_right' | 'footer_left' | 'footer_center' | 'footer_right';
export type LogoSize = 'small' | 'medium' | 'large' | 'custom';

export interface CompanyInfo {
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  abn?: string; // Australian Business Number
  nzbn?: string; // New Zealand Business Number
  afslNumber?: string; // Australian Financial Services License
  fspNumber?: string; // Financial Service Provider (NZ)
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface WatermarkConfig {
  text: string;
  opacity: number;
  fontSize: number;
  rotation: number;
  position: WatermarkPosition;
}

export type WatermarkPosition = 'center' | 'diagonal' | 'bottom_right' | 'custom';

export interface DisclaimerConfig {
  text: string;
  position: DisclaimerPosition;
  fontSize: number;
  includePage?: boolean;
}

export type DisclaimerPosition = 'footer' | 'last_page' | 'every_page';

export interface PDFStyling {
  // Global styling
  globalStyles: GlobalStyles;
  
  // Section-specific styling
  sectionStyles: Record<string, SectionStyling>;
  
  // Element styling
  elementStyles: Record<string, ElementStyling>;
  
  // Custom CSS
  customCSS?: string;
}

export interface GlobalStyles {
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  borderColor: string;
  
  // Typography
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  
  // Spacing
  basePadding: number;
  baseMargin: number;
}

export interface SectionStyling {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: BorderStyle;
  
  // Spacing
  padding: Padding;
  margin: Margin;
  
  // Typography
  titleStyling: TextStyling;
  contentStyling: TextStyling;
}

export type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted';

export interface ElementStyling {
  // Visual properties
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  
  // Typography
  textStyling: TextStyling;
  
  // Spacing
  padding: Padding;
  margin: Margin;
  
  // Position
  position?: PositionConfig;
}

export interface TextStyling {
  fontFamily?: string;
  fontSize: number;
  fontWeight: FontWeight;
  color: string;
  textAlign: TextAlignment;
  textDecoration?: TextDecoration;
  lineHeight?: number;
}

export type TextDecoration = 'none' | 'underline' | 'overline' | 'line-through';

export interface PositionConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GenerationConfig {
  // Output settings
  outputFormat: OutputFormat;
  quality: PDFQuality;
  compression: CompressionConfig;
  
  // Security settings
  security: SecurityConfig;
  
  // Metadata
  metadata: PDFMetadata;
  
  // Generation options
  options: GenerationOptions;
  
  // AU/NZ specific
  auNzCompliance?: ComplianceConfig;
}

export type OutputFormat = 'pdf' | 'pdf_a1' | 'pdf_a2' | 'pdf_a3';

export interface PDFQuality {
  dpi: number;
  imageQuality: ImageQuality;
  fontEmbedding: boolean;
  vectorGraphics: boolean;
}

export type ImageQuality = 'low' | 'medium' | 'high' | 'maximum';

export interface CompressionConfig {
  enableCompression: boolean;
  compressionLevel: CompressionLevel;
  imageCompression: boolean;
  fontCompression: boolean;
}

export type CompressionLevel = 'none' | 'low' | 'medium' | 'high' | 'maximum';

export interface SecurityConfig {
  // Password protection
  passwordProtection: boolean;
  userPassword?: string;
  ownerPassword?: string;
  
  // Permissions
  permissions: PDFPermissions;
  
  // Digital signature
  digitalSignature?: DigitalSignatureConfig;
  
  // Encryption
  encryption: EncryptionConfig;
}

export interface PDFPermissions {
  allowPrinting: boolean;
  allowCopying: boolean;
  allowModification: boolean;
  allowAnnotation: boolean;
  allowFormFilling: boolean;
  allowScreenReading: boolean;
  allowAssembly: boolean;
  allowDegradedPrinting: boolean;
}

export interface DigitalSignatureConfig {
  enabled: boolean;
  certificatePath?: string;
  signatureReason?: string;
  signatureLocation?: string;
  contactInfo?: string;
}

export interface EncryptionConfig {
  enabled: boolean;
  encryptionLevel: EncryptionLevel;
  algorithm?: string;
}

export type EncryptionLevel = 'none' | 'low' | 'medium' | 'high';

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  
  // Custom metadata
  customMetadata: Record<string, string>;
  
  // AU/NZ specific
  jurisdiction?: 'AU' | 'NZ';
  reportType?: string;
  complianceVersion?: string;
}

export interface GenerationOptions {
  // Performance
  enableParallelProcessing: boolean;
  maxConcurrentJobs: number;
  
  // Caching
  enableCaching: boolean;
  cacheExpiry: number; // hours
  
  // Error handling
  continueOnError: boolean;
  includeErrorReport: boolean;
  
  // Preview
  generatePreview: boolean;
  previewPageCount?: number;
  
  // Accessibility
  enableAccessibility: boolean;
  includeStructureTags: boolean;
  
  // Optimization
  optimizeForWeb: boolean;
  optimizeForPrint: boolean;
}

export interface ComplianceConfig {
  // Regulatory compliance
  includeDisclosures: boolean;
  includeRiskWarnings: boolean;
  includePerformanceDisclaimer: boolean;
  
  // AU specific
  includeAFSLDetails?: boolean;
  includeSOADisclaimer?: boolean;
  includeProductDisclosure?: boolean;
  
  // NZ specific
  includeFSPDetails?: boolean;
  includeFMAWarnings?: boolean;
  includeInvestmentDisclaimer?: boolean;
  
  // Data privacy
  includePrivacyStatement: boolean;
  dataRetentionNotice: boolean;
}

export type ExportStatus = 
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface PDFFileInfo {
  fileName: string;
  filePath: string;
  fileSize: number; // bytes
  mimeType: string;
  
  // Download info
  downloadUrl?: string;
  downloadExpiry?: Date;
  downloadCount: number;
  
  // Storage info
  storageLocation: StorageLocation;
  
  // Version info
  version: number;
  checksum: string;
}

export type StorageLocation = 'local' | 's3' | 'azure' | 'gcp' | 'custom';

export interface AUNZPDFSettings {
  // Jurisdiction
  jurisdiction: 'AU' | 'NZ';
  
  // Currency formatting
  currencySettings: CurrencySettings;
  
  // Date formatting
  dateSettings: DateSettings;
  
  // Tax information
  taxSettings: TaxSettings;
  
  // Regulatory requirements
  regulatorySettings: RegulatorySettings;
  
  // Language settings
  languageSettings: LanguageSettings;
}

export interface CurrencySettings {
  baseCurrency: string;
  displaySymbol: boolean;
  thousandsSeparator: string;
  decimalSeparator: string;
  decimalPlaces: number;
  
  // Multi-currency
  showCurrencyConversions: boolean;
  exchangeRateDate?: Date;
  exchangeRateSource?: string;
}

export interface DateSettings {
  dateFormat: string;
  timeZone: string;
  includeTime: boolean;
  
  // Financial year settings
  financialYearStart: string; // MM-DD format
  showFinancialYear: boolean;
}

export interface TaxSettings {
  // AU settings
  includeFrankingCredits?: boolean;
  includeCGTCalculations?: boolean;
  includeABN?: boolean;
  includeTFN?: boolean;
  
  // NZ settings
  includeIRDNumber?: boolean;
  includeFIFCalculations?: boolean;
  includePIEDistributions?: boolean;
  
  // General
  includeTaxDisclaimer: boolean;
  taxYearFormat: string;
}

export interface RegulatorySettings {
  // AU regulations
  afslNumber?: string;
  includeCorpActDisclosure?: boolean;
  includeSOAWarning?: boolean;
  
  // NZ regulations
  fspNumber?: string;
  includeFMAWarning?: boolean;
  includeInvestmentWarning?: boolean;
  
  // General
  includeRiskWarning: boolean;
  includePerformanceWarning: boolean;
  includeGeneralAdviceWarning: boolean;
}

export interface LanguageSettings {
  primaryLanguage: string;
  includeTranslations: boolean;
  currencyNames: Record<string, string>;
  dateNames: Record<string, string>;
}

export interface SharingConfig {
  // Sharing settings
  isShareable: boolean;
  shareExpiry?: Date;
  
  // Access control
  accessLevel: AccessLevel;
  allowedUsers: string[];
  allowedRoles: string[];
  
  // Download settings
  allowDownload: boolean;
  downloadLimit?: number;
  
  // Link sharing
  enableLinkSharing: boolean;
  shareableLink?: string;
  linkExpiry?: Date;
  
  // Notifications
  notifyOnAccess: boolean;
  notifyOnDownload: boolean;
}

export type AccessLevel = 'public' | 'private' | 'restricted' | 'organization_only';

export interface DataSource {
  sourceId: string;
  sourceType: DataSourceType;
  sourceName: string;
  
  // Connection info
  connectionConfig: DataSourceConnection;
  
  // Data mapping
  fieldMappings: FieldMapping[];
  
  // Filters
  filters: DataFilter[];
  
  // Refresh settings
  refreshConfig: RefreshConfig;
}

export type DataSourceType = 
  | 'portfolio'
  | 'market_data'
  | 'transactions'
  | 'performance'
  | 'risk_analysis'
  | 'asset_allocation'
  | 'benchmarks'
  | 'custom_query'
  | 'external_api';

export interface DataSourceConnection {
  // Connection details
  endpoint?: string;
  apiKey?: string;
  
  // Query parameters
  parameters: Record<string, any>;
  
  // Date range
  dateRange: DateRange;
  
  // Filters
  includeFilters: boolean;
  filterCriteria: FilterCriteria[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  relativePeriod?: RelativePeriod;
}

export type RelativePeriod = 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'ytd' | 'custom';

export interface FilterCriteria {
  field: string;
  operator: FilterOperator;
  value: any;
  dataType: string;
}

export type FilterOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'in_list';

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: FieldTransformation;
  isRequired: boolean;
}

export interface FieldTransformation {
  transformationType: TransformationType;
  parameters: Record<string, any>;
}

export type TransformationType = 
  | 'format_currency'
  | 'format_percentage'
  | 'format_date'
  | 'calculate_total'
  | 'calculate_average'
  | 'calculate_change'
  | 'lookup_value'
  | 'custom_formula';

export interface DataFilter {
  filterId: string;
  filterName: string;
  isEnabled: boolean;
  
  // Filter logic
  conditions: FilterCondition[];
  logicalOperator: LogicalOperator;
}

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  dataType: string;
}

export type LogicalOperator = 'AND' | 'OR';

export interface RefreshConfig {
  autoRefresh: boolean;
  refreshInterval?: number; // minutes
  lastRefresh?: Date;
  
  // Cache settings
  enableCaching: boolean;
  cacheExpiry?: number; // minutes
}

export interface PortfolioSnapshot {
  // Portfolio identification
  portfolioId: string;
  portfolioName: string;
  snapshotDate: Date;
  
  // Holdings
  holdings: HoldingSnapshot[];
  
  // Performance
  performance: PerformanceSnapshot;
  
  // Risk metrics
  riskMetrics: RiskSnapshot;
  
  // Allocation
  allocation: AllocationSnapshot;
  
  // Transactions (if included)
  recentTransactions?: TransactionSnapshot[];
  
  // Summary metrics
  summaryMetrics: SummaryMetrics;
}

export interface HoldingSnapshot {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  weight: number; // percentage of portfolio
  
  // Performance
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  
  // Asset details
  assetClass: string;
  sector?: string;
  country?: string;
  currency: string;
  
  // AU/NZ specific
  frankedDividendYield?: number; // AU
  imputation?: number; // NZ
}

export interface PerformanceSnapshot {
  // Returns
  returns: PerformanceReturns;
  
  // Benchmarks
  benchmarkComparison: BenchmarkComparison[];
  
  // Risk-adjusted metrics
  riskAdjustedMetrics: RiskAdjustedMetrics;
  
  // Attribution
  attribution?: PerformanceAttribution;
}

export interface PerformanceReturns {
  daily: number;
  weekly: number;
  monthly: number;
  quarterly: number;
  yearly: number;
  ytd: number;
  
  // Since inception
  sinceInception: number;
  sinceInceptionAnnualized: number;
  
  // Custom periods
  customPeriods?: CustomPeriodReturn[];
}

export interface CustomPeriodReturn {
  periodName: string;
  startDate: Date;
  endDate: Date;
  return: number;
  annualizedReturn?: number;
}

export interface BenchmarkComparison {
  benchmarkName: string;
  benchmarkReturn: number;
  portfolioReturn: number;
  outperformance: number;
  trackingError: number;
  informationRatio: number;
}

export interface RiskAdjustedMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  treynorRatio: number;
  jensenAlpha: number;
  beta: number;
}

export interface PerformanceAttribution {
  assetAllocation: AttributionEffect;
  stockSelection: AttributionEffect;
  interaction: AttributionEffect;
  total: AttributionEffect;
}

export interface AttributionEffect {
  effect: number;
  contribution: number;
}

export interface RiskSnapshot {
  // Volatility
  volatility: VolatilityMetrics;
  
  // VaR metrics
  valueAtRisk: VaRMetrics;
  
  // Drawdown
  drawdownMetrics: DrawdownMetrics;
  
  // Concentration
  concentrationRisk: ConcentrationMetrics;
  
  // Correlation
  correlationMetrics: CorrelationMetrics;
}

export interface VolatilityMetrics {
  dailyVolatility: number;
  monthlyVolatility: number;
  annualizedVolatility: number;
  
  // Relative volatility
  relativeVolatility: number;
  trackingError: number;
}

export interface VaRMetrics {
  var1Day: number;
  var1Week: number;
  var1Month: number;
  
  // Conditional VaR
  cvar1Day: number;
  cvar1Week: number;
  cvar1Month: number;
}

export interface DrawdownMetrics {
  currentDrawdown: number;
  maxDrawdown: number;
  maxDrawdownDuration: number; // days
  averageDrawdown: number;
  recoveryTime: number; // days
}

export interface ConcentrationMetrics {
  topHoldingsConcentration: number;
  sectorConcentration: number;
  countryConcentration: number;
  currencyConcentration: number;
  
  // Herfindahl index
  herfindahlIndex: number;
}

export interface CorrelationMetrics {
  portfolioCorrelation: number;
  averageCorrelation: number;
  maxCorrelation: number;
  minCorrelation: number;
}

export interface AllocationSnapshot {
  // Asset class allocation
  assetClassAllocation: AllocationBreakdown[];
  
  // Sector allocation
  sectorAllocation: AllocationBreakdown[];
  
  // Geographic allocation
  geographicAllocation: AllocationBreakdown[];
  
  // Currency allocation
  currencyAllocation: AllocationBreakdown[];
  
  // Custom allocations
  customAllocations?: CustomAllocation[];
}

export interface AllocationBreakdown {
  category: string;
  value: number;
  weight: number; // percentage
  
  // Benchmark comparison
  benchmarkWeight?: number;
  activeWeight?: number; // difference from benchmark
  
  // Performance contribution
  contribution?: number;
}

export interface CustomAllocation {
  allocationName: string;
  breakdown: AllocationBreakdown[];
}

export interface TransactionSnapshot {
  date: Date;
  type: TransactionType;
  symbol: string;
  quantity: number;
  price: number;
  value: number;
  
  // Transaction details
  fees?: number;
  taxes?: number;
  notes?: string;
  
  // AU/NZ specific
  frankingCredit?: number; // AU
  imputation?: number; // NZ
}

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'interest' | 'fee' | 'tax' | 'corporate_action';

export interface SummaryMetrics {
  // Portfolio totals
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;
  
  // Counts
  holdingCount: number;
  assetClassCount: number;
  sectorCount: number;
  countryCount: number;
  
  // Average metrics
  averageHolding: number;
  averageWeight: number;
  
  // Risk metrics
  portfolioVolatility: number;
  portfolioBeta: number;
  sharpeRatio: number;
  
  // Allocation metrics
  cashWeight: number;
  equityWeight: number;
  bondWeight: number;
  alternativeWeight: number;
}

export interface ChartConfig {
  chartId: string;
  chartType: ChartType;
  title: string;
  
  // Data configuration
  dataSource: string; // Data source ID
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  
  // Series configuration
  series: SeriesConfig[];
  
  // Styling
  styling: ChartStyling;
  
  // Layout
  layout: ChartLayout;
  
  // Export settings
  exportSettings: ChartExportSettings;
}

export type ChartType = 
  | 'line'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'area'
  | 'scatter'
  | 'treemap'
  | 'sunburst'
  | 'waterfall'
  | 'gauge'
  | 'heatmap';

export interface AxisConfig {
  label: string;
  field: string;
  dataType: AxisDataType;
  
  // Formatting
  format?: DataFormat;
  
  // Range
  min?: number;
  max?: number;
  
  // Ticks
  tickInterval?: number;
  tickCount?: number;
}

export type AxisDataType = 'number' | 'date' | 'category' | 'percentage';

export interface SeriesConfig {
  seriesId: string;
  name: string;
  field: string;
  
  // Visual properties
  color: string;
  lineWidth?: number;
  fillOpacity?: number;
  
  // Data processing
  aggregation?: AggregationType;
  transformation?: SeriesTransformation;
}

export type AggregationType = 'sum' | 'average' | 'count' | 'min' | 'max' | 'median';

export interface SeriesTransformation {
  transformationType: TransformationType;
  parameters: Record<string, any>;
}

export interface ChartStyling {
  width: number;
  height: number;
  backgroundColor: string;
  
  // Typography
  titleStyling: TextStyling;
  labelStyling: TextStyling;
  
  // Colors
  colorPalette: string[];
  
  // Borders
  borderColor: string;
  borderWidth: number;
  
  // Grid
  showGrid: boolean;
  gridColor: string;
  
  // Legend
  showLegend: boolean;
  legendPosition: LegendPosition;
}

export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ChartLayout {
  // Position
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Alignment
  horizontalAlignment: HorizontalAlignment;
  verticalAlignment: VerticalAlignment;
  
  // Spacing
  padding: Padding;
  margin: Margin;
}

export type HorizontalAlignment = 'left' | 'center' | 'right';
export type VerticalAlignment = 'top' | 'middle' | 'bottom';

export interface ChartExportSettings {
  dpi: number;
  format: ImageFormat;
  backgroundColor: string;
  transparent: boolean;
}

export type ImageFormat = 'png' | 'jpeg' | 'svg' | 'pdf';

export interface TableConfig {
  tableId: string;
  title: string;
  
  // Data configuration
  dataSource: string; // Data source ID
  
  // Columns
  columns: ColumnConfig[];
  
  // Rows
  rowConfig: RowConfig;
  
  // Styling
  styling: TableStyling;
  
  // Layout
  layout: TableLayout;
  
  // Features
  features: TableFeatures;
}

export interface ColumnConfig {
  columnId: string;
  header: string;
  field: string;
  dataType: ColumnDataType;
  
  // Formatting
  format?: DataFormat;
  
  // Width
  width: ColumnWidth;
  
  // Alignment
  alignment: TextAlignment;
  
  // Aggregation
  aggregation?: AggregationType;
  
  // Conditional formatting
  conditionalFormatting?: ConditionalFormatting[];
}

export type ColumnDataType = 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean';

export interface ColumnWidth {
  type: WidthType;
  value: number;
}

export type WidthType = 'fixed' | 'percentage' | 'auto';

export interface ConditionalFormatting {
  condition: FormattingCondition;
  styling: ElementStyling;
}

export interface FormattingCondition {
  operator: FilterOperator;
  value: any;
  dataType: string;
}

export interface RowConfig {
  // Grouping
  groupBy?: string[];
  
  // Sorting
  sortBy?: SortConfig[];
  
  // Filtering
  filters?: DataFilter[];
  
  // Pagination
  pagination?: PaginationConfig;
  
  // Aggregation rows
  includeSubtotals: boolean;
  includeTotals: boolean;
}

export interface SortConfig {
  field: string;
  direction: SortDirection;
  priority: number;
}

export type SortDirection = 'asc' | 'desc';

export interface PaginationConfig {
  pageSize: number;
  showPageNumbers: boolean;
  maxPages?: number;
}

export interface TableStyling {
  // Table styling
  borderColor: string;
  borderWidth: number;
  borderStyle: BorderStyle;
  
  // Header styling
  headerStyling: ElementStyling;
  
  // Row styling
  rowStyling: ElementStyling;
  alternateRowStyling?: ElementStyling;
  
  // Cell styling
  cellStyling: ElementStyling;
  
  // Font styling
  fontStyling: TextStyling;
}

export interface TableLayout {
  // Position
  x: number;
  y: number;
  width: number;
  
  // Layout type
  layoutType: TableLayoutType;
  
  // Spacing
  cellPadding: Padding;
  cellSpacing: number;
  
  // Overflow handling
  overflowHandling: OverflowHandling;
}

export type TableLayoutType = 'fixed' | 'auto' | 'responsive';
export type OverflowHandling = 'clip' | 'wrap' | 'scroll' | 'new_page';

export interface TableFeatures {
  // Sorting
  enableSorting: boolean;
  
  // Filtering
  enableFiltering: boolean;
  
  // Search
  enableSearch: boolean;
  
  // Export
  enableExport: boolean;
  
  // Row selection
  enableRowSelection: boolean;
  
  // Grouping
  enableGrouping: boolean;
  
  // Freeze columns
  freezeColumns: number;
}

export interface TextBlock {
  textId: string;
  content: string;
  
  // Content type
  contentType: ContentType;
  
  // Styling
  styling: TextStyling;
  
  // Layout
  layout: TextLayout;
  
  // Dynamic content
  isDynamic: boolean;
  dynamicFields?: DynamicField[];
  
  // Conditions
  conditions?: RenderingCondition[];
}

export type ContentType = 'plain_text' | 'rich_text' | 'markdown' | 'html';

export interface TextLayout {
  // Position
  x: number;
  y: number;
  width: number;
  height?: number;
  
  // Flow
  flowType: TextFlowType;
  
  // Spacing
  padding: Padding;
  margin: Margin;
  
  // Alignment
  alignment: TextAlignment;
  verticalAlignment: VerticalAlignment;
}

export type TextFlowType = 'fixed' | 'flowing' | 'auto_height';

export interface DynamicField {
  fieldId: string;
  placeholder: string;
  dataSource: string;
  field: string;
  
  // Formatting
  format?: DataFormat;
  
  // Default value
  defaultValue?: string;
}

export interface ImageConfig {
  imageId: string;
  title?: string;
  
  // Image source
  source: ImageSource;
  
  // Layout
  layout: ImageLayout;
  
  // Styling
  styling: ImageStyling;
  
  // Conditions
  conditions?: RenderingCondition[];
}

export interface ImageSource {
  sourceType: ImageSourceType;
  url?: string;
  base64Data?: string;
  chartId?: string; // Reference to chart
  
  // Dynamic image
  isDynamic: boolean;
  dynamicSource?: DynamicImageSource;
}

export type ImageSourceType = 'url' | 'base64' | 'chart' | 'qr_code' | 'barcode' | 'dynamic';

export interface DynamicImageSource {
  dataSource: string;
  field: string;
  fallbackImage?: string;
}

export interface ImageLayout {
  // Position
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Scaling
  scaleType: ImageScaleType;
  
  // Alignment
  alignment: ImageAlignment;
  
  // Spacing
  padding: Padding;
  margin: Margin;
}

export type ImageScaleType = 'fit' | 'fill' | 'stretch' | 'original';
export type ImageAlignment = 'left' | 'center' | 'right' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ImageStyling {
  // Border
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  
  // Effects
  opacity?: number;
  rotation?: number;
  
  // Filter effects
  grayscale?: boolean;
  sepia?: boolean;
  blur?: number;
}

export interface HeaderFooterConfig {
  // Content
  leftContent?: HeaderFooterContent;
  centerContent?: HeaderFooterContent;
  rightContent?: HeaderFooterContent;
  
  // Styling
  styling: ElementStyling;
  
  // Layout
  height: number;
  
  // Page settings
  showOnFirstPage: boolean;
  showOnLastPage: boolean;
  showOnAllPages: boolean;
}

export interface HeaderFooterContent {
  contentType: HeaderFooterContentType;
  content: string;
  
  // Dynamic fields
  includeDynamicFields: boolean;
  dynamicFields?: DynamicField[];
}

export type HeaderFooterContentType = 'text' | 'page_number' | 'date' | 'logo' | 'custom';

export interface AppendixConfig {
  appendixId: string;
  title: string;
  
  // Content
  sections: string[]; // Section IDs
  
  // Layout
  startOnNewPage: boolean;
  
  // Table of contents
  includeInTOC: boolean;
  
  // Numbering
  numberingStyle: NumberingStyle;
}

export type NumberingStyle = 'none' | 'numeric' | 'alphabetic' | 'roman' | 'custom';

export interface PageBreakConfig {
  breakBefore: boolean;
  breakAfter: boolean;
  keepWithNext: boolean;
  keepTogether: boolean;
}

export interface RenderingCondition {
  conditionId: string;
  conditionType: ConditionType;
  
  // Logic
  field: string;
  operator: FilterOperator;
  value: any;
  
  // Actions
  showWhenTrue: boolean;
  hideWhenFalse: boolean;
  
  // Alternative content
  alternativeContent?: string;
}

export type ConditionType = 'data_condition' | 'user_permission' | 'date_range' | 'portfolio_type' | 'custom';

// Hook return interface
export interface UseExportPDFSnapshotReturn {
  // Data
  snapshots: PDFSnapshot[];
  currentSnapshot: PDFSnapshot | null;
  
  // Loading states
  isLoading: boolean;
  isGenerating: boolean;
  isExporting: boolean;
  
  // Snapshot operations
  createSnapshot: (config: Omit<PDFSnapshot, 'id' | 'userId' | 'createdAt'>) => Promise<PDFSnapshot>;
  updateSnapshot: (id: string, updates: Partial<PDFSnapshot>) => Promise<PDFSnapshot>;
  deleteSnapshot: (id: string) => Promise<void>;
  
  // Generation operations
  generatePDF: (snapshotId: string) => Promise<PDFFileInfo>;
  downloadPDF: (snapshotId: string) => Promise<void>;
  previewPDF: (snapshotId: string) => Promise<string>; // Returns preview URL
  
  // Template operations
  getTemplates: () => PDFTemplate[];
  createTemplate: (template: Omit<PDFTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PDFTemplate>;
  updateTemplate: (id: string, updates: Partial<PDFTemplate>) => Promise<PDFTemplate>;
  
  // Sharing operations
  shareSnapshot: (snapshotId: string, sharingConfig: SharingConfig) => Promise<string>; // Returns share URL
  getSharedSnapshot: (shareId: string) => Promise<PDFSnapshot>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Store state interface
export interface ExportPDFSnapshotState {
  // Data
  snapshots: Record<string, PDFSnapshot>;
  templates: Record<string, PDFTemplate>;
  
  // Current snapshot
  currentSnapshotId: string | null;
  
  // Generation state
  generatingSnapshots: Record<string, boolean>;
  
  // UI state
  selectedSnapshotIds: string[];
  
  // Cache management
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Error handling
  errors: Record<string, string>;
} 