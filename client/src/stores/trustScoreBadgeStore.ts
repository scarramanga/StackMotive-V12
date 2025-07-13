// Block 94: Trust Score Badge - Store
// Zustand State Management for Trust Score Badges

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TrustScoreBadgeEngine } from '../engines/TrustScoreBadgeEngine';
import {
  TrustScoreBadge,
  TrustScore,
  TrustScoreHistory,
  TrustScoreBadgeState,
  ComponentAnalysis,
  ScoreComparison,
  ScoreInsight,
  TimeRange
} from '../types/trustScoreBadge';

interface TrustScoreBadgeStore extends TrustScoreBadgeState {
  // Engine reference
  engine: TrustScoreBadgeEngine;
  
  // Actions
  actions: {
    // Badge operations
    createBadge: (config: Omit<TrustScoreBadge, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<TrustScoreBadge>;
    updateBadge: (id: string, updates: Partial<TrustScoreBadge>) => Promise<TrustScoreBadge>;
    deleteBadge: (id: string) => Promise<void>;
    loadBadges: () => Promise<void>;
    
    // Score operations
    calculateScore: (badgeId: string) => Promise<TrustScore>;
    recalculateScore: (badgeId: string, forceRefresh?: boolean) => Promise<TrustScore>;
    
    // Analysis operations
    analyzeScoreComponents: (badgeId: string) => Promise<ComponentAnalysis>;
    compareScores: (badgeId1: string, badgeId2: string) => Promise<ScoreComparison>;
    getScoreInsights: (badgeId: string) => Promise<ScoreInsight[]>;
    
    // Historical operations
    getScoreHistory: (badgeId: string, timeRange?: TimeRange) => Promise<TrustScoreHistory[]>;
    
    // Selection and UI state
    setCurrentBadge: (badgeId: string | null) => void;
    toggleBadgeSelection: (badgeId: string) => void;
    clearSelection: () => void;
    
    // Queue management
    addToCalculationQueue: (badgeId: string) => void;
    removeFromCalculationQueue: (badgeId: string) => void;
    processCalculationQueue: () => Promise<void>;
    
    // Cache management
    invalidateCache: (badgeId?: string) => void;
    refreshData: () => Promise<void>;
    
    // Error handling
    setError: (key: string, error: string) => void;
    clearError: (key: string) => void;
    clearAllErrors: () => void;
  };
  
  // Computed values
  computed: {
    getCurrentBadge: () => TrustScoreBadge | null;
    getBadgesByEntity: (entityId: string) => TrustScoreBadge[];
    getBadgesByEntityType: (entityType: string) => TrustScoreBadge[];
    getBadgesByScoreRange: (minScore: number, maxScore: number) => TrustScoreBadge[];
    getBadgeStats: () => {
      totalBadges: number;
      averageScore: number;
      highestScore: number;
      lowestScore: number;
      gradeDistribution: Record<string, number>;
      activeCalculations: number;
    } | null;
    getRecentlyUpdated: (hours: number) => TrustScoreBadge[];
  };
}

export const useTrustScoreBadgeStore = create<TrustScoreBadgeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      badges: {},
      currentBadgeId: null,
      badgesByEntity: {},
      calculationQueue: [],
      selectedBadgeIds: [],
      lastUpdated: {},
      cacheExpiry: 15 * 60 * 1000, // 15 minutes
      errors: {},
      
      // Engine instance
      engine: TrustScoreBadgeEngine.getInstance(),
      
      // Actions
      actions: {
        // Create new badge
        createBadge: async (config) => {
          const { engine } = get();
          
          try {
            const newBadge = engine.createBadge(config);
            
            set((state) => ({
              badges: {
                ...state.badges,
                [newBadge.id]: newBadge
              },
              badgesByEntity: {
                ...state.badgesByEntity,
                [newBadge.entityId]: [
                  ...(state.badgesByEntity[newBadge.entityId] || []),
                  newBadge.id
                ]
              },
              currentBadgeId: newBadge.id,
              lastUpdated: {
                ...state.lastUpdated,
                [newBadge.id]: new Date()
              }
            }));
            
            return newBadge;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create badge';
            get().actions.setError('create', errorMessage);
            throw error;
          }
        },
        
        // Update badge
        updateBadge: async (id, updates) => {
          const { engine } = get();
          
          try {
            const updatedBadge = engine.updateBadge(id, updates);
            
            set((state) => ({
              badges: {
                ...state.badges,
                [id]: updatedBadge
              },
              lastUpdated: {
                ...state.lastUpdated,
                [id]: new Date()
              }
            }));
            
            return updatedBadge;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update badge';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Delete badge
        deleteBadge: async (id) => {
          const { engine } = get();
          
          try {
            const badge = state.badges[id];
            if (badge) {
              engine.deleteBadge(id);
              
              set((state) => {
                const { [id]: deletedBadge, ...remainingBadges } = state.badges;
                const { [id]: deletedUpdate, ...remainingUpdates } = state.lastUpdated;
                const { [id]: deletedErrors, ...remainingErrors } = state.errors;
                
                // Remove from entity mapping
                const updatedBadgesByEntity = { ...state.badgesByEntity };
                if (badge.entityId && updatedBadgesByEntity[badge.entityId]) {
                  updatedBadgesByEntity[badge.entityId] = updatedBadgesByEntity[badge.entityId].filter(badgeId => badgeId !== id);
                  if (updatedBadgesByEntity[badge.entityId].length === 0) {
                    delete updatedBadgesByEntity[badge.entityId];
                  }
                }
                
                return {
                  badges: remainingBadges,
                  badgesByEntity: updatedBadgesByEntity,
                  currentBadgeId: state.currentBadgeId === id ? null : state.currentBadgeId,
                  selectedBadgeIds: state.selectedBadgeIds.filter(badgeId => badgeId !== id),
                  calculationQueue: state.calculationQueue.filter(badgeId => badgeId !== id),
                  lastUpdated: remainingUpdates,
                  errors: remainingErrors
                };
              });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete badge';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Load all badges
        loadBadges: async () => {
          const { engine } = get();
          
          try {
            const badges = engine.getBadges();
            const badgeDict = badges.reduce((acc, badge) => {
              acc[badge.id] = badge;
              return acc;
            }, {} as Record<string, TrustScoreBadge>);
            
            const badgesByEntity = badges.reduce((acc, badge) => {
              if (!acc[badge.entityId]) {
                acc[badge.entityId] = [];
              }
              acc[badge.entityId].push(badge.id);
              return acc;
            }, {} as Record<string, string[]>);
            
            const now = new Date();
            const lastUpdated = badges.reduce((acc, badge) => {
              acc[badge.id] = now;
              return acc;
            }, {} as Record<string, Date>);
            
            set((state) => ({
              badges: badgeDict,
              badgesByEntity,
              lastUpdated,
              currentBadgeId: state.currentBadgeId || (badges.length > 0 ? badges[0].id : null)
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load badges';
            get().actions.setError('load', errorMessage);
            throw error;
          }
        },
        
        // Calculate score
        calculateScore: async (badgeId) => {
          const { engine } = get();
          
          try {
            const trustScore = await engine.calculateScore(badgeId);
            
            // Update badge with new score
            const updatedBadge = engine.getBadge(badgeId);
            if (updatedBadge) {
              set((state) => ({
                badges: {
                  ...state.badges,
                  [badgeId]: updatedBadge
                },
                lastUpdated: {
                  ...state.lastUpdated,
                  [badgeId]: new Date()
                }
              }));
            }
            
            return trustScore;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to calculate score';
            get().actions.setError(badgeId, errorMessage);
            throw error;
          }
        },
        
        // Recalculate score
        recalculateScore: async (badgeId, forceRefresh = false) => {
          const { engine } = get();
          
          try {
            const trustScore = await engine.recalculateScore(badgeId, forceRefresh);
            
            // Update badge with new score
            const updatedBadge = engine.getBadge(badgeId);
            if (updatedBadge) {
              set((state) => ({
                badges: {
                  ...state.badges,
                  [badgeId]: updatedBadge
                },
                lastUpdated: {
                  ...state.lastUpdated,
                  [badgeId]: new Date()
                }
              }));
            }
            
            return trustScore;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to recalculate score';
            get().actions.setError(badgeId, errorMessage);
            throw error;
          }
        },
        
        // Analyze score components
        analyzeScoreComponents: async (badgeId) => {
          try {
            const badge = get().badges[badgeId];
            if (!badge) {
              throw new Error('Badge not found');
            }
            
            // Mock component analysis
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
              componentScores: badge.trustScore.componentScores,
              strengths: ['Strong performance', 'Good transparency'],
              weaknesses: ['Limited market validation'],
              recommendations: ['Improve market presence'],
              improvementPotential: 10
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to analyze components';
            get().actions.setError('analysis', errorMessage);
            throw error;
          }
        },
        
        // Compare scores
        compareScores: async (badgeId1, badgeId2) => {
          try {
            const { badges } = get();
            const badge1 = badges[badgeId1];
            const badge2 = badges[badgeId2];
            
            if (!badge1 || !badge2) {
              throw new Error('One or both badges not found');
            }
            
            // Mock comparison
            await new Promise(resolve => setTimeout(resolve, 800));
            
            return {
              badge1,
              badge2,
              scoreDifference: badge1.trustScore.overallScore - badge2.trustScore.overallScore,
              componentComparison: {},
              relativeStrengths: [],
              analysis: 'Comparison analysis results'
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to compare scores';
            get().actions.setError('comparison', errorMessage);
            throw error;
          }
        },
        
        // Get score insights
        getScoreInsights: async (badgeId) => {
          try {
            // Mock insights
            await new Promise(resolve => setTimeout(resolve, 600));
            
            return [
              {
                insightId: 'insight_1',
                type: 'positive' as const,
                category: 'Performance',
                title: 'Strong Performance',
                description: 'Excellent risk-adjusted returns',
                impact: 8,
                actionable: false
              }
            ];
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to get insights';
            get().actions.setError('insights', errorMessage);
            throw error;
          }
        },
        
        // Get score history
        getScoreHistory: async (badgeId, timeRange) => {
          const { engine } = get();
          
          try {
            const history = engine.getScoreHistory(badgeId);
            
            // Apply time range filter if provided
            if (timeRange) {
              const now = new Date();
              let startDate: Date;
              
              switch (timeRange.period) {
                case '1M':
                  startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                  break;
                case '3M':
                  startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                  break;
                case '6M':
                  startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                  break;
                case '1Y':
                  startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                  break;
                default:
                  startDate = timeRange.startDate || new Date(0);
              }
              
              const endDate = timeRange.endDate || now;
              
              return history.filter(item => 
                item.calculationDate >= startDate && item.calculationDate <= endDate
              );
            }
            
            return history;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to get score history';
            get().actions.setError('history', errorMessage);
            throw error;
          }
        },
        
        // Set current badge
        setCurrentBadge: (badgeId) => {
          set({ currentBadgeId: badgeId });
        },
        
        // Toggle badge selection
        toggleBadgeSelection: (badgeId) => {
          set((state) => ({
            selectedBadgeIds: state.selectedBadgeIds.includes(badgeId)
              ? state.selectedBadgeIds.filter(id => id !== badgeId)
              : [...state.selectedBadgeIds, badgeId]
          }));
        },
        
        // Clear selection
        clearSelection: () => {
          set({ selectedBadgeIds: [] });
        },
        
        // Add to calculation queue
        addToCalculationQueue: (badgeId) => {
          set((state) => ({
            calculationQueue: [...state.calculationQueue, badgeId]
          }));
        },
        
        // Remove from calculation queue
        removeFromCalculationQueue: (badgeId) => {
          set((state) => ({
            calculationQueue: state.calculationQueue.filter(id => id !== badgeId)
          }));
        },
        
        // Process calculation queue
        processCalculationQueue: async () => {
          const { calculationQueue } = get();
          
          for (const badgeId of calculationQueue) {
            try {
              await get().actions.calculateScore(badgeId);
              get().actions.removeFromCalculationQueue(badgeId);
            } catch (error) {
              console.error(`Failed to process badge ${badgeId}:`, error);
              get().actions.removeFromCalculationQueue(badgeId);
            }
          }
        },
        
        // Cache management
        invalidateCache: (badgeId) => {
          if (badgeId) {
            set((state) => {
              const { [badgeId]: deleted, ...remaining } = state.lastUpdated;
              return { lastUpdated: remaining };
            });
          } else {
            set({ lastUpdated: {} });
          }
        },
        
        // Refresh data
        refreshData: async () => {
          await get().actions.loadBadges();
        },
        
        // Error handling
        setError: (key, error) => {
          set((state) => ({
            errors: {
              ...state.errors,
              [key]: error
            }
          }));
        },
        
        clearError: (key) => {
          set((state) => {
            const { [key]: deleted, ...remaining } = state.errors;
            return { errors: remaining };
          });
        },
        
        clearAllErrors: () => {
          set({ errors: {} });
        }
      },
      
      // Computed values
      computed: {
        // Get current badge
        getCurrentBadge: () => {
          const { badges, currentBadgeId } = get();
          return currentBadgeId ? badges[currentBadgeId] || null : null;
        },
        
        // Get badges by entity
        getBadgesByEntity: (entityId) => {
          const { badges, badgesByEntity } = get();
          const badgeIds = badgesByEntity[entityId] || [];
          return badgeIds.map(id => badges[id]).filter(Boolean);
        },
        
        // Get badges by entity type
        getBadgesByEntityType: (entityType) => {
          const { badges } = get();
          return Object.values(badges).filter(badge => badge.entityType === entityType);
        },
        
        // Get badges by score range
        getBadgesByScoreRange: (minScore, maxScore) => {
          const { badges } = get();
          return Object.values(badges).filter(badge => 
            badge.trustScore.overallScore >= minScore && badge.trustScore.overallScore <= maxScore
          );
        },
        
        // Get badge statistics
        getBadgeStats: () => {
          const { badges } = get();
          const badgeArray = Object.values(badges);
          
          if (badgeArray.length === 0) return null;
          
          const averageScore = badgeArray.reduce((sum, badge) => sum + badge.trustScore.overallScore, 0) / badgeArray.length;
          const highestScore = Math.max(...badgeArray.map(b => b.trustScore.overallScore));
          const lowestScore = Math.min(...badgeArray.map(b => b.trustScore.overallScore));
          
          const gradeDistribution = badgeArray.reduce((acc, badge) => {
            acc[badge.trustScore.scoreGrade] = (acc[badge.trustScore.scoreGrade] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          return {
            totalBadges: badgeArray.length,
            averageScore: Math.round(averageScore * 100) / 100,
            highestScore,
            lowestScore,
            gradeDistribution,
            activeCalculations: get().calculationQueue.length
          };
        },
        
        // Get recently updated badges
        getRecentlyUpdated: (hours) => {
          const { badges, lastUpdated } = get();
          const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
          
          return Object.values(badges).filter(badge => {
            const updateTime = lastUpdated[badge.id];
            return updateTime && updateTime > cutoffTime;
          });
        }
      }
    }),
    {
      name: 'trust-score-badge-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only essential state
        currentBadgeId: state.currentBadgeId,
        selectedBadgeIds: state.selectedBadgeIds,
        calculationQueue: state.calculationQueue,
        cacheExpiry: state.cacheExpiry
      })
    }
  )
);

// Initialize store
useTrustScoreBadgeStore.getState().actions.loadBadges();

export default useTrustScoreBadgeStore; 