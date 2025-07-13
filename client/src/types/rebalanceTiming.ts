// Block 43: Rebalance Timing Alert Engine - Types
export interface RebalanceTimer {
  id: string;
  strategyId: string;
  name: string;
  strategy: TimingStrategy;
  userId?: string;
  isActive: boolean;
  nextTrigger: Date | null;
  lastTriggered: Date | null;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimingStrategy {
  type: 'fixed_interval' | 'daily' | 'weekly' | 'monthly' | 'market_close' | 'market_open' | 'custom';
  intervalMs?: number; // For fixed_interval type
  hour?: number; // 0-23
  minute?: number; // 0-59
  dayOfWeek?: number; // 0-6 (Sunday = 0)
  dayOfMonth?: number; // 1-31
  timezone?: string; // IANA timezone
  marketHolidays?: boolean; // Skip market holidays
  customCron?: string; // For custom type
}

export interface TimingRule {
  id: string;
  name: string;
  description: string;
  strategy: TimingStrategy;
  enabled: boolean;
  conditions: TimingConditions;
  createdAt: Date;
}

export interface TimingConditions {
  minPortfolioValue?: number;
  maxPortfolioValue?: number;
  minRiskLevel?: 'low' | 'medium' | 'high';
  maxRiskLevel?: 'low' | 'medium' | 'high';
  requiredStrategies?: string[];
  excludedStrategies?: string[];
  marketConditions?: ('bull' | 'bear' | 'sideways')[];
  volatilityThreshold?: number;
}

export interface RebalanceAlert {
  id: string;
  timerId: string;
  strategyId: string;
  type: TimingTrigger;
  reason: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  data?: Record<string, any>;
}

export type TimingTrigger = 
  | 'scheduled' 
  | 'manual' 
  | 'condition_met' 
  | 'market_event' 
  | 'volatility_spike' 
  | 'drift_threshold';

export interface TimingStats {
  totalTimers: number;
  activeTimers: number;
  totalTriggers: number;
  recentAlerts: number;
  upcomingTriggers: number;
  averageInterval: number;
  mostActiveStrategy: string | null;
  triggerAccuracy: number;
}

export interface RebalanceTimingState {
  timers: RebalanceTimer[];
  rules: TimingRule[];
  alerts: RebalanceAlert[];
  selectedTimer: RebalanceTimer | null;
  filter: TimingFilter;
  isLoading: boolean;
  error: string | null;
  stats: TimingStats | null;
  upcomingTriggers: Array<{timer: RebalanceTimer, triggerTime: Date}>;
}

export interface TimingFilter {
  strategyId?: string;
  userId?: string;
  isActive?: boolean;
  type?: TimingStrategy['type'];
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TimingActions {
  createTimer: (strategyId: string, name: string, strategy: TimingStrategy, userId?: string) => RebalanceTimer;
  startTimer: (timerId: string) => boolean;
  stopTimer: (timerId: string) => boolean;
  updateTimer: (timerId: string, updates: Partial<RebalanceTimer>) => boolean;
  deleteTimer: (timerId: string) => boolean;
  triggerRebalance: (timerId: string, reason?: string) => RebalanceAlert | null;
  acknowledgeAlert: (alertId: string, userId?: string) => boolean;
  processDueTimers: () => RebalanceAlert[];
  getUpcomingTriggers: (days?: number) => Array<{timer: RebalanceTimer, triggerTime: Date}>;
  getRecentAlerts: (hours?: number) => RebalanceAlert[];
  getTimingStats: () => TimingStats;
  createRule: (rule: Omit<TimingRule, 'id' | 'createdAt'>) => TimingRule;
}

export interface TimingEvent {
  id: string;
  type: 'timer_created' | 'timer_started' | 'timer_stopped' | 'timer_triggered' | 'alert_created' | 'alert_acknowledged';
  timerId?: string;
  alertId?: string;
  userId?: string;
  timestamp: Date;
  data?: Record<string, any>;
}

export interface TimingNotification {
  timerId: string;
  type: 'upcoming_trigger' | 'missed_trigger' | 'system_error';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  scheduledFor: Date;
  sent: boolean;
}

export interface TimingCalendar {
  date: Date;
  triggers: Array<{
    timerId: string;
    timerName: string;
    strategyId: string;
    triggerTime: Date;
    type: TimingStrategy['type'];
  }>;
  isHoliday?: boolean;
  isWeekend?: boolean;
}

export interface TimingPerformanceMetrics {
  timerId: string;
  period: {
    start: Date;
    end: Date;
  };
  scheduledTriggers: number;
  actualTriggers: number;
  missedTriggers: number;
  averageDelay: number; // milliseconds
  maxDelay: number;
  reliability: number; // percentage
  impactMetrics: {
    portfolioChanges: number;
    totalRebalanced: number;
    avgRebalanceSize: number;
  };
}

export interface TimingConfiguration {
  defaultStrategy: TimingStrategy;
  maxTimersPerUser: number;
  maxTimersPerStrategy: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  timeZones: string[];
  holidayCalendars: string[];
  notificationSettings: {
    upcomingTriggerHours: number;
    missedTriggerHours: number;
    enableEmail: boolean;
    enablePush: boolean;
  };
} 