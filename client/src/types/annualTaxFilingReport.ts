// Block 75: Annual Tax Filing Report - Types
// Focused on Australian and New Zealand Tax Legislation

export interface AnnualTaxFilingReport {
  id: string;
  userId: string;
  
  // Report identification
  reportName: string;
  taxYear: number; // Tax year ending (e.g., 2024 for 2023-24 AU year or 2024 NZ year)
  
  // Report configuration
  reportType: ReportType;
  jurisdiction: AUNZTaxJurisdiction;
  currency: 'AUD' | 'NZD';
  
  // User classification (critical for tax treatment)
  userClassification: UserTaxClassification;
  
  // Tax periods covered
  taxPeriods: TaxPeriod[];
  reportingPeriod: DateRange;
  
  // Portfolio and transactions
  portfolioData: PortfolioTaxData;
  transactionData: TransactionTaxData;
  
  // Tax calculations
  taxCalculations: AUNZTaxCalculations;
  
  // Forms and schedules
  taxForms: AUNZTaxForm[];
  schedules: AUNZTaxSchedule[];
  
  // Compliance and validation
  complianceChecks: ComplianceCheck[];
  validationResults: ValidationResult[];
  
  // Report generation
  reportStatus: ReportStatus;
  generatedReports: GeneratedReport[];
  
  // Settings and preferences
  settings: AUNZTaxReportSettings;
  
  // Audit trail
  auditTrail: AuditEntry[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  generatedAt?: Date;
  filedAt?: Date;
}

export type ReportType = 'annual' | 'quarterly' | 'custom';
export type ReportStatus = 'draft' | 'generating' | 'completed' | 'filed' | 'amended' | 'error';

// AU/NZ specific user classifications
export interface UserTaxClassification {
  jurisdiction: 'AU' | 'NZ';
  
  // New Zealand specific
  nzInvestorStatus?: NZInvestorStatus;
  nzResidencyStatus?: NZResidencyStatus;
  
  // Australia specific
  auResidencyStatus?: AUResidencyStatus;
  auCGTStatus?: AUCGTStatus;
  
  // Onboarding date (affects some rule applications)
  classificationDate: Date;
  lastReviewDate?: Date;
}

export type NZInvestorStatus = 'investor' | 'trader';
export type NZResidencyStatus = 'resident' | 'non_resident' | 'transitional_resident';
export type AUResidencyStatus = 'resident' | 'foreign_resident' | 'temporary_resident';
export type AUCGTStatus = 'full_cgt' | 'main_residence_exempt' | 'foreign_resident_cgt';

export interface AUNZTaxJurisdiction {
  country: 'AU' | 'NZ';
  
  // Tax authority information
  taxAuthority: AUNZTaxAuthority;
  
  // Applicable tax rates and rules
  taxRules: AUNZTaxRule[];
  
  // Filing requirements
  filingRequirements: AUNZFilingRequirement[];
  
  // Deadlines
  filingDeadlines: AUNZFilingDeadline[];
}

export interface AUNZTaxAuthority {
  code: string;
  name: string; // 'IRD' for NZ, 'ATO' for AU
  jurisdiction: 'AU' | 'NZ';
  
  // Contact information
  website: string;
  helpline: string;
  
  // Filing information
  requiredForms: string[];
  supportedFormats: string[];
  electronicFiling: boolean;
  
  // Deadlines
  annualFilingDeadline: string; // e.g., '7 July' for NZ, '31 October' for AU
}

export interface AUNZTaxRule {
  ruleId: string;
  ruleName: string;
  ruleType: AUNZTaxRuleType;
  jurisdiction: 'AU' | 'NZ';
  
  // Rule details
  description: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  
  // Rule parameters
  parameters: Record<string, any>;
  
  // Conditions for rule application
  applicableConditions: TaxRuleCondition[];
}

export type AUNZTaxRuleType = 
  | 'cgt_calculation' 
  | 'fif_calculation' 
  | 'franking_credit' 
  | 'crypto_treatment' 
  | 'investor_trader_test'
  | 'residency_test'
  | 'withholding_tax'
  | 'income_tax_bracket';

export interface TaxRuleCondition {
  conditionType: 'asset_type' | 'holding_period' | 'user_status' | 'amount_threshold' | 'geographic_source';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals';
  value: any;
  description: string;
}

export interface AUNZFilingRequirement {
  requirementId: string;
  name: string;
  jurisdiction: 'AU' | 'NZ';
  
  // Requirement criteria
  description: string;
  incomeThreshold?: number;
  assetThreshold?: number;
  
  // Required forms
  requiredForms: string[]; // e.g., ['IR3'] for NZ, ['Individual tax return'] for AU
  
  // Conditions
  conditions: RequirementCondition[];
}

export interface RequirementCondition {
  type: 'income' | 'assets' | 'age' | 'residency' | 'investor_status';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: any;
  description: string;
}

export interface AUNZFilingDeadline {
  deadlineId: string;
  name: string;
  jurisdiction: 'AU' | 'NZ';
  
  // Deadline information
  dueDate: Date;
  extendedDueDate?: Date;
  
  // Penalties
  latePenalty?: PenaltyInfo;
}

export interface PenaltyInfo {
  type: 'fixed' | 'percentage' | 'per_day';
  amount: number;
  maxAmount?: number;
  description: string;
}

export interface TaxPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  
  // Period type
  periodType: 'annual' | 'quarterly' | 'custom';
  
  // Status
  isComplete: boolean;
  isProcessed: boolean;
  
  // Data for this period
  transactions: Transaction[];
  dividends: DividendPayment[];
  interest: InterestPayment[];
  
  // AU/NZ specific calculations
  cgtEvents: CGTEvent[];
  fifCalculations?: FIFCalculation[];
  frankingCredits?: FrankingCredit[];
  
  // Calculated values
  totalIncome: number;
  totalGains: number;
  totalLosses: number;
  netGains: number;
  
  // Withholdings
  withholdingTax: number;
  estimatedTax: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// AU/NZ specific portfolio data
export interface PortfolioTaxData {
  // Holdings at period end
  holdings: AUNZTaxHolding[];
  
  // Aggregated values
  totalValue: number;
  totalCostBasis: number;
  totalUnrealizedGains: number;
  
  // AU/NZ specific categorization
  auNzEquities: AUNZEquityHolding[];
  foreignEquities: ForeignEquityHolding[];
  cryptoHoldings: CryptoHolding[];
  
  // FIF threshold tracking (NZ)
  fifThresholdStatus?: FIFThresholdStatus;
  
  // Franking credit balances (AU)
  frankingCreditBalance?: number;
}

export interface AUNZTaxHolding {
  id: string;
  symbol: string;
  name: string;
  
  // Basic holding details
  quantity: number;
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  
  // Geographic classification
  geographicSource: GeographicSource;
  assetType: AUNZAssetType;
  
  // Tax treatment
  taxTreatment: AUNZTaxTreatment;
  
  // Acquisition details
  acquisitionDate: Date;
  acquisitionMethod: AcquisitionMethod;
  
  // Tax lot information
  taxLots: TaxLot[];
  
  // AU/NZ specific fields
  isFrankingCreditEligible?: boolean; // AU
  fifStatus?: FIFStatus; // NZ
}

export type GeographicSource = 'AU' | 'NZ' | 'US' | 'UK' | 'OTHER';
export type AUNZAssetType = 'equity' | 'etf' | 'managed_fund' | 'bond' | 'crypto' | 'property' | 'other';
export type AUNZTaxTreatment = 'cgt_exempt' | 'cgt_discount' | 'cgt_full' | 'fif_treatment' | 'income_treatment' | 'crypto_property';
export type AcquisitionMethod = 'purchase' | 'gift' | 'inheritance' | 'dividend_reinvestment' | 'bonus_issue' | 'rights_issue' | 'other';

export interface AUNZEquityHolding {
  holdingId: string;
  symbol: string;
  country: 'AU' | 'NZ';
  
  // Tax implications
  cgtExempt: boolean; // True for NZ investors in AU/NZ equities
  cgtDiscountEligible?: boolean; // AU 50% discount if held >12 months
}

export interface ForeignEquityHolding {
  holdingId: string;
  symbol: string;
  country: string;
  
  // FIF implications (NZ)
  fifApplicable: boolean;
  fifMethod?: FIFMethod;
  
  // Foreign tax
  foreignTaxPaid?: number;
  witholdingTax?: number;
}

export interface CryptoHolding {
  holdingId: string;
  symbol: string;
  cryptoType: CryptoType;
  
  // Tax treatment varies by jurisdiction
  taxTreatment: CryptoTaxTreatment;
  
  // Acquisition method affects treatment
  acquisitionMethod: CryptoAcquisitionMethod;
}

export type CryptoType = 'bitcoin' | 'ethereum' | 'other_currency' | 'nft' | 'token';
export type CryptoTaxTreatment = 'property_nz' | 'cgt_asset_au' | 'trading_stock' | 'income_asset';
export type CryptoAcquisitionMethod = 'purchase' | 'mining' | 'staking' | 'airdrop' | 'fork' | 'gift';

export interface FIFThresholdStatus {
  totalForeignValue: number;
  thresholdAmount: number; // $50,000 NZD
  exceededThreshold: boolean;
  calculationDate: Date;
  
  // Affected holdings
  affectedHoldings: string[];
}

export type FIFStatus = 'not_applicable' | 'under_threshold' | 'fif_applicable';
export type FIFMethod = 'fair_dividend_rate' | 'cost_method' | 'deemed_rate_return';

export interface TaxLot {
  id: string;
  quantity: number;
  costBasis: number;
  acquisitionDate: Date;
  
  // AU/NZ specific
  cgtDiscountEligible?: boolean; // AU: >12 months
  cgtExempt?: boolean; // NZ investor status
  
  // Status
  isOpen: boolean;
  
  // Associated transactions
  openingTransaction: string;
  closingTransaction?: string;
}

export interface TransactionTaxData {
  // All transactions for the tax period
  transactions: Transaction[];
  
  // AU/NZ specific categorization
  cgtEvents: CGTEvent[];
  incomeEvents: IncomeEvent[];
  fifEvents?: FIFEvent[]; // NZ only
  frankingCreditEvents?: FrankingCreditEvent[]; // AU only
  cryptoEvents: CryptoEvent[];
  
  // Aggregated values
  totalRealizedGains: number;
  totalRealizedLosses: number;
  netRealizedGains: number;
  
  // AU specific
  cgtDiscountAmount?: number;
  
  // NZ specific
  fifIncome?: number;
  
  // Income
  totalDividends: number;
  totalInterest: number;
  totalFrankingCredits?: number; // AU
}

export interface Transaction {
  id: string;
  date: Date;
  symbol: string;
  type: TransactionType;
  
  // Transaction details
  quantity: number;
  price: number;
  value: number;
  fees: number;
  
  // Tax implications
  taxEvent: boolean;
  taxEventType?: TaxEventType;
  
  // Geographic source
  geographicSource: GeographicSource;
}

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'interest' | 'split' | 'bonus' | 'rights' | 'merger' | 'spinoff' | 'crypto_mine' | 'crypto_stake' | 'other';
export type TaxEventType = 'cgt_event' | 'income_event' | 'fif_event' | 'franking_credit' | 'crypto_disposal' | 'crypto_acquisition';

export interface CGTEvent {
  id: string;
  eventType: CGTEventType;
  eventDate: Date;
  assetId: string;
  
  // Event details
  quantity: number;
  saleProceeds?: number;
  costBase: number;
  
  // Calculation
  capitalGain: number;
  capitalLoss: number;
  
  // AU specific
  discountApplicable?: boolean;
  discountAmount?: number;
  
  // NZ specific
  exemptGain?: boolean; // NZ investor in AU/NZ equities
}

export type CGTEventType = 
  | 'asset_disposal' 
  | 'asset_loss' 
  | 'dividend_reinvestment' 
  | 'bonus_shares' 
  | 'rights_issue' 
  | 'return_of_capital'
  | 'crypto_disposal'
  | 'crypto_trade';

export interface IncomeEvent {
  id: string;
  eventType: IncomeEventType;
  eventDate: Date;
  assetId: string;
  
  // Income details
  grossIncome: number;
  netIncome: number;
  withholdingTax: number;
  
  // AU franking credits
  frankingCredit?: number;
  frankingPercentage?: number;
}

export type IncomeEventType = 'dividend' | 'interest' | 'distribution' | 'franking_credit' | 'foreign_income' | 'crypto_income' | 'staking_reward';

export interface FIFEvent {
  id: string;
  assetId: string;
  fifYear: number;
  
  // FIF calculation
  fifMethod: FIFMethod;
  openingValue: number;
  closingValue: number;
  fifIncome: number;
  
  // Supporting data
  averageValue?: number;
  daysHeld: number;
}

export interface FrankingCreditEvent {
  id: string;
  assetId: string;
  dividendDate: Date;
  
  // Franking details
  dividendAmount: number;
  frankingCredit: number;
  frankingPercentage: number;
  
  // Gross-up
  grossedUpDividend: number;
}

export interface CryptoEvent {
  id: string;
  eventType: CryptoEventType;
  eventDate: Date;
  cryptoAssetId: string;
  
  // Event details
  quantity: number;
  marketValue: number;
  costBasis?: number;
  
  // Tax implications
  taxableAmount: number;
  treatmentType: CryptoTaxTreatment;
  
  // Mining/staking specific
  miningDetails?: CryptoMiningDetails;
}

export type CryptoEventType = 'acquisition' | 'disposal' | 'mining' | 'staking' | 'airdrop' | 'fork' | 'trade' | 'payment';

export interface CryptoMiningDetails {
  miningPool?: string;
  hashRate?: number;
  electricityCosts: number;
  equipmentDepreciation: number;
}

export interface DividendPayment {
  id: string;
  symbol: string;
  payDate: Date;
  amount: number;
  
  // AU/NZ specific
  frankingCredit?: number; // AU only
  frankingPercentage?: number; // AU only
  exemptAmount?: number; // NZ investor exemption
  
  // Tax characteristics
  isQualified: boolean;
  withholdingTax: number;
}

export interface InterestPayment {
  id: string;
  source: string;
  payDate: Date;
  amount: number;
  withholdingTax: number;
  
  // Geographic source
  sourceCountry: string;
}

export interface FIFCalculation {
  id: string;
  assetId: string;
  taxYear: number;
  
  // Calculation method
  method: FIFMethod;
  
  // Values
  openingValue: number;
  closingValue: number;
  averageValue?: number;
  
  // Result
  fifIncome: number;
  daysHeld: number;
  
  // Rate applied
  rateApplied?: number; // e.g., 5% for fair dividend rate
}

export interface FrankingCredit {
  id: string;
  assetId: string;
  dividendDate: Date;
  
  // Franking details
  frankingCredit: number;
  frankingPercentage: number;
  
  // Usage
  creditUsed: number;
  creditCarriedForward: number;
  
  // Refund
  refundableCredit: number;
}

// AU/NZ Tax Calculations
export interface AUNZTaxCalculations {
  // Income calculations
  incomeCalculations: AUNZIncomeCalculation[];
  
  // Capital gains calculations
  cgtCalculations: AUNZCGTCalculation[];
  
  // AU specific calculations
  frankingCreditCalculations?: FrankingCreditCalculation[];
  
  // NZ specific calculations
  fifCalculations?: FIFTaxCalculation[];
  
  // Tax liability
  taxLiabilityCalculations: AUNZTaxLiabilityCalculation[];
  
  // Summary
  totalTaxLiability: number;
  totalTaxOwed: number;
  totalRefund: number;
  
  // Payments
  estimatedTaxPayments: number;
  withholdingTax: number;
}

export interface AUNZIncomeCalculation {
  incomeType: AUNZIncomeType;
  description: string;
  jurisdiction: 'AU' | 'NZ';
  
  // Income amounts
  grossIncome: number;
  netIncome: number;
  taxableIncome: number;
  
  // Tax calculations
  taxRate: number;
  taxAmount: number;
  
  // Withholdings and credits
  withholdingTax: number;
  frankingCredits?: number; // AU only
  
  // Supporting transactions
  supportingTransactions: string[];
}

export type AUNZIncomeType = 
  | 'employment' 
  | 'dividend' 
  | 'interest' 
  | 'franking_credit' 
  | 'foreign_income' 
  | 'crypto_income'
  | 'fif_income'
  | 'business_income'
  | 'other';

export interface AUNZCGTCalculation {
  jurisdiction: 'AU' | 'NZ';
  
  // Basic calculations
  totalGains: number;
  totalLosses: number;
  netGains: number;
  
  // AU specific
  discountGains?: number;
  discountAmount?: number;
  indexationAdjustment?: number;
  
  // NZ specific
  exemptGains?: number; // Investor status exemption
  traderGains?: number; // Trader status - taxed as income
  
  // Carryover losses
  carryoverLosses: number;
  appliedCarryoverLosses: number;
  remainingCarryoverLosses: number;
  
  // Final tax
  cgtTax: number;
  
  // Supporting events
  supportingEvents: string[];
}

export interface FrankingCreditCalculation {
  // Credit details
  totalFrankingCredits: number;
  grossedUpDividends: number;
  
  // Usage
  creditsUsedAgainstTax: number;
  refundableCredits: number;
  
  // Carryover
  creditsCarriedForward: number;
}

export interface FIFTaxCalculation {
  // Total FIF income
  totalFifIncome: number;
  
  // By method
  fairDividendRateIncome: number;
  costMethodIncome: number;
  deemedRateReturnIncome: number;
  
  // Affected holdings
  affectedHoldings: string[];
  
  // Tax rate applied
  taxRate: number;
  taxAmount: number;
}

export interface AUNZTaxLiabilityCalculation {
  jurisdiction: 'AU' | 'NZ';
  
  // Income calculation
  totalTaxableIncome: number;
  taxBrackets: TaxBracket[];
  
  // Tax calculation
  taxBeforeCredits: number;
  
  // Credits and offsets
  taxCredits: AUNZTaxCredit[];
  totalCredits: number;
  
  // Medicare levy (AU) or ACC earner levy (NZ)
  levies: TaxLevy[];
  totalLevies: number;
  
  // Final calculation
  taxAfterCreditsAndLevies: number;
  
  // Payments
  payeWithholding: number;
  estimatedTax: number;
  frankingCreditRefund?: number; // AU
  totalPayments: number;
  
  // Balance
  amountOwed: number;
  refundAmount: number;
}

export interface TaxBracket {
  minIncome: number;
  maxIncome?: number;
  rate: number;
  taxOnBracket: number;
  description: string;
}

export interface AUNZTaxCredit {
  creditType: AUNZCreditType;
  description: string;
  amount: number;
  isRefundable: boolean;
  
  // Limitations
  phaseOutThreshold?: number;
  maximumCredit?: number;
}

export type AUNZCreditType = 
  | 'franking_credit' 
  | 'foreign_tax_credit' 
  | 'low_income_tax_offset' 
  | 'senior_pensioner_offset'
  | 'working_for_families' // NZ
  | 'independent_earner' // NZ
  | 'other';

export interface TaxLevy {
  levyType: TaxLevyType;
  description: string;
  rate: number;
  amount: number;
  exemptionThreshold?: number;
}

export type TaxLevyType = 'medicare_levy' | 'medicare_levy_surcharge' | 'acc_earner_levy' | 'other';

// Forms and Schedules
export interface AUNZTaxForm {
  formId: string;
  formName: string;
  jurisdiction: 'AU' | 'NZ';
  
  // Form details
  description: string;
  taxYear: number;
  version: string;
  
  // Form status
  isRequired: boolean;
  isCompleted: boolean;
  
  // Form data mapped to actual form fields
  formData: Record<string, any>;
  
  // Validation
  validationResults: FormValidationResult[];
  
  // Generated outputs
  generatedPDF?: string;
  generatedXML?: string;
  
  // Filing information
  filingMethod?: FilingMethod;
  filedDate?: Date;
  acknowledgment?: string;
}

export interface AUNZTaxSchedule {
  scheduleId: string;
  scheduleName: string;
  parentFormId: string;
  jurisdiction: 'AU' | 'NZ';
  
  // Schedule details
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  
  // Schedule data
  scheduleData: Record<string, any>;
  
  // Line items with actual form references
  lineItems: ScheduleLineItem[];
}

export interface ScheduleLineItem {
  lineNumber: string;
  formReference: string; // e.g., "IR3-18" for NZ or "Item 18" for AU
  description: string;
  amount: number;
  
  // Supporting details
  supportingTransactions: string[];
  calculationMethod: string;
  
  // Validation
  isCalculated: boolean;
  isVerified: boolean;
}

export interface FormValidationResult {
  fieldName: string;
  formReference: string;
  validationType: ValidationType;
  isValid: boolean;
  message?: string;
  suggestedFix?: string;
}

export type ValidationType = 'required' | 'format' | 'range' | 'calculation' | 'cross_reference' | 'legislative_compliance';

// Compliance and Validation
export interface ComplianceCheck {
  checkId: string;
  checkName: string;
  checkType: ComplianceCheckType;
  jurisdiction: 'AU' | 'NZ';
  
  // Check details
  description: string;
  requirement: string;
  legislativeReference?: string;
  
  // Check results
  status: ComplianceStatus;
  checkDate: Date;
  
  // Issues found
  issues: ComplianceIssue[];
  
  // Recommendations
  recommendations: string[];
}

export type ComplianceCheckType = 
  | 'investor_trader_classification'
  | 'fif_threshold_compliance'
  | 'cgt_exemption_validity'
  | 'franking_credit_eligibility'
  | 'crypto_treatment_compliance'
  | 'residency_status_verification'
  | 'filing_requirement'
  | 'deadline_compliance';

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'warning' | 'requires_review';

export interface ComplianceIssue {
  issueId: string;
  issueType: IssueType;
  severity: IssueSeverity;
  
  // Issue details
  description: string;
  legislativeReference?: string;
  recommendation: string;
  
  // Resolution
  isResolved: boolean;
  resolutionDate?: Date;
  resolutionNote?: string;
}

export type IssueType = 
  | 'classification_mismatch'
  | 'threshold_exceeded'
  | 'exemption_invalid'
  | 'calculation_error'
  | 'missing_documentation'
  | 'deadline_missed'
  | 'legislative_change'
  | 'other';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ValidationResult {
  validationId: string;
  validationType: ValidationType;
  jurisdiction: 'AU' | 'NZ';
  
  // Validation details
  description: string;
  fieldName?: string;
  formId?: string;
  legislativeReference?: string;
  
  // Results
  isValid: boolean;
  message: string;
  
  // Suggestions
  suggestedFix?: string;
  
  // Metadata
  validationDate: Date;
}

// Report Generation
export interface GeneratedReport {
  reportId: string;
  reportName: string;
  reportType: GeneratedReportType;
  jurisdiction: 'AU' | 'NZ';
  
  // Report details
  description: string;
  format: ReportFormat;
  
  // Content
  content: string;
  filePath?: string;
  
  // Generation info
  generatedAt: Date;
  generatedBy: string;
  
  // Status
  status: GenerationStatus;
  
  // AU/NZ specific
  formType?: AUNZFormType;
  
  // Metadata
  fileSize?: number;
  pageCount?: number;
  
  // Sharing
  isShared: boolean;
  shareToken?: string;
}

export type GeneratedReportType = 
  | 'tax_return' 
  | 'cgt_summary' 
  | 'dividend_summary' 
  | 'interest_summary'
  | 'fif_summary' // NZ
  | 'franking_credit_summary' // AU
  | 'crypto_summary'
  | 'compliance_report'
  | 'audit_report'
  | 'other';

export type AUNZFormType = 
  | 'ir3' // NZ Individual Income Tax Return
  | 'ir3nr' // NZ Non-resident Individual Income Tax Return
  | 'ir4' // NZ Company Income Tax Return
  | 'individual_tax_return' // AU Individual Tax Return
  | 'foreign_income_return' // AU Foreign Income Tax Return
  | 'cgt_schedule' // AU Capital Gains Tax Schedule
  | 'other';

export type ReportFormat = 'pdf' | 'csv' | 'xlsx' | 'xml' | 'html' | 'txt' | 'ato_xml' | 'ird_xml';
export type GenerationStatus = 'generating' | 'completed' | 'failed' | 'cancelled';

// Settings and Configuration
export interface AUNZTaxReportSettings {
  // Jurisdiction settings
  jurisdiction: 'AU' | 'NZ';
  currency: 'AUD' | 'NZD';
  
  // User preferences
  userClassification: UserTaxClassification;
  
  // Calculation preferences
  cgtMethod?: CGTCalculationMethod; // AU
  fifMethod?: FIFMethod; // NZ
  roundingMethod: RoundingMethod;
  
  // Reporting preferences
  includeSchedules: boolean;
  includeStatements: boolean;
  includeWorksheets: boolean;
  
  // Compliance settings
  strictValidation: boolean;
  warningLevel: WarningLevel;
  autoClassifyTransactions: boolean;
  
  // Export settings
  defaultFormat: ReportFormat;
  includeSupporting: boolean;
  
  // Notification settings
  notifyOnCompletion: boolean;
  notifyOnDeadlines: boolean;
  notifyOnComplianceIssues: boolean;
  emailReports: boolean;
  
  // Advanced settings
  customCalculations: CustomCalculation[];
  taxOptimizations: AUNZTaxOptimization[];
}

export type CGTCalculationMethod = 'indexation' | 'discount' | 'other';
export type RoundingMethod = 'round' | 'floor' | 'ceil' | 'none';
export type WarningLevel = 'none' | 'low' | 'medium' | 'high' | 'all';

export interface CustomCalculation {
  calculationId: string;
  name: string;
  description: string;
  jurisdiction: 'AU' | 'NZ';
  formula: string;
  
  // Parameters
  parameters: CustomParameter[];
  
  // Usage
  isActive: boolean;
  applicableForms: string[];
}

export interface CustomParameter {
  parameterName: string;
  parameterType: ParameterType;
  defaultValue?: any;
  isRequired: boolean;
  validation?: ParameterValidation;
}

export type ParameterType = 'number' | 'string' | 'date' | 'boolean' | 'array' | 'object';

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  options?: any[];
}

export interface AUNZTaxOptimization {
  optimizationId: string;
  name: string;
  description: string;
  jurisdiction: 'AU' | 'NZ';
  
  // Optimization type
  optimizationType: AUNZOptimizationType;
  
  // Parameters
  parameters: Record<string, any>;
  
  // Results
  estimatedSavings?: number;
  recommendation?: string;
  
  // Status
  isActive: boolean;
  isApplied: boolean;
}

export type AUNZOptimizationType = 
  | 'loss_harvesting'
  | 'cgt_discount_timing' // AU
  | 'franking_credit_optimization' // AU
  | 'fif_method_selection' // NZ
  | 'investor_trader_optimization' // NZ
  | 'crypto_timing'
  | 'negative_gearing' // AU
  | 'income_smoothing'
  | 'other';

// Audit and Tracking
export interface AuditEntry {
  entryId: string;
  timestamp: Date;
  userId: string;
  
  // Action details
  action: AuditAction;
  description: string;
  
  // Affected data
  affectedObject: string;
  affectedFields: string[];
  
  // Changes
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  
  // AU/NZ specific
  legislativeReference?: string;
  complianceImpact?: string;
  
  // Metadata
  metadata: Record<string, any>;
}

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'generate' 
  | 'file' 
  | 'export' 
  | 'import'
  | 'classify'
  | 'calculate'
  | 'validate'
  | 'other';

export type FilingMethod = 'electronic' | 'paper' | 'tax_agent' | 'other';

// Filter and search interfaces
export interface TaxReportFilter {
  taxYear?: number[];
  reportType?: ReportType[];
  reportStatus?: ReportStatus[];
  jurisdiction?: ('AU' | 'NZ')[];
  
  // Classification filters
  investorStatus?: NZInvestorStatus[]; // NZ
  residencyStatus?: (NZResidencyStatus | AUResidencyStatus)[];
  
  // Date filters
  dateRange?: DateRange;
  
  // Value filters
  minTaxLiability?: number;
  maxTaxLiability?: number;
  
  // Compliance filters
  hasIssues?: boolean;
  isCompliant?: boolean;
  hasDeadlineIssues?: boolean;
  
  // Search
  searchTerm?: string;
}

// API interfaces
export interface TaxReportResponse {
  success: boolean;
  report?: AnnualTaxFilingReport;
  errors?: string[];
  warnings?: string[];
}

export interface TaxReportListResponse {
  reports: AnnualTaxFilingReport[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AUNZTaxCalculationRequest {
  userId: string;
  taxYear: number;
  jurisdiction: AUNZTaxJurisdiction;
  userClassification: UserTaxClassification;
  
  // Data inputs
  portfolioData: PortfolioTaxData;
  transactionData: TransactionTaxData;
  
  // Calculation preferences
  settings: AUNZTaxReportSettings;
}

export interface AUNZTaxCalculationResponse {
  success: boolean;
  calculations?: AUNZTaxCalculations;
  errors?: string[];
  warnings?: string[];
  complianceIssues?: ComplianceIssue[];
}

// Hook return interface
export interface UseAnnualTaxFilingReportReturn {
  // Data
  reports: AnnualTaxFilingReport[];
  currentReport: AnnualTaxFilingReport | null;
  
  // Loading states
  isLoading: boolean;
  isGenerating: boolean;
  isFiling: boolean;
  isCalculating: boolean;
  
  // Report operations
  createReport: (config: Omit<AnnualTaxFilingReport, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<AnnualTaxFilingReport>;
  updateReport: (id: string, updates: Partial<AnnualTaxFilingReport>) => Promise<AnnualTaxFilingReport>;
  deleteReport: (id: string) => Promise<void>;
  
  // AU/NZ specific operations
  classifyUser: (classification: UserTaxClassification) => Promise<void>;
  calculateAUNZTaxes: (request: AUNZTaxCalculationRequest) => Promise<AUNZTaxCalculations>;
  generateIR3Form: (reportId: string) => Promise<GeneratedReport>; // NZ
  generateAUTaxReturn: (reportId: string) => Promise<GeneratedReport>; // AU
  
  // Generation and filing
  generateReport: (reportId: string) => Promise<GeneratedReport[]>;
  fileReport: (reportId: string, filingMethod: FilingMethod) => Promise<void>;
  
  // Calculations and validation
  validateCalculations: (reportId: string) => Promise<ValidationResult[]>;
  
  // Compliance
  runComplianceChecks: (reportId: string) => Promise<ComplianceCheck[]>;
  checkInvestorTraderStatus: (reportId: string) => Promise<ComplianceCheck>; // NZ
  checkFIFCompliance: (reportId: string) => Promise<ComplianceCheck>; // NZ
  checkCGTCompliance: (reportId: string) => Promise<ComplianceCheck>; // AU
  
  // Data export
  exportReport: (reportId: string, format: ReportFormat) => Promise<Blob>;
  exportIR3Data: (reportId: string) => Promise<Blob>; // NZ
  exportATOData: (reportId: string) => Promise<Blob>; // AU
  
  // Filtering and search
  filterReports: (filter: TaxReportFilter) => void;
  searchReports: (query: string) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Store state interface
export interface AnnualTaxFilingReportState {
  // Data
  reports: Record<string, AnnualTaxFilingReport>;
  
  // Current report
  currentReportId: string | null;
  
  // User classification
  userClassification: UserTaxClassification | null;
  
  // UI state
  activeFilter: TaxReportFilter;
  searchQuery: string;
  selectedReportIds: string[];
  
  // Processing state
  generatingReports: Record<string, boolean>;
  filingReports: Record<string, boolean>;
  calculatingTaxes: Record<string, boolean>;
  
  // Cache management
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Compliance tracking
  complianceStatus: Record<string, ComplianceStatus>;
  pendingIssues: Record<string, ComplianceIssue[]>;
  
  // Error handling
  errors: Record<string, string>;
} 