import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Block 48: Rotation Aggression Control - Frontend Hook with API Integration

export interface RotationPreferences {
  rotation_aggression_level: number; // 1-10 scale
  rotation_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'manual';
  max_rotation_percentage: number;
  min_rotation_threshold: number;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive';
  volatility_tolerance: number;
  drawdown_tolerance: number;
  auto_rebalance_enabled: boolean;
  rebalance_trigger_threshold: number;
  max_single_trade_size: number;
  cash_buffer_percentage: number;
  strategy_rotation_enabled: boolean;
  max_active_strategies: number;
  tax_loss_harvesting_enabled: boolean;
  tax_optimization_priority: number;
  nz_tax_optimization: boolean;
  franking_credits_consideration: boolean;
  currency_hedging_preference: 'auto' | 'hedge_all' | 'hedge_none' | 'selective';
}

export interface RotationEvent {
  rotation_type: 'automatic' | 'manual' | 'triggered' | 'scheduled';
  aggression_level: number;
  assets_rotated: number;
  total_rotation_amount: number;
  expected_return_improvement?: number;
  risk_reduction_achieved?: number;
  transaction_costs?: number;
  tax_impact?: number;
  market_volatility?: number;
  market_trend?: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  rotation_trigger?: string;
  rotation_data?: Record<string, any>;
}

export interface RotationRecommendation {
  recommended_aggression_level: number;
  rotation_actions: Array<{
    action: string;
    asset: string;
    current_allocation: number;
    target_allocation: number;
    rotation_amount: number;
  }>;
  expected_impact: {
    return_improvement: number;
    risk_reduction: number;
    transaction_costs: number;
  };
  risk_assessment: {
    volatility_increase: number;
    max_drawdown_risk: number;
    correlation_risk: number;
  };
  tax_implications: {
    capital_gains_tax: number;
    wash_sale_risk: number;
    tax_optimization_benefit: number;
  };
  market_context: {
    market_trend: string;
    volatility_level: string;
    recommended_timing: string;
  };
}

const DEFAULT_ROTATION_PREFERENCES: RotationPreferences = {
  rotation_aggression_level: 5,
  rotation_frequency: 'monthly',
  max_rotation_percentage: 20.0,
  min_rotation_threshold: 5.0,
  risk_tolerance: 'moderate',
  volatility_tolerance: 15.0,
  drawdown_tolerance: 10.0,
  auto_rebalance_enabled: true,
  rebalance_trigger_threshold: 5.0,
  max_single_trade_size: 10.0,
  cash_buffer_percentage: 2.0,
  strategy_rotation_enabled: true,
  max_active_strategies: 3,
  tax_loss_harvesting_enabled: true,
  tax_optimization_priority: 5,
  nz_tax_optimization: true,
  franking_credits_consideration: true,
  currency_hedging_preference: 'auto'
};

export const useRotationControl = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<RotationPreferences>(DEFAULT_ROTATION_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [rotationHistory, setRotationHistory] = useState<RotationEvent[]>([]);
  const [currentRecommendation, setCurrentRecommendation] = useState<RotationRecommendation | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Load rotation preferences from API
  const loadRotationPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rotation/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
        setLastUpdated(data.updated_at);
        
        // Cache in localStorage as backup
        localStorage.setItem('rotation-preferences', JSON.stringify(data.preferences));
      } else {
        throw new Error('Failed to load rotation preferences from server');
      }
    } catch (err) {
      console.error('Error loading rotation preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rotation preferences');
      
      // Fallback to localStorage
      const cached = localStorage.getItem('rotation-preferences');
      if (cached) {
        try {
          const cachedPrefs = JSON.parse(cached) as RotationPreferences;
          setPreferences(cachedPrefs);
        } catch {
          setPreferences(DEFAULT_ROTATION_PREFERENCES);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save rotation preferences to API
  const saveRotationPreferences = useCallback(async (newPreferences: Partial<RotationPreferences>) => {
    if (!user) return;

    try {
      setError(null);
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      // Update state immediately for responsiveness
      setPreferences(updatedPreferences);
      
      // Save to localStorage immediately
      localStorage.setItem('rotation-preferences', JSON.stringify(updatedPreferences));

      const response = await fetch(`/api/rotation/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences: updatedPreferences
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLastUpdated(new Date().toISOString());
        console.log('Rotation preferences saved:', data.message);
      } else {
        throw new Error('Failed to save rotation preferences to server');
      }
    } catch (err) {
      console.error('Error saving rotation preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save rotation preferences');
    }
  }, [user, preferences]);

  // Get rotation recommendation
  const getRotationRecommendation = useCallback(async (portfolioData: Record<string, any>) => {
    if (!user) return null;

    try {
      setError(null);

      const response = await fetch(`/api/rotation/recommend/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(portfolioData)
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentRecommendation(data.recommendation);
        return data.recommendation;
      } else {
        throw new Error('Failed to get rotation recommendation');
      }
    } catch (err) {
      console.error('Error getting rotation recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to get rotation recommendation');
      return null;
    }
  }, [user]);

  // Execute rotation
  const executeRotation = useCallback(async (rotationEvent: RotationEvent) => {
    if (!user) return null;

    try {
      setError(null);

      const response = await fetch(`/api/rotation/execute/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rotationEvent)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add to history
        setRotationHistory(prev => [rotationEvent, ...prev]);
        
        // Clear current recommendation
        setCurrentRecommendation(null);
        
        return data;
      } else {
        throw new Error('Failed to execute rotation');
      }
    } catch (err) {
      console.error('Error executing rotation:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute rotation');
      return null;
    }
  }, [user]);

  // Load rotation history
  const loadRotationHistory = useCallback(async (limit: number = 50) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/rotation/history/${user.id}?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRotationHistory(data.history);
      } else {
        throw new Error('Failed to load rotation history');
      }
    } catch (err) {
      console.error('Error loading rotation history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rotation history');
    }
  }, [user]);

  // Load performance metrics
  const loadPerformanceMetrics = useCallback(async (period: string = '30d') => {
    if (!user) return;

    try {
      const response = await fetch(`/api/rotation/performance/${user.id}?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPerformanceMetrics(data.performance);
      } else {
        throw new Error('Failed to load performance metrics');
      }
    } catch (err) {
      console.error('Error loading performance metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance metrics');
    }
  }, [user]);

  // Reset preferences to default
  const resetToDefault = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      const response = await fetch(`/api/rotation/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
        setLastUpdated(new Date().toISOString());
        
        // Update localStorage
        localStorage.setItem('rotation-preferences', JSON.stringify(data.preferences));
      } else {
        throw new Error('Failed to reset rotation preferences');
      }
    } catch (err) {
      console.error('Error resetting rotation preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset rotation preferences');
    }
  }, [user]);

  // Convenience functions for common adjustments
  const setAggressionLevel = useCallback((level: number) => {
    if (level >= 1 && level <= 10) {
      saveRotationPreferences({ rotation_aggression_level: level });
    }
  }, [saveRotationPreferences]);

  const setRotationFrequency = useCallback((frequency: RotationPreferences['rotation_frequency']) => {
    saveRotationPreferences({ rotation_frequency: frequency });
  }, [saveRotationPreferences]);

  const setRiskTolerance = useCallback((tolerance: RotationPreferences['risk_tolerance']) => {
    saveRotationPreferences({ risk_tolerance: tolerance });
  }, [saveRotationPreferences]);

  const toggleAutoRebalance = useCallback(() => {
    saveRotationPreferences({ auto_rebalance_enabled: !preferences.auto_rebalance_enabled });
  }, [preferences.auto_rebalance_enabled, saveRotationPreferences]);

  const toggleStrategyRotation = useCallback(() => {
    saveRotationPreferences({ strategy_rotation_enabled: !preferences.strategy_rotation_enabled });
  }, [preferences.strategy_rotation_enabled, saveRotationPreferences]);

  const toggleTaxOptimization = useCallback(() => {
    saveRotationPreferences({ tax_loss_harvesting_enabled: !preferences.tax_loss_harvesting_enabled });
  }, [preferences.tax_loss_harvesting_enabled, saveRotationPreferences]);

  // Calculate risk level based on preferences
  const calculateRiskLevel = useCallback((): 'low' | 'medium' | 'high' | 'very_high' => {
    const aggressionWeight = preferences.rotation_aggression_level * 0.4;
    const volatilityWeight = preferences.volatility_tolerance * 0.3;
    const drawdownWeight = preferences.drawdown_tolerance * 0.3;
    
    const totalRisk = aggressionWeight + volatilityWeight + drawdownWeight;
    
    if (totalRisk <= 15) return 'low';
    if (totalRisk <= 25) return 'medium';
    if (totalRisk <= 35) return 'high';
    return 'very_high';
  }, [preferences]);

  // Load preferences on mount and user change
  useEffect(() => {
    loadRotationPreferences();
  }, [loadRotationPreferences]);

  // Auto-load history and metrics when preferences are loaded
  useEffect(() => {
    if (user && !loading) {
      loadRotationHistory();
      loadPerformanceMetrics();
    }
  }, [user, loading, loadRotationHistory, loadPerformanceMetrics]);

  return {
    // State
    preferences,
    loading,
    error,
    lastUpdated,
    rotationHistory,
    currentRecommendation,
    performanceMetrics,
    
    // Actions
    saveRotationPreferences,
    getRotationRecommendation,
    executeRotation,
    loadRotationHistory,
    loadPerformanceMetrics,
    resetToDefault,
    
    // Convenience methods
    setAggressionLevel,
    setRotationFrequency,
    setRiskTolerance,
    toggleAutoRebalance,
    toggleStrategyRotation,
    toggleTaxOptimization,
    
    // Computed values
    riskLevel: calculateRiskLevel(),
    isConservative: preferences.risk_tolerance === 'conservative',
    isAggressive: preferences.risk_tolerance === 'aggressive' || preferences.risk_tolerance === 'very_aggressive',
    hasActiveRecommendation: currentRecommendation !== null,
    rotationEnabled: preferences.auto_rebalance_enabled || preferences.strategy_rotation_enabled
  };
}; 
import { useAuth } from '../contexts/AuthContext';

// Block 48: Rotation Aggression Control - Frontend Hook with API Integration

export interface RotationPreferences {
  rotation_aggression_level: number; // 1-10 scale
  rotation_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'manual';
  max_rotation_percentage: number;
  min_rotation_threshold: number;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive';
  volatility_tolerance: number;
  drawdown_tolerance: number;
  auto_rebalance_enabled: boolean;
  rebalance_trigger_threshold: number;
  max_single_trade_size: number;
  cash_buffer_percentage: number;
  strategy_rotation_enabled: boolean;
  max_active_strategies: number;
  tax_loss_harvesting_enabled: boolean;
  tax_optimization_priority: number;
  nz_tax_optimization: boolean;
  franking_credits_consideration: boolean;
  currency_hedging_preference: 'auto' | 'hedge_all' | 'hedge_none' | 'selective';
}

export interface RotationEvent {
  rotation_type: 'automatic' | 'manual' | 'triggered' | 'scheduled';
  aggression_level: number;
  assets_rotated: number;
  total_rotation_amount: number;
  expected_return_improvement?: number;
  risk_reduction_achieved?: number;
  transaction_costs?: number;
  tax_impact?: number;
  market_volatility?: number;
  market_trend?: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  rotation_trigger?: string;
  rotation_data?: Record<string, any>;
}

export interface RotationRecommendation {
  recommended_aggression_level: number;
  rotation_actions: Array<{
    action: string;
    asset: string;
    current_allocation: number;
    target_allocation: number;
    rotation_amount: number;
  }>;
  expected_impact: {
    return_improvement: number;
    risk_reduction: number;
    transaction_costs: number;
  };
  risk_assessment: {
    volatility_increase: number;
    max_drawdown_risk: number;
    correlation_risk: number;
  };
  tax_implications: {
    capital_gains_tax: number;
    wash_sale_risk: number;
    tax_optimization_benefit: number;
  };
  market_context: {
    market_trend: string;
    volatility_level: string;
    recommended_timing: string;
  };
}

const DEFAULT_ROTATION_PREFERENCES: RotationPreferences = {
  rotation_aggression_level: 5,
  rotation_frequency: 'monthly',
  max_rotation_percentage: 20.0,
  min_rotation_threshold: 5.0,
  risk_tolerance: 'moderate',
  volatility_tolerance: 15.0,
  drawdown_tolerance: 10.0,
  auto_rebalance_enabled: true,
  rebalance_trigger_threshold: 5.0,
  max_single_trade_size: 10.0,
  cash_buffer_percentage: 2.0,
  strategy_rotation_enabled: true,
  max_active_strategies: 3,
  tax_loss_harvesting_enabled: true,
  tax_optimization_priority: 5,
  nz_tax_optimization: true,
  franking_credits_consideration: true,
  currency_hedging_preference: 'auto'
};

export const useRotationControl = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<RotationPreferences>(DEFAULT_ROTATION_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [rotationHistory, setRotationHistory] = useState<RotationEvent[]>([]);
  const [currentRecommendation, setCurrentRecommendation] = useState<RotationRecommendation | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Load rotation preferences from API
  const loadRotationPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rotation/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
        setLastUpdated(data.updated_at);
        
        // Cache in localStorage as backup
        localStorage.setItem('rotation-preferences', JSON.stringify(data.preferences));
      } else {
        throw new Error('Failed to load rotation preferences from server');
      }
    } catch (err) {
      console.error('Error loading rotation preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rotation preferences');
      
      // Fallback to localStorage
      const cached = localStorage.getItem('rotation-preferences');
      if (cached) {
        try {
          const cachedPrefs = JSON.parse(cached) as RotationPreferences;
          setPreferences(cachedPrefs);
        } catch {
          setPreferences(DEFAULT_ROTATION_PREFERENCES);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save rotation preferences to API
  const saveRotationPreferences = useCallback(async (newPreferences: Partial<RotationPreferences>) => {
    if (!user) return;

    try {
      setError(null);
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      // Update state immediately for responsiveness
      setPreferences(updatedPreferences);
      
      // Save to localStorage immediately
      localStorage.setItem('rotation-preferences', JSON.stringify(updatedPreferences));

      const response = await fetch(`/api/rotation/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences: updatedPreferences
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLastUpdated(new Date().toISOString());
        console.log('Rotation preferences saved:', data.message);
      } else {
        throw new Error('Failed to save rotation preferences to server');
      }
    } catch (err) {
      console.error('Error saving rotation preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save rotation preferences');
    }
  }, [user, preferences]);

  // Get rotation recommendation
  const getRotationRecommendation = useCallback(async (portfolioData: Record<string, any>) => {
    if (!user) return null;

    try {
      setError(null);

      const response = await fetch(`/api/rotation/recommend/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(portfolioData)
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentRecommendation(data.recommendation);
        return data.recommendation;
      } else {
        throw new Error('Failed to get rotation recommendation');
      }
    } catch (err) {
      console.error('Error getting rotation recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to get rotation recommendation');
      return null;
    }
  }, [user]);

  // Execute rotation
  const executeRotation = useCallback(async (rotationEvent: RotationEvent) => {
    if (!user) return null;

    try {
      setError(null);

      const response = await fetch(`/api/rotation/execute/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rotationEvent)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add to history
        setRotationHistory(prev => [rotationEvent, ...prev]);
        
        // Clear current recommendation
        setCurrentRecommendation(null);
        
        return data;
      } else {
        throw new Error('Failed to execute rotation');
      }
    } catch (err) {
      console.error('Error executing rotation:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute rotation');
      return null;
    }
  }, [user]);

  // Load rotation history
  const loadRotationHistory = useCallback(async (limit: number = 50) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/rotation/history/${user.id}?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRotationHistory(data.history);
      } else {
        throw new Error('Failed to load rotation history');
      }
    } catch (err) {
      console.error('Error loading rotation history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rotation history');
    }
  }, [user]);

  // Load performance metrics
  const loadPerformanceMetrics = useCallback(async (period: string = '30d') => {
    if (!user) return;

    try {
      const response = await fetch(`/api/rotation/performance/${user.id}?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPerformanceMetrics(data.performance);
      } else {
        throw new Error('Failed to load performance metrics');
      }
    } catch (err) {
      console.error('Error loading performance metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance metrics');
    }
  }, [user]);

  // Reset preferences to default
  const resetToDefault = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      const response = await fetch(`/api/rotation/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
        setLastUpdated(new Date().toISOString());
        
        // Update localStorage
        localStorage.setItem('rotation-preferences', JSON.stringify(data.preferences));
      } else {
        throw new Error('Failed to reset rotation preferences');
      }
    } catch (err) {
      console.error('Error resetting rotation preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset rotation preferences');
    }
  }, [user]);

  // Convenience functions for common adjustments
  const setAggressionLevel = useCallback((level: number) => {
    if (level >= 1 && level <= 10) {
      saveRotationPreferences({ rotation_aggression_level: level });
    }
  }, [saveRotationPreferences]);

  const setRotationFrequency = useCallback((frequency: RotationPreferences['rotation_frequency']) => {
    saveRotationPreferences({ rotation_frequency: frequency });
  }, [saveRotationPreferences]);

  const setRiskTolerance = useCallback((tolerance: RotationPreferences['risk_tolerance']) => {
    saveRotationPreferences({ risk_tolerance: tolerance });
  }, [saveRotationPreferences]);

  const toggleAutoRebalance = useCallback(() => {
    saveRotationPreferences({ auto_rebalance_enabled: !preferences.auto_rebalance_enabled });
  }, [preferences.auto_rebalance_enabled, saveRotationPreferences]);

  const toggleStrategyRotation = useCallback(() => {
    saveRotationPreferences({ strategy_rotation_enabled: !preferences.strategy_rotation_enabled });
  }, [preferences.strategy_rotation_enabled, saveRotationPreferences]);

  const toggleTaxOptimization = useCallback(() => {
    saveRotationPreferences({ tax_loss_harvesting_enabled: !preferences.tax_loss_harvesting_enabled });
  }, [preferences.tax_loss_harvesting_enabled, saveRotationPreferences]);

  // Calculate risk level based on preferences
  const calculateRiskLevel = useCallback((): 'low' | 'medium' | 'high' | 'very_high' => {
    const aggressionWeight = preferences.rotation_aggression_level * 0.4;
    const volatilityWeight = preferences.volatility_tolerance * 0.3;
    const drawdownWeight = preferences.drawdown_tolerance * 0.3;
    
    const totalRisk = aggressionWeight + volatilityWeight + drawdownWeight;
    
    if (totalRisk <= 15) return 'low';
    if (totalRisk <= 25) return 'medium';
    if (totalRisk <= 35) return 'high';
    return 'very_high';
  }, [preferences]);

  // Load preferences on mount and user change
  useEffect(() => {
    loadRotationPreferences();
  }, [loadRotationPreferences]);

  // Auto-load history and metrics when preferences are loaded
  useEffect(() => {
    if (user && !loading) {
      loadRotationHistory();
      loadPerformanceMetrics();
    }
  }, [user, loading, loadRotationHistory, loadPerformanceMetrics]);

  return {
    // State
    preferences,
    loading,
    error,
    lastUpdated,
    rotationHistory,
    currentRecommendation,
    performanceMetrics,
    
    // Actions
    saveRotationPreferences,
    getRotationRecommendation,
    executeRotation,
    loadRotationHistory,
    loadPerformanceMetrics,
    resetToDefault,
    
    // Convenience methods
    setAggressionLevel,
    setRotationFrequency,
    setRiskTolerance,
    toggleAutoRebalance,
    toggleStrategyRotation,
    toggleTaxOptimization,
    
    // Computed values
    riskLevel: calculateRiskLevel(),
    isConservative: preferences.risk_tolerance === 'conservative',
    isAggressive: preferences.risk_tolerance === 'aggressive' || preferences.risk_tolerance === 'very_aggressive',
    hasActiveRecommendation: currentRecommendation !== null,
    rotationEnabled: preferences.auto_rebalance_enabled || preferences.strategy_rotation_enabled
  };
}; 