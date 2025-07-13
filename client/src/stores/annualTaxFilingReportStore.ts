// Block 75: Annual Tax Filing Report - Store
// Focused on Australian and New Zealand Tax Legislation

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AnnualTaxFilingReportEngine } from '../engines/AnnualTaxFilingReportEngine';
import {
  AnnualTaxFilingReport,
  AnnualTaxFilingReportState,
  UserTaxClassification,
  TaxReportFilter,
  ComplianceStatus,
  ComplianceIssue,
  NZInvestorStatus,
  AUResidencyStatus,
  NZResidencyStatus,
  GeneratedReport
} from '../types/annualTaxFilingReport';

interface AnnualTaxFilingReportStore extends AnnualTaxFilingReportState {
  // Actions
  initializeStore: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Report management
  setCurrentReport: (report: AnnualTaxFilingReport | null) => void;
  addReport: (report: AnnualTaxFilingReport) => void;
  updateReport: (id: string, updates: Partial<AnnualTaxFilingReport>) => void;
  removeReport: (id: string) => void;
  selectReport: (id: string) => void;
  
  // User classification management
  setUserClassification: (classification: UserTaxClassification) => void;
  updateUserClassification: (updates: Partial<UserTaxClassification>) => void;
  
  // AU/NZ specific classification updates
  setNZInvestorStatus: (status: NZInvestorStatus) => void;
  setAUResidencyStatus: (status: AUResidencyStatus) => void;
  setNZResidencyStatus: (status: NZResidencyStatus) => void;
  
  // Filtering and search
  setReportFilter: (filter: TaxReportFilter) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  
  // UI state
  setSelectedReportIds: (ids: string[]) => void;
  toggleReportSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Processing state
  setGeneratingReport: (reportId: string, isGenerating: boolean) => void;
  setFilingReport: (reportId: string, isFiling: boolean) => void;
  setCalculatingTaxes: (reportId: string, isCalculating: boolean) => void;
  
  // Compliance tracking
  setComplianceStatus: (reportId: string, status: ComplianceStatus) => void;
  addComplianceIssue: (reportId: string, issue: ComplianceIssue) => void;
  removeComplianceIssue: (reportId: string, issueId: string) => void;
  clearComplianceIssues: (reportId: string) => void;
  
  // Error handling
  setError: (reportId: string, error: string) => void;
  clearError: (reportId: string) => void;
  clearAllErrors: () => void;
  
  // Cache management
  updateLastRefresh: (dataType: string) => void;
  isCacheExpired: (dataType: string) => boolean;
  setCacheExpiry: (minutes: number) => void;
  
  // Statistics and analytics
  getReportStats: () => {
    total: number;
    completed: number;
    inProgress: number;
    filed: number;
    draft: number;
    byJurisdiction: { AU: number; NZ: number };
  };
  
  getComplianceStats: () => {
    compliant: number;
    nonCompliant: number;
    warnings: number;
    requiresReview: number;
    pendingIssues: number;
  };
  
  getTaxYearStats: (taxYear: number) => {
    reports: number;
    totalTaxLiability: number;
    totalRefunds: number;
    cgtEvents: number;
    fifIncome: number; // NZ only
    frankingCredits: number; // AU only
  };
}

export const useAnnualTaxFilingReportStore = create<AnnualTaxFilingReportStore>()(
  persist(
    (set, get) => ({
      // Initial state
      reports: {},
      
      // Current report
      currentReportId: null,
      
      // User classification
      userClassification: null,
      
      // UI state
      activeFilter: {},
      searchQuery: '',
      selectedReportIds: [],
      
      // Processing state
      generatingReports: {},
      filingReports: {},
      calculatingTaxes: {},
      
      // Cache management
      lastUpdated: {},
      cacheExpiry: 5, // 5 minutes
      
      // Compliance tracking
      complianceStatus: {},
      pendingIssues: {},
      
      // Error handling
      errors: {},
      
      // Actions
      initializeStore: async () => {
        const engine = AnnualTaxFilingReportEngine.getInstance();
        
        try {
          // Load initial data
          const reports = engine.getReports();
          
          const reportMap: Record<string, AnnualTaxFilingReport> = {};
          reports.forEach(report => {
            reportMap[report.id] = report;
          });
          
          // Load user classification if available
          try {
            // const userClassification = await engine.getUserClassification();
            // TODO: Implement getUserClassification in engine
            const userClassification = null;
            
            set({
              reports: reportMap,
              userClassification,
              lastUpdated: {
                reports: new Date(),
                userClassification: new Date()
              }
            });
          } catch (classificationError) {
            // User classification not set yet - normal for new users
            set({
              reports: reportMap,
              lastUpdated: {
                reports: new Date()
              }
            });
          }
        } catch (error) {
          console.error('Failed to initialize store:', error);
          get().setError('store', 'Failed to initialize store');
        }
      },
      
      refreshData: async () => {
        const engine = AnnualTaxFilingReportEngine.getInstance();
        
        try {
          // Check cache expiry
          const state = get();
          const needsRefresh = {
            reports: state.isCacheExpired('reports'),
            userClassification: state.isCacheExpired('userClassification')
          };
          
          if (needsRefresh.reports) {
            const reports = engine.getReports();
            const reportMap: Record<string, AnnualTaxFilingReport> = {};
            reports.forEach(report => {
              reportMap[report.id] = report;
            });
            
            set(state => ({
              reports: reportMap,
              lastUpdated: { ...state.lastUpdated, reports: new Date() }
            }));
          }
          
          if (needsRefresh.userClassification) {
            try {
              // const userClassification = await engine.getUserClassification();
              // TODO: Implement getUserClassification in engine
              set(state => ({
                lastUpdated: { ...state.lastUpdated, userClassification: new Date() }
              }));
            } catch (error) {
              // User classification not available
            }
          }
        } catch (error) {
          console.error('Failed to refresh data:', error);
          get().setError('store', 'Failed to refresh data');
        }
      },
      
      // Report management
      setCurrentReport: (report: AnnualTaxFilingReport | null) => {
        set({
          currentReportId: report?.id || null
        });
      },
      
      addReport: (report: AnnualTaxFilingReport) => {
        set(state => ({
          reports: {
            ...state.reports,
            [report.id]: report
          }
        }));
      },
      
      updateReport: (id: string, updates: Partial<AnnualTaxFilingReport>) => {
        set(state => ({
          reports: {
            ...state.reports,
            [id]: state.reports[id] ? { ...state.reports[id], ...updates } : state.reports[id]
          }
        }));
      },
      
      removeReport: (id: string) => {
        set(state => {
          const newReports = { ...state.reports };
          delete newReports[id];
          
          // Clear related state
          const newGeneratingReports = { ...state.generatingReports };
          delete newGeneratingReports[id];
          
          const newFilingReports = { ...state.filingReports };
          delete newFilingReports[id];
          
          const newCalculatingTaxes = { ...state.calculatingTaxes };
          delete newCalculatingTaxes[id];
          
          const newComplianceStatus = { ...state.complianceStatus };
          delete newComplianceStatus[id];
          
          const newPendingIssues = { ...state.pendingIssues };
          delete newPendingIssues[id];
          
          const newErrors = { ...state.errors };
          delete newErrors[id];
          
          return {
            reports: newReports,
            currentReportId: state.currentReportId === id ? null : state.currentReportId,
            selectedReportIds: state.selectedReportIds.filter(reportId => reportId !== id),
            generatingReports: newGeneratingReports,
            filingReports: newFilingReports,
            calculatingTaxes: newCalculatingTaxes,
            complianceStatus: newComplianceStatus,
            pendingIssues: newPendingIssues,
            errors: newErrors
          };
        });
      },
      
      selectReport: (id: string) => {
        const report = get().reports[id];
        if (report) {
          get().setCurrentReport(report);
        }
      },
      
      // User classification management
      setUserClassification: (classification: UserTaxClassification) => {
        set({ userClassification: classification });
      },
      
      updateUserClassification: (updates: Partial<UserTaxClassification>) => {
        set(state => ({
          userClassification: state.userClassification 
            ? { ...state.userClassification, ...updates }
            : state.userClassification
        }));
      },
      
      // AU/NZ specific classification updates
      setNZInvestorStatus: (status: NZInvestorStatus) => {
        set(state => ({
          userClassification: state.userClassification && state.userClassification.jurisdiction === 'NZ'
            ? { ...state.userClassification, nzInvestorStatus: status }
            : state.userClassification
        }));
      },
      
      setAUResidencyStatus: (status: AUResidencyStatus) => {
        set(state => ({
          userClassification: state.userClassification && state.userClassification.jurisdiction === 'AU'
            ? { ...state.userClassification, auResidencyStatus: status }
            : state.userClassification
        }));
      },
      
      setNZResidencyStatus: (status: NZResidencyStatus) => {
        set(state => ({
          userClassification: state.userClassification && state.userClassification.jurisdiction === 'NZ'
            ? { ...state.userClassification, nzResidencyStatus: status }
            : state.userClassification
        }));
      },
      
      // Filtering and search
      setReportFilter: (filter: TaxReportFilter) => {
        set({ activeFilter: filter });
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },
      
      clearFilters: () => {
        set({
          activeFilter: {},
          searchQuery: ''
        });
      },
      
      // UI state
      setSelectedReportIds: (ids: string[]) => {
        set({ selectedReportIds: ids });
      },
      
      toggleReportSelection: (id: string) => {
        set(state => ({
          selectedReportIds: state.selectedReportIds.includes(id)
            ? state.selectedReportIds.filter(reportId => reportId !== id)
            : [...state.selectedReportIds, id]
        }));
      },
      
      clearSelection: () => {
        set({ selectedReportIds: [] });
      },
      
      // Processing state
      setGeneratingReport: (reportId: string, isGenerating: boolean) => {
        set(state => ({
          generatingReports: {
            ...state.generatingReports,
            [reportId]: isGenerating
          }
        }));
      },
      
      setFilingReport: (reportId: string, isFiling: boolean) => {
        set(state => ({
          filingReports: {
            ...state.filingReports,
            [reportId]: isFiling
          }
        }));
      },
      
      setCalculatingTaxes: (reportId: string, isCalculating: boolean) => {
        set(state => ({
          calculatingTaxes: {
            ...state.calculatingTaxes,
            [reportId]: isCalculating
          }
        }));
      },
      
      // Compliance tracking
      setComplianceStatus: (reportId: string, status: ComplianceStatus) => {
        set(state => ({
          complianceStatus: {
            ...state.complianceStatus,
            [reportId]: status
          }
        }));
      },
      
      addComplianceIssue: (reportId: string, issue: ComplianceIssue) => {
        set(state => ({
          pendingIssues: {
            ...state.pendingIssues,
            [reportId]: [...(state.pendingIssues[reportId] || []), issue]
          }
        }));
      },
      
      removeComplianceIssue: (reportId: string, issueId: string) => {
        set(state => ({
          pendingIssues: {
            ...state.pendingIssues,
            [reportId]: (state.pendingIssues[reportId] || []).filter(issue => issue.issueId !== issueId)
          }
        }));
      },
      
      clearComplianceIssues: (reportId: string) => {
        set(state => ({
          pendingIssues: {
            ...state.pendingIssues,
            [reportId]: []
          }
        }));
      },
      
      // Error handling
      setError: (reportId: string, error: string) => {
        set(state => ({
          errors: {
            ...state.errors,
            [reportId]: error
          }
        }));
      },
      
      clearError: (reportId: string) => {
        set(state => {
          const newErrors = { ...state.errors };
          delete newErrors[reportId];
          return { errors: newErrors };
        });
      },
      
      clearAllErrors: () => {
        set({ errors: {} });
      },
      
      // Cache management
      updateLastRefresh: (dataType: string) => {
        set(state => ({
          lastUpdated: {
            ...state.lastUpdated,
            [dataType]: new Date()
          }
        }));
      },
      
      isCacheExpired: (dataType: string) => {
        const state = get();
        const lastUpdate = state.lastUpdated[dataType];
        if (!lastUpdate) return true;
        
        const now = new Date();
        const diffMs = now.getTime() - lastUpdate.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        
        return diffMinutes > state.cacheExpiry;
      },
      
      setCacheExpiry: (minutes: number) => {
        set({ cacheExpiry: minutes });
      },
      
      // Statistics and analytics
      getReportStats: () => {
        const reports = Object.values(get().reports);
        
        const byJurisdiction = reports.reduce((acc, report) => {
          acc[report.jurisdiction.country]++;
          return acc;
        }, { AU: 0, NZ: 0 });
        
        return {
          total: reports.length,
          completed: reports.filter(r => r.reportStatus === 'completed').length,
          inProgress: reports.filter(r => r.reportStatus === 'generating').length,
          filed: reports.filter(r => r.reportStatus === 'filed').length,
          draft: reports.filter(r => r.reportStatus === 'draft').length,
          byJurisdiction
        };
      },
      
      getComplianceStats: () => {
        const complianceStatuses = Object.values(get().complianceStatus);
        const pendingIssues = Object.values(get().pendingIssues).flat();
        
        return {
          compliant: complianceStatuses.filter(status => status === 'compliant').length,
          nonCompliant: complianceStatuses.filter(status => status === 'non_compliant').length,
          warnings: complianceStatuses.filter(status => status === 'warning').length,
          requiresReview: complianceStatuses.filter(status => status === 'requires_review').length,
          pendingIssues: pendingIssues.filter(issue => !issue.isResolved).length
        };
      },
      
      getTaxYearStats: (taxYear: number) => {
        const reports = Object.values(get().reports).filter(r => r.taxYear === taxYear);
        
        const totalTaxLiability = reports.reduce((sum, report) => 
          sum + (report.taxCalculations?.totalTaxLiability || 0), 0);
        
        const totalRefunds = reports.reduce((sum, report) => 
          sum + (report.taxCalculations?.totalRefund || 0), 0);
        
        const cgtEvents = reports.reduce((sum, report) => 
          sum + (report.transactionData?.cgtEvents?.length || 0), 0);
        
        const fifIncome = reports
          .filter(r => r.jurisdiction.country === 'NZ')
          .reduce((sum, report) => 
            sum + (report.transactionData?.fifIncome || 0), 0);
        
        const frankingCredits = reports
          .filter(r => r.jurisdiction.country === 'AU')
          .reduce((sum, report) => 
            sum + (report.transactionData?.totalFrankingCredits || 0), 0);
        
        return {
          reports: reports.length,
          totalTaxLiability,
          totalRefunds,
          cgtEvents,
          fifIncome,
          frankingCredits
        };
      }
    }),
    {
      name: 'annual-tax-filing-report-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only essential state
        reports: state.reports,
        userClassification: state.userClassification,
        activeFilter: state.activeFilter,
        searchQuery: state.searchQuery,
        complianceStatus: state.complianceStatus,
        pendingIssues: state.pendingIssues,
        cacheExpiry: state.cacheExpiry,
        lastUpdated: state.lastUpdated
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize store after rehydration
        if (state) {
          // Auto-refresh data on store rehydration
          setTimeout(() => {
            state.refreshData();
          }, 100);
        }
      }
    }
  )
);

// Auto-refresh hook
let refreshInterval: NodeJS.Timeout | null = null;

export const startAutoRefresh = (intervalMs: number = 30000) => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(() => {
    const store = useAnnualTaxFilingReportStore.getState();
    store.refreshData();
  }, intervalMs);
};

export const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// Selectors for computed state
export const useFilteredReports = () => {
  return useAnnualTaxFilingReportStore((state) => {
    const reports = Object.values(state.reports);
    const engine = AnnualTaxFilingReportEngine.getInstance();
    
    let filtered = reports;
    
    // Apply active filters
    if (Object.keys(state.activeFilter).length > 0) {
      filtered = engine.filterReports(filtered, state.activeFilter);
    }
    
    // Apply search query
    if (state.searchQuery) {
      const searchLower = state.searchQuery.toLowerCase();
      filtered = filtered.filter(report => 
        report.reportName.toLowerCase().includes(searchLower) ||
        report.jurisdiction.country.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  });
};

export const useCurrentReport = () => {
  return useAnnualTaxFilingReportStore((state) => {
    return state.currentReportId ? state.reports[state.currentReportId] : null;
  });
};

export const useUserClassification = () => {
  return useAnnualTaxFilingReportStore((state) => state.userClassification);
};

export const useReportProcessingState = (reportId: string) => {
  return useAnnualTaxFilingReportStore((state) => ({
    isGenerating: state.generatingReports[reportId] || false,
    isFiling: state.filingReports[reportId] || false,
    isCalculating: state.calculatingTaxes[reportId] || false
  }));
};

export const useComplianceStatus = (reportId: string) => {
  return useAnnualTaxFilingReportStore((state) => ({
    status: state.complianceStatus[reportId] || 'requires_review',
    issues: state.pendingIssues[reportId] || []
  }));
};

export const useReportErrors = (reportId: string) => {
  return useAnnualTaxFilingReportStore((state) => {
    return state.errors[reportId] || null;
  });
};

// AU/NZ specific selectors
export const useJurisdictionReports = (jurisdiction: 'AU' | 'NZ') => {
  return useAnnualTaxFilingReportStore((state) => {
    const reports = Object.values(state.reports);
    return reports.filter(report => report.jurisdiction.country === jurisdiction);
  });
};

export const useFIFStatusReports = () => {
  return useAnnualTaxFilingReportStore((state) => {
    const reports = Object.values(state.reports);
    return reports.filter(report => 
      report.jurisdiction.country === 'NZ' && 
      report.portfolioData.fifThresholdStatus?.exceededThreshold
    );
  });
};

export const useFrankingCreditReports = () => {
  return useAnnualTaxFilingReportStore((state) => {
    const reports = Object.values(state.reports);
    return reports.filter(report => 
      report.jurisdiction.country === 'AU' && 
      (report.portfolioData.frankingCreditBalance || 0) > 0
    );
  });
};

export const useTaxYearReports = (taxYear: number) => {
  return useAnnualTaxFilingReportStore((state) => {
    const reports = Object.values(state.reports);
    return reports.filter(report => report.taxYear === taxYear);
  });
};

// Initialize store on module load
if (typeof window !== 'undefined') {
  const store = useAnnualTaxFilingReportStore.getState();
  store.initializeStore();
  
  // Start auto-refresh
  startAutoRefresh();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
  });
} 