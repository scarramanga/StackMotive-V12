// Block 97: Portfolio Exposure Breakdown - Store
// Zustand State Management for Portfolio Exposure Analysis

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  PortfolioExposureBreakdown,
  ExposureAnalysis,
  RiskMetrics,
  DiversificationAnalysis,
  ConcentrationAnalysis,
  PortfolioExposureBreakdownState,
  CalculationProgress,
  ComparisonResult,
  StressTestResult,
  OptimizationResult,
  AnalysisReport
} from '../types/portfolioExposureBreakdown';

interface PortfolioExposureBreakdownStore extends PortfolioExposureBreakdownState {
  // Breakdown Management
  addBreakdown: (breakdown: PortfolioExposureBreakdown) => void;
  updateBreakdown: (id: string, updates: Partial<PortfolioExposureBreakdown>) => void;
  removeBreakdown: (id: string) => void;
  setCurrentBreakdown: (id: string | null) => void;
  
  // Analysis Results Management
  setAnalysisResult: (breakdownId: string, analysis: ExposureAnalysis) => void;
  updateRiskMetrics: (breakdownId: string, riskMetrics: RiskMetrics) => void;
  updateDiversificationAnalysis: (breakdownId: string, analysis: DiversificationAnalysis) => void;
  updateConcentrationAnalysis: (breakdownId: string, analysis: ConcentrationAnalysis) => void;
  
  // Calculation Progress Management
  setCalculationProgress: (breakdownId: string, progress: CalculationProgress) => void;
  clearCalculationProgress: (breakdownId: string) => void;
  
  // Portfolio Selection
  togglePortfolioSelection: (portfolioId: string) => void;
  selectMultiplePortfolios: (portfolioIds: string[]) => void;
  clearPortfolioSelection: () => void;
  
  // Cache Management
  updateCacheTimestamp: (breakdownId: string) => void;
  isCacheValid: (breakdownId: string) => boolean;
  invalidateCache: (breakdownId: string) => void;
  clearExpiredCache: () => void;
  
  // Analysis History
  addAnalysisHistory: (breakdownId: string, analysis: ExposureAnalysis) => void;
  getAnalysisHistory: (breakdownId: string) => ExposureAnalysis[];
  clearAnalysisHistory: (breakdownId: string) => void;
  
  // Comparison Results
  setComparisonResult: (breakdownId1: string, breakdownId2: string, result: ComparisonResult) => void;
  getComparisonResult: (breakdownId1: string, breakdownId2: string) => ComparisonResult | null;
  clearComparisonResults: () => void;
  
  // Stress Test Results
  setStressTestResults: (breakdownId: string, results: StressTestResult[]) => void;
  getStressTestResults: (breakdownId: string) => StressTestResult[];
  clearStressTestResults: (breakdownId: string) => void;
  
  // Optimization Results
  setOptimizationResult: (breakdownId: string, result: OptimizationResult) => void;
  getOptimizationResult: (breakdownId: string) => OptimizationResult | null;
  clearOptimizationResults: (breakdownId: string) => void;
  
  // Report Management
  addReport: (breakdownId: string, report: AnalysisReport) => void;
  getReports: (breakdownId: string) => AnalysisReport[];
  removeReport: (breakdownId: string, reportId: string) => void;
  
  // Error Handling
  setError: (breakdownId: string, error: string) => void;
  clearError: (breakdownId: string) => void;
  clearAllErrors: () => void;
  
  // Utility
  getBreakdownById: (id: string) => PortfolioExposureBreakdown | undefined;
  getActiveBreakdowns: () => PortfolioExposureBreakdown[];
  getBreakdownsByPortfolio: (portfolioId: string) => PortfolioExposureBreakdown[];
  
  // Analytics
  getExposureMetrics: () => ExposureMetrics;
  getRiskDistribution: () => RiskDistribution;
  getDiversificationStats: () => DiversificationStats;
  
  // Cleanup
  cleanup: () => void;
  resetStore: () => void;
}

const initialState: PortfolioExposureBreakdownState = {
  breakdowns: {},
  currentBreakdownId: null,
  selectedPortfolioIds: [],
  analysisResults: {},
  calculationProgress: {},
  lastUpdated: {},
  cacheExpiry: 15 * 60 * 1000, // 15 minutes
  errors: {}
};

export const usePortfolioExposureBreakdownStore = create<PortfolioExposureBreakdownStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // Additional state for advanced features
        analysisHistory: {} as Record<string, ExposureAnalysis[]>,
        comparisonResults: {} as Record<string, ComparisonResult>,
        stressTestResults: {} as Record<string, StressTestResult[]>,
        optimizationResults: {} as Record<string, OptimizationResult>,
        reports: {} as Record<string, AnalysisReport[]>,
        
        // Breakdown Management
        addBreakdown: (breakdown) => {
          set((state) => {
            state.breakdowns[breakdown.id] = breakdown;
            state.lastUpdated[breakdown.id] = new Date();
            
            // Set as current breakdown if it's the first one
            if (Object.keys(state.breakdowns).length === 1) {
              state.currentBreakdownId = breakdown.id;
            }
          });
        },
        
        updateBreakdown: (id, updates) => {
          set((state) => {
            if (state.breakdowns[id]) {
              state.breakdowns[id] = { ...state.breakdowns[id], ...updates, updatedAt: new Date() };
              state.lastUpdated[id] = new Date();
            }
          });
        },
        
        removeBreakdown: (id) => {
          set((state) => {
            delete state.breakdowns[id];
            delete state.analysisResults[id];
            delete state.calculationProgress[id];
            delete state.lastUpdated[id];
            delete state.errors[id];
            delete state.analysisHistory[id];
            delete state.stressTestResults[id];
            delete state.optimizationResults[id];
            delete state.reports[id];
            
            // Remove from comparison results
            Object.keys(state.comparisonResults).forEach(key => {
              if (key.includes(id)) {
                delete state.comparisonResults[key];
              }
            });
            
            // Clear current breakdown if it's the one being removed
            if (state.currentBreakdownId === id) {
              const remainingBreakdownIds = Object.keys(state.breakdowns);
              state.currentBreakdownId = remainingBreakdownIds.length > 0 ? remainingBreakdownIds[0] : null;
            }
          });
        },
        
        setCurrentBreakdown: (id) => {
          set((state) => {
            state.currentBreakdownId = id;
            
            // Update last accessed time
            if (id && state.breakdowns[id]) {
              state.breakdowns[id].lastAnalyzed = new Date();
              state.lastUpdated[id] = new Date();
            }
          });
        },
        
        // Analysis Results Management
        setAnalysisResult: (breakdownId, analysis) => {
          set((state) => {
            state.analysisResults[breakdownId] = analysis;
            state.lastUpdated[breakdownId] = new Date();
            
            // Add to history
            if (!state.analysisHistory[breakdownId]) {
              state.analysisHistory[breakdownId] = [];
            }
            state.analysisHistory[breakdownId].push(analysis);
            
            // Keep only last 50 analyses
            if (state.analysisHistory[breakdownId].length > 50) {
              state.analysisHistory[breakdownId] = state.analysisHistory[breakdownId].slice(-50);
            }
          });
        },
        
        updateRiskMetrics: (breakdownId, riskMetrics) => {
          set((state) => {
            if (state.analysisResults[breakdownId]) {
              // Create a new analysis result with updated risk metrics
              state.analysisResults[breakdownId] = {
                ...state.analysisResults[breakdownId],
                // Note: In the types, riskExposures is part of ExposureAnalysis
                // For this store, we'll handle risk metrics updates appropriately
              };
            }
            
            // Update breakdown risk metrics
            if (state.breakdowns[breakdownId]) {
              state.breakdowns[breakdownId].riskMetrics = riskMetrics;
            }
            
            state.lastUpdated[breakdownId] = new Date();
          });
        },
        
        updateDiversificationAnalysis: (breakdownId, analysis) => {
          set((state) => {
            if (state.breakdowns[breakdownId]) {
              state.breakdowns[breakdownId].diversificationAnalysis = analysis;
              state.lastUpdated[breakdownId] = new Date();
            }
          });
        },
        
        updateConcentrationAnalysis: (breakdownId, analysis) => {
          set((state) => {
            if (state.breakdowns[breakdownId]) {
              state.breakdowns[breakdownId].concentrationAnalysis = analysis;
              state.lastUpdated[breakdownId] = new Date();
            }
          });
        },
        
        // Calculation Progress Management
        setCalculationProgress: (breakdownId, progress) => {
          set((state) => {
            state.calculationProgress[breakdownId] = progress;
          });
        },
        
        clearCalculationProgress: (breakdownId) => {
          set((state) => {
            delete state.calculationProgress[breakdownId];
          });
        },
        
        // Portfolio Selection
        togglePortfolioSelection: (portfolioId) => {
          set((state) => {
            const index = state.selectedPortfolioIds.indexOf(portfolioId);
            if (index === -1) {
              state.selectedPortfolioIds.push(portfolioId);
            } else {
              state.selectedPortfolioIds.splice(index, 1);
            }
          });
        },
        
        selectMultiplePortfolios: (portfolioIds) => {
          set((state) => {
            state.selectedPortfolioIds = portfolioIds;
          });
        },
        
        clearPortfolioSelection: () => {
          set((state) => {
            state.selectedPortfolioIds = [];
          });
        },
        
        // Cache Management
        updateCacheTimestamp: (breakdownId) => {
          set((state) => {
            state.lastUpdated[breakdownId] = new Date();
          });
        },
        
        isCacheValid: (breakdownId) => {
          const state = get();
          const lastUpdated = state.lastUpdated[breakdownId];
          
          if (!lastUpdated) return false;
          
          const now = new Date();
          const age = now.getTime() - lastUpdated.getTime();
          
          return age < state.cacheExpiry;
        },
        
        invalidateCache: (breakdownId) => {
          set((state) => {
            delete state.lastUpdated[breakdownId];
          });
        },
        
        clearExpiredCache: () => {
          set((state) => {
            const now = new Date();
            Object.keys(state.lastUpdated).forEach(breakdownId => {
              const age = now.getTime() - state.lastUpdated[breakdownId].getTime();
              if (age > state.cacheExpiry) {
                delete state.lastUpdated[breakdownId];
                delete state.analysisResults[breakdownId];
              }
            });
          });
        },
        
        // Analysis History
        addAnalysisHistory: (breakdownId, analysis) => {
          set((state) => {
            if (!state.analysisHistory[breakdownId]) {
              state.analysisHistory[breakdownId] = [];
            }
            state.analysisHistory[breakdownId].push(analysis);
            
            // Keep only last 50 analyses
            if (state.analysisHistory[breakdownId].length > 50) {
              state.analysisHistory[breakdownId] = state.analysisHistory[breakdownId].slice(-50);
            }
          });
        },
        
        getAnalysisHistory: (breakdownId) => {
          const state = get();
          return state.analysisHistory[breakdownId] || [];
        },
        
        clearAnalysisHistory: (breakdownId) => {
          set((state) => {
            delete state.analysisHistory[breakdownId];
          });
        },
        
        // Comparison Results
        setComparisonResult: (breakdownId1, breakdownId2, result) => {
          set((state) => {
            const key = `${breakdownId1}_vs_${breakdownId2}`;
            state.comparisonResults[key] = result;
          });
        },
        
        getComparisonResult: (breakdownId1, breakdownId2) => {
          const state = get();
          const key = `${breakdownId1}_vs_${breakdownId2}`;
          return state.comparisonResults[key] || null;
        },
        
        clearComparisonResults: () => {
          set((state) => {
            state.comparisonResults = {};
          });
        },
        
        // Stress Test Results
        setStressTestResults: (breakdownId, results) => {
          set((state) => {
            state.stressTestResults[breakdownId] = results;
          });
        },
        
        getStressTestResults: (breakdownId) => {
          const state = get();
          return state.stressTestResults[breakdownId] || [];
        },
        
        clearStressTestResults: (breakdownId) => {
          set((state) => {
            delete state.stressTestResults[breakdownId];
          });
        },
        
        // Optimization Results
        setOptimizationResult: (breakdownId, result) => {
          set((state) => {
            state.optimizationResults[breakdownId] = result;
          });
        },
        
        getOptimizationResult: (breakdownId) => {
          const state = get();
          return state.optimizationResults[breakdownId] || null;
        },
        
        clearOptimizationResults: (breakdownId) => {
          set((state) => {
            delete state.optimizationResults[breakdownId];
          });
        },
        
        // Report Management
        addReport: (breakdownId, report) => {
          set((state) => {
            if (!state.reports[breakdownId]) {
              state.reports[breakdownId] = [];
            }
            state.reports[breakdownId].push(report);
            
            // Keep only last 20 reports
            if (state.reports[breakdownId].length > 20) {
              state.reports[breakdownId] = state.reports[breakdownId].slice(-20);
            }
          });
        },
        
        getReports: (breakdownId) => {
          const state = get();
          return state.reports[breakdownId] || [];
        },
        
        removeReport: (breakdownId, reportId) => {
          set((state) => {
            if (state.reports[breakdownId]) {
              state.reports[breakdownId] = state.reports[breakdownId].filter(
                report => report.reportId !== reportId
              );
            }
          });
        },
        
        // Error Handling
        setError: (breakdownId, error) => {
          set((state) => {
            state.errors[breakdownId] = error;
          });
        },
        
        clearError: (breakdownId) => {
          set((state) => {
            delete state.errors[breakdownId];
          });
        },
        
        clearAllErrors: () => {
          set((state) => {
            state.errors = {};
          });
        },
        
        // Utility
        getBreakdownById: (id) => {
          const state = get();
          return state.breakdowns[id];
        },
        
        getActiveBreakdowns: () => {
          const state = get();
          return Object.values(state.breakdowns).filter(breakdown => breakdown.isActive);
        },
        
        getBreakdownsByPortfolio: (portfolioId) => {
          const state = get();
          return Object.values(state.breakdowns).filter(breakdown => 
            breakdown.portfolioId === portfolioId
          );
        },
        
        // Analytics
        getExposureMetrics: () => {
          const state = get();
          const activeBreakdowns = Object.values(state.breakdowns).filter(b => b.isActive);
          
          return {
            totalBreakdowns: activeBreakdowns.length,
            avgDiversificationScore: activeBreakdowns.reduce((sum, b) => 
              sum + (b.diversificationAnalysis?.diversificationRatio || 0), 0) / Math.max(activeBreakdowns.length, 1),
            avgConcentrationRatio: activeBreakdowns.reduce((sum, b) => 
              sum + (b.concentrationAnalysis?.concentrationRatio || 0), 0) / Math.max(activeBreakdowns.length, 1),
            totalAnalyses: Object.keys(state.analysisResults).length,
            cacheHitRate: Object.keys(state.lastUpdated).length / Math.max(Object.keys(state.breakdowns).length, 1)
          };
        },
        
        getRiskDistribution: () => {
          const state = get();
          const analysisResults = Object.values(state.analysisResults);
          
          if (analysisResults.length === 0) {
            return {
              lowRisk: 0,
              mediumRisk: 0,
              highRisk: 0,
              avgConcentration: 0
            };
          }
          
          let lowRisk = 0, mediumRisk = 0, highRisk = 0;
          let totalConcentration = 0;
          
          analysisResults.forEach(analysis => {
            const concentration = analysis.concentrationMetrics?.concentrationRatio || 0;
            totalConcentration += concentration;
            
            if (concentration < 0.1) lowRisk++;
            else if (concentration < 0.25) mediumRisk++;
            else highRisk++;
          });
          
          return {
            lowRisk: lowRisk / analysisResults.length,
            mediumRisk: mediumRisk / analysisResults.length,
            highRisk: highRisk / analysisResults.length,
            avgConcentration: totalConcentration / analysisResults.length
          };
        },
        
        getDiversificationStats: () => {
          const state = get();
          const breakdowns = Object.values(state.breakdowns).filter(b => b.isActive);
          
          if (breakdowns.length === 0) {
            return {
              avgDiversificationRatio: 0,
              avgEffectivePositions: 0,
              avgSectorDiversification: 0,
              avgGeographicDiversification: 0
            };
          }
          
          return {
            avgDiversificationRatio: breakdowns.reduce((sum, b) => 
              sum + (b.diversificationAnalysis?.diversificationRatio || 0), 0) / breakdowns.length,
            avgEffectivePositions: breakdowns.reduce((sum, b) => 
              sum + (b.diversificationAnalysis?.effectiveNumberOfPositions || 0), 0) / breakdowns.length,
            avgSectorDiversification: breakdowns.reduce((sum, b) => {
              const score = b.diversificationAnalysis?.diversificationScores?.find(s => s.dimension === 'sector')?.score || 0;
              return sum + score;
            }, 0) / breakdowns.length,
            avgGeographicDiversification: breakdowns.reduce((sum, b) => {
              const score = b.diversificationAnalysis?.diversificationScores?.find(s => s.dimension === 'geography')?.score || 0;
              return sum + score;
            }, 0) / breakdowns.length
          };
        },
        
        // Cleanup
        cleanup: () => {
          set((state) => {
            const now = new Date();
            const cutoffTime = now.getTime() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
            
            // Clean up old cache entries
            Object.keys(state.lastUpdated).forEach(breakdownId => {
              if (state.lastUpdated[breakdownId].getTime() < cutoffTime) {
                delete state.lastUpdated[breakdownId];
              }
            });
            
            // Clean up old analysis history
            Object.keys(state.analysisHistory).forEach(breakdownId => {
              if (state.analysisHistory[breakdownId]) {
                state.analysisHistory[breakdownId] = state.analysisHistory[breakdownId].filter(
                  analysis => analysis.analysisTimestamp.getTime() > cutoffTime
                );
                
                if (state.analysisHistory[breakdownId].length === 0) {
                  delete state.analysisHistory[breakdownId];
                }
              }
            });
            
            // Clean up orphaned data
            const validBreakdownIds = new Set(Object.keys(state.breakdowns));
            
            Object.keys(state.analysisResults).forEach(breakdownId => {
              if (!validBreakdownIds.has(breakdownId)) {
                delete state.analysisResults[breakdownId];
              }
            });
            
            Object.keys(state.errors).forEach(breakdownId => {
              if (!validBreakdownIds.has(breakdownId)) {
                delete state.errors[breakdownId];
              }
            });
          });
        },
        
        resetStore: () => {
          set(() => ({ 
            ...initialState,
            analysisHistory: {},
            comparisonResults: {},
            stressTestResults: {},
            optimizationResults: {},
            reports: {}
          }));
        }
      })),
      {
        name: 'portfolio-exposure-breakdown-store',
        version: 1,
        partialize: (state) => ({
          breakdowns: state.breakdowns,
          currentBreakdownId: state.currentBreakdownId,
          selectedPortfolioIds: state.selectedPortfolioIds,
          cacheExpiry: state.cacheExpiry,
          reports: state.reports
        }),
        onRehydrateStorage: () => (state) => {
          // Clean up after rehydration
          if (state) {
            state.cleanup();
          }
        }
      }
    )
  )
);

// Selectors for optimized performance
export const selectCurrentBreakdown = (state: PortfolioExposureBreakdownStore) => 
  state.currentBreakdownId ? state.breakdowns[state.currentBreakdownId] : null;

export const selectCurrentAnalysis = (state: PortfolioExposureBreakdownStore) => 
  state.currentBreakdownId ? state.analysisResults[state.currentBreakdownId] : null;

export const selectActiveBreakdownCount = (state: PortfolioExposureBreakdownStore) => 
  Object.values(state.breakdowns).filter(breakdown => breakdown.isActive).length;

export const selectBreakdownsByStatus = (isActive: boolean) => (state: PortfolioExposureBreakdownStore) => 
  Object.values(state.breakdowns).filter(breakdown => breakdown.isActive === isActive);

export const selectAnalysisForBreakdown = (breakdownId: string) => (state: PortfolioExposureBreakdownStore) => 
  state.analysisResults[breakdownId];

export const selectBreakdownErrors = (state: PortfolioExposureBreakdownStore) => state.errors;

export const selectCalculationProgress = (breakdownId: string) => (state: PortfolioExposureBreakdownStore) => 
  state.calculationProgress[breakdownId];

export const selectBreakdownsForPortfolio = (portfolioId: string) => (state: PortfolioExposureBreakdownStore) => 
  Object.values(state.breakdowns).filter(breakdown => breakdown.portfolioId === portfolioId);

export const selectDiversificationSummary = (state: PortfolioExposureBreakdownStore) => {
  const activeBreakdowns = Object.values(state.breakdowns).filter(b => b.isActive);
  
  if (activeBreakdowns.length === 0) {
    return {
      averageScore: 0,
      bestPerforming: null,
      needsImprovement: []
    };
  }
  
  const scores = activeBreakdowns.map(b => ({
    breakdownId: b.id,
    breakdownName: b.breakdownName,
    score: b.diversificationAnalysis?.diversificationRatio || 0
  }));
  
  const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const bestPerforming = scores.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  const needsImprovement = scores.filter(s => s.score < 0.5);
  
  return {
    averageScore,
    bestPerforming,
    needsImprovement
  };
};

export const selectRiskSummary = (state: PortfolioExposureBreakdownStore) => {
  const activeBreakdowns = Object.values(state.breakdowns).filter(b => b.isActive);
  
  if (activeBreakdowns.length === 0) {
    return {
      averageConcentration: 0,
      highRiskCount: 0,
      totalBreakdowns: 0
    };
  }
  
  const concentrations = activeBreakdowns.map(b => 
    b.concentrationAnalysis?.concentrationRatio || 0
  );
  
  const averageConcentration = concentrations.reduce((sum, c) => sum + c, 0) / concentrations.length;
  const highRiskCount = concentrations.filter(c => c > 0.3).length;
  
  return {
    averageConcentration,
    highRiskCount,
    totalBreakdowns: activeBreakdowns.length
  };
};

// Type definitions for analytics
interface ExposureMetrics {
  totalBreakdowns: number;
  avgDiversificationScore: number;
  avgConcentrationRatio: number;
  totalAnalyses: number;
  cacheHitRate: number;
}

interface RiskDistribution {
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  avgConcentration: number;
}

interface DiversificationStats {
  avgDiversificationRatio: number;
  avgEffectivePositions: number;
  avgSectorDiversification: number;
  avgGeographicDiversification: number;
}

// Subscribe to store changes for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  usePortfolioExposureBreakdownStore.subscribe(
    (state) => state.breakdowns,
    (breakdowns) => {
      console.log('Portfolio Exposure Breakdowns updated:', Object.keys(breakdowns).length);
    }
  );
  
  usePortfolioExposureBreakdownStore.subscribe(
    (state) => state.analysisResults,
    (results) => {
      console.log('Analysis Results updated:', Object.keys(results).length);
    }
  );
}

export default usePortfolioExposureBreakdownStore; 