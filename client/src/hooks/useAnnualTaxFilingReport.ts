// Block 75: Annual Tax Filing Report - Hook
// Focused on Australian and New Zealand Tax Legislation

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnnualTaxFilingReportEngine } from '../engines/AnnualTaxFilingReportEngine';
import {
  AnnualTaxFilingReport,
  UseAnnualTaxFilingReportReturn,
  AUNZTaxCalculationRequest,
  AUNZTaxCalculations,
  UserTaxClassification,
  ComplianceCheck,
  ValidationResult,
  GeneratedReport,
  TaxReportFilter,
  ReportFormat,
  FilingMethod,
  ComplianceIssue,
  NZInvestorStatus,
  FIFCalculation,
  FrankingCredit,
  CGTEvent,
  CryptoEvent
} from '../types/annualTaxFilingReport';

export function useAnnualTaxFilingReport(): UseAnnualTaxFilingReportReturn {
  const engine = useRef(AnnualTaxFilingReportEngine.getInstance()).current;
  
  // State management
  const [reports, setReports] = useState<AnnualTaxFilingReport[]>([]);
  const [currentReport, setCurrentReport] = useState<AnnualTaxFilingReport | null>(null);
  const [userClassification, setUserClassificationState] = useState<UserTaxClassification | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFiling, setIsFiling] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [reportFilter, setReportFilter] = useState<TaxReportFilter>({});
  
  // Auto-refresh for compliance monitoring
  const complianceInterval = useRef<NodeJS.Timeout>();

  // Load initial data
  useEffect(() => {
    loadReports();
    loadUserClassification();
    
    // Setup compliance monitoring
    setupComplianceMonitoring();
    
    return () => {
      clearInterval(complianceInterval.current);
    };
  }, []);

  // Auto-refresh for active calculations
  useEffect(() => {
    const activeCalculations = reports.filter(r => r.reportStatus === 'generating');
    if (activeCalculations.length > 0) {
      startCalculationTracking(activeCalculations);
    }
  }, [reports]);

  // Data loading functions
  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const reportList = engine.getReports();
      setReports(reportList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  const loadUserClassification = useCallback(async () => {
    try {
      // Load user classification from engine/database
      // TODO: Update engine to have getUserClassification method
      // const classification = await engine.getUserClassification();
      // setUserClassificationState(classification);
      console.warn('User classification loading not implemented yet');
    } catch (err) {
      console.warn('No user classification found - needs onboarding');
    }
  }, [engine]);

  // Report operations
  const createReport = useCallback(async (config: Omit<AnnualTaxFilingReport, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<AnnualTaxFilingReport> => {
    try {
      setError(null);
      
      // Ensure user classification is set
      if (!userClassification) {
        throw new Error('User tax classification required - complete onboarding first');
      }
      
      const newReport = await engine.createReport({
        ...config,
        userClassification
      });
      
      setReports(prev => [...prev, newReport]);
      setCurrentReport(newReport);
      
      return newReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create report';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, userClassification]);

  const updateReport = useCallback(async (id: string, updates: Partial<AnnualTaxFilingReport>): Promise<AnnualTaxFilingReport> => {
    try {
      setError(null);
      
      const updatedReport = await engine.updateReport(id, updates);
      setReports(prev => prev.map(r => r.id === id ? updatedReport : r));
      
      if (currentReport?.id === id) {
        setCurrentReport(updatedReport);
      }
      
      return updatedReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update report';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentReport]);

  const deleteReport = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      await engine.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      
      if (currentReport?.id === id) {
        setCurrentReport(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete report';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentReport]);

  // AU/NZ specific operations
  const classifyUser = useCallback(async (classification: UserTaxClassification): Promise<void> => {
    try {
      setError(null);
      
      await engine.setUserClassification(classification);
      setUserClassificationState(classification);
      
      // Re-validate existing reports with new classification
      for (const report of reports) {
        await runComplianceChecks(report.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set user classification';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, reports]);

  const calculateAUNZTaxes = useCallback(async (request: AUNZTaxCalculationRequest): Promise<AUNZTaxCalculations> => {
    try {
      setIsCalculating(true);
      setError(null);
      
      const calculations = await engine.calculateAUNZTaxes(request);
      
      // Update report with calculations
      if (request.userId && currentReport) {
        await updateReport(currentReport.id, {
          taxCalculations: calculations
        });
      }
      
      return calculations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate taxes';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  }, [engine, currentReport, updateReport]);

  const generateIR3Form = useCallback(async (reportId: string): Promise<GeneratedReport> => {
    try {
      setError(null);
      
      const report = reports.find(r => r.id === reportId);
      if (!report) throw new Error('Report not found');
      
      if (report.jurisdiction.country !== 'NZ') {
        throw new Error('IR3 form only available for New Zealand reports');
      }
      
      const ir3Form = await engine.generateIR3Form(reportId);
      
      // Update report with generated form
      await updateReport(reportId, {
        generatedReports: [...report.generatedReports, ir3Form]
      });
      
      return ir3Form;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate IR3 form';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, reports, updateReport]);

  const generateAUTaxReturn = useCallback(async (reportId: string): Promise<GeneratedReport> => {
    try {
      setError(null);
      
      const report = reports.find(r => r.id === reportId);
      if (!report) throw new Error('Report not found');
      
      if (report.jurisdiction.country !== 'AU') {
        throw new Error('AU tax return only available for Australian reports');
      }
      
      const auTaxReturn = await engine.generateAUTaxReturn(reportId);
      
      // Update report with generated form
      await updateReport(reportId, {
        generatedReports: [...report.generatedReports, auTaxReturn]
      });
      
      return auTaxReturn;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AU tax return';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, reports, updateReport]);

  // Generation and filing
  const generateReport = useCallback(async (reportId: string): Promise<GeneratedReport[]> => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const generatedReports = await engine.generateReport(reportId);
      
      // Update report with generated reports
      const report = reports.find(r => r.id === reportId);
      if (report) {
        await updateReport(reportId, {
          generatedReports,
          reportStatus: 'completed',
          generatedAt: new Date()
        });
      }
      
      return generatedReports;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [engine, reports, updateReport]);

  const fileReport = useCallback(async (reportId: string, filingMethod: FilingMethod): Promise<void> => {
    try {
      setIsFiling(true);
      setError(null);
      
      await engine.fileReport(reportId, filingMethod);
      
      // Update report status
      await updateReport(reportId, {
        reportStatus: 'filed',
        filedAt: new Date()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to file report';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsFiling(false);
    }
  }, [engine, updateReport]);

  // Calculations and validation
  const validateCalculations = useCallback(async (reportId: string): Promise<ValidationResult[]> => {
    try {
      setError(null);
      
      const validationResults = await engine.validateCalculations(reportId);
      
      // Update report with validation results
      await updateReport(reportId, {
        validationResults
      });
      
      return validationResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate calculations';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, updateReport]);

  // Compliance checks
  const runComplianceChecks = useCallback(async (reportId: string): Promise<ComplianceCheck[]> => {
    try {
      setError(null);
      
      const complianceChecks = await engine.runComplianceChecks(reportId);
      
      // Update report with compliance checks
      await updateReport(reportId, {
        complianceChecks
      });
      
      return complianceChecks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run compliance checks';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, updateReport]);

  // NZ specific compliance checks
  const checkInvestorTraderStatus = useCallback(async (reportId: string): Promise<ComplianceCheck> => {
    try {
      setError(null);
      
      const report = reports.find(r => r.id === reportId);
      if (!report || report.jurisdiction.country !== 'NZ') {
        throw new Error('Investor/trader check only available for New Zealand reports');
      }
      
      const complianceCheck = await engine.checkInvestorTraderStatus(reportId);
      
      // Update report compliance checks
      const updatedChecks = [...report.complianceChecks.filter(c => c.checkType !== 'investor_trader_classification'), complianceCheck];
      await updateReport(reportId, {
        complianceChecks: updatedChecks
      });
      
      return complianceCheck;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check investor/trader status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, reports, updateReport]);

  const checkFIFCompliance = useCallback(async (reportId: string): Promise<ComplianceCheck> => {
    try {
      setError(null);
      
      const report = reports.find(r => r.id === reportId);
      if (!report || report.jurisdiction.country !== 'NZ') {
        throw new Error('FIF compliance check only available for New Zealand reports');
      }
      
      const complianceCheck = await engine.checkFIFCompliance(reportId);
      
      // Update report compliance checks
      const updatedChecks = [...report.complianceChecks.filter(c => c.checkType !== 'fif_threshold_compliance'), complianceCheck];
      await updateReport(reportId, {
        complianceChecks: updatedChecks
      });
      
      return complianceCheck;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check FIF compliance';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, reports, updateReport]);

  // AU specific compliance checks
  const checkCGTCompliance = useCallback(async (reportId: string): Promise<ComplianceCheck> => {
    try {
      setError(null);
      
      const report = reports.find(r => r.id === reportId);
      if (!report || report.jurisdiction.country !== 'AU') {
        throw new Error('CGT compliance check only available for Australian reports');
      }
      
      const complianceCheck = await engine.checkCGTCompliance(reportId);
      
      // Update report compliance checks
      const updatedChecks = [...report.complianceChecks.filter(c => c.checkType !== 'cgt_exemption_validity'), complianceCheck];
      await updateReport(reportId, {
        complianceChecks: updatedChecks
      });
      
      return complianceCheck;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check CGT compliance';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, reports, updateReport]);

  // Data export
  const exportReport = useCallback(async (reportId: string, format: ReportFormat): Promise<Blob> => {
    try {
      setError(null);
      
      const blob = await engine.exportReport(reportId, format);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const exportIR3Data = useCallback(async (reportId: string): Promise<Blob> => {
    try {
      setError(null);
      
      const report = reports.find(r => r.id === reportId);
      if (!report || report.jurisdiction.country !== 'NZ') {
        throw new Error('IR3 export only available for New Zealand reports');
      }
      
      const blob = await engine.exportReport(reportId, 'ird_xml');
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export IR3 data';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, reports]);

  const exportATOData = useCallback(async (reportId: string): Promise<Blob> => {
    try {
      setError(null);
      
      const report = reports.find(r => r.id === reportId);
      if (!report || report.jurisdiction.country !== 'AU') {
        throw new Error('ATO export only available for Australian reports');
      }
      
      const blob = await engine.exportReport(reportId, 'ato_xml');
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export ATO data';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, reports]);

  // Filtering and search
  const filterReports = useCallback((filter: TaxReportFilter) => {
    setReportFilter(filter);
  }, []);

  const searchReports = useCallback((query: string) => {
    setReportFilter(prev => ({ ...prev, searchTerm: query }));
  }, []);

  // Error handling
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Utility functions
  const setupComplianceMonitoring = useCallback(() => {
    complianceInterval.current = setInterval(async () => {
      // Check for compliance issues on active reports
      for (const report of reports) {
        if (report.reportStatus === 'draft' || report.reportStatus === 'generating') {
          try {
            await runComplianceChecks(report.id);
          } catch (err) {
            console.error('Compliance monitoring error:', err);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }, [reports, runComplianceChecks]);

  const startCalculationTracking = useCallback((activeReports: AnnualTaxFilingReport[]) => {
    // Track calculation progress for active reports
    const trackingInterval = setInterval(async () => {
      for (const report of activeReports) {
        try {
          const updatedReport = engine.getReport(report.id);
          if (updatedReport && updatedReport.reportStatus !== 'generating') {
            // Calculation completed, refresh data
            await loadReports();
            clearInterval(trackingInterval);
            break;
          }
        } catch (err) {
          console.error('Calculation tracking error:', err);
        }
      }
    }, 5000); // Check every 5 seconds

    // Cleanup after 5 minutes
    setTimeout(() => {
      clearInterval(trackingInterval);
    }, 300000);
  }, [engine, loadReports]);

  // Apply filters to data
  const filteredReports = engine.filterReports(reports, reportFilter);

  // Helper functions for AU/NZ specific data
  const getCurrentTaxYear = useCallback((): number => {
    const now = new Date();
    if (userClassification?.jurisdiction === 'AU') {
      // AU tax year runs July 1 - June 30
      return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    } else {
      // NZ tax year runs April 1 - March 31
      return now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
    }
  }, [userClassification]);

  const getFilingDeadline = useCallback((): Date | null => {
    if (!userClassification) return null;
    
    const taxYear = getCurrentTaxYear();
    if (userClassification.jurisdiction === 'AU') {
      // AU filing deadline: October 31
      return new Date(taxYear, 9, 31); // October is month 9 (0-indexed)
    } else {
      // NZ filing deadline: July 7
      return new Date(taxYear, 6, 7); // July is month 6
    }
  }, [userClassification, getCurrentTaxYear]);

  const getFIFThresholdStatus = useCallback((report: AnnualTaxFilingReport): { exceeded: boolean; amount: number } => {
    if (report.jurisdiction.country !== 'NZ') {
      return { exceeded: false, amount: 0 };
    }
    
    const fifStatus = report.portfolioData.fifThresholdStatus;
    return {
      exceeded: fifStatus?.exceededThreshold || false,
      amount: fifStatus?.totalForeignValue || 0
    };
  }, []);

  const getInvestorTraderStatus = useCallback((): NZInvestorStatus | null => {
    if (userClassification?.jurisdiction !== 'NZ') return null;
    return userClassification.nzInvestorStatus || null;
  }, [userClassification]);

  return {
    // Data
    reports: filteredReports,
    currentReport,
    
    // Loading states
    isLoading,
    isGenerating,
    isFiling,
    isCalculating,
    
    // Report operations
    createReport,
    updateReport,
    deleteReport,
    
    // AU/NZ specific operations
    classifyUser,
    calculateAUNZTaxes,
    generateIR3Form,
    generateAUTaxReturn,
    
    // Generation and filing
    generateReport,
    fileReport,
    
    // Calculations and validation
    validateCalculations,
    
    // Compliance
    runComplianceChecks,
    checkInvestorTraderStatus,
    checkFIFCompliance,
    checkCGTCompliance,
    
    // Data export
    exportReport,
    exportIR3Data,
    exportATOData,
    
    // Filtering and search
    filterReports,
    searchReports,
    
    // Error handling
    error,
    clearError,
    
    // Helper functions (not in interface but useful)
    getCurrentTaxYear,
    getFilingDeadline,
    getFIFThresholdStatus,
    getInvestorTraderStatus,
    userClassification
  };
} 