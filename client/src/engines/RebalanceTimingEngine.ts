// Block 43: Rebalance Timing Alert Engine - Engine
import { 
  RebalanceTimer, 
  TimingRule, 
  TimingTrigger,
  RebalanceAlert,
  TimingStrategy,
  TimingStats
} from '../types/rebalanceTiming';

export class RebalanceTimingEngine {
  private timers: Map<string, RebalanceTimer> = new Map();
  private rules: Map<string, TimingRule> = new Map();
  private alerts: Map<string, RebalanceAlert> = new Map();
  private activeIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Create a new rebalance timer
   */
  createTimer(
    strategyId: string,
    name: string,
    strategy: TimingStrategy,
    userId?: string
  ): RebalanceTimer {
    const timer: RebalanceTimer = {
      id: this.generateId(),
      strategyId,
      name,
      strategy,
      userId,
      isActive: false,
      nextTrigger: this.calculateNextTrigger(strategy),
      lastTriggered: null,
      triggerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.timers.set(timer.id, timer);
    return timer;
  }

  /**
   * Get timer by ID
   */
  getTimer(timerId: string): RebalanceTimer | undefined {
    return this.timers.get(timerId);
  }

  /**
   * Get all timers
   */
  getAllTimers(): RebalanceTimer[] {
    return Array.from(this.timers.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get active timers
   */
  getActiveTimers(): RebalanceTimer[] {
    return this.getAllTimers().filter(timer => timer.isActive);
  }

  /**
   * Get timers by strategy
   */
  getTimersByStrategy(strategyId: string): RebalanceTimer[] {
    return this.getAllTimers()
      .filter(timer => timer.strategyId === strategyId);
  }

  /**
   * Get timers by user
   */
  getUserTimers(userId: string): RebalanceTimer[] {
    return this.getAllTimers()
      .filter(timer => timer.userId === userId);
  }

  /**
   * Start timer
   */
  startTimer(timerId: string): boolean {
    const timer = this.timers.get(timerId);
    if (!timer) return false;

    if (timer.isActive) {
      return true; // Already active
    }

    timer.isActive = true;
    timer.updatedAt = new Date();
    
    // Schedule the next trigger
    this.scheduleNextTrigger(timer);
    
    return true;
  }

  /**
   * Stop timer
   */
  stopTimer(timerId: string): boolean {
    const timer = this.timers.get(timerId);
    if (!timer) return false;

    timer.isActive = false;
    timer.updatedAt = new Date();
    
    // Clear any scheduled intervals
    const intervalId = this.activeIntervals.get(timerId);
    if (intervalId) {
      clearTimeout(intervalId);
      this.activeIntervals.delete(timerId);
    }
    
    return true;
  }

  /**
   * Update timer strategy
   */
  updateTimer(timerId: string, updates: Partial<RebalanceTimer>): boolean {
    const timer = this.timers.get(timerId);
    if (!timer) return false;

    const wasActive = timer.isActive;
    
    // Stop timer if active
    if (wasActive) {
      this.stopTimer(timerId);
    }

    // Apply updates
    Object.assign(timer, updates);
    timer.updatedAt = new Date();
    
    // Recalculate next trigger if strategy changed
    if (updates.strategy) {
      timer.nextTrigger = this.calculateNextTrigger(updates.strategy);
    }

    // Restart if it was active
    if (wasActive) {
      this.startTimer(timerId);
    }

    return true;
  }

  /**
   * Delete timer
   */
  deleteTimer(timerId: string): boolean {
    this.stopTimer(timerId); // Ensure it's stopped first
    return this.timers.delete(timerId);
  }

  /**
   * Manually trigger rebalance
   */
  triggerRebalance(timerId: string, reason: string = 'Manual trigger'): RebalanceAlert | null {
    const timer = this.timers.get(timerId);
    if (!timer) return null;

    return this.createAlert(timer, 'manual', reason);
  }

  /**
   * Get due timers (should trigger now)
   */
  getDueTimers(): RebalanceTimer[] {
    const now = new Date();
    return this.getActiveTimers()
      .filter(timer => timer.nextTrigger && timer.nextTrigger <= now);
  }

  /**
   * Process all due timers
   */
  processDueTimers(): RebalanceAlert[] {
    const dueTimers = this.getDueTimers();
    const alerts: RebalanceAlert[] = [];

    dueTimers.forEach(timer => {
      const alert = this.handleTimerTrigger(timer);
      if (alert) {
        alerts.push(alert);
      }
    });

    return alerts;
  }

  /**
   * Get upcoming triggers (next 7 days)
   */
  getUpcomingTriggers(days: number = 7): Array<{timer: RebalanceTimer, triggerTime: Date}> {
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    return this.getActiveTimers()
      .filter(timer => timer.nextTrigger && timer.nextTrigger <= cutoff)
      .map(timer => ({ timer, triggerTime: timer.nextTrigger! }))
      .sort((a, b) => a.triggerTime.getTime() - b.triggerTime.getTime());
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hours: number = 24): RebalanceAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return Array.from(this.alerts.values())
      .filter(alert => alert.createdAt >= cutoff)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): RebalanceAlert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Mark alert as acknowledged
   */
  acknowledgeAlert(alertId: string, userId?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    return true;
  }

  /**
   * Get timing statistics
   */
  getTimingStats(): TimingStats {
    const timers = this.getAllTimers();
    const alerts = Array.from(this.alerts.values());
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      totalTimers: timers.length,
      activeTimers: timers.filter(t => t.isActive).length,
      totalTriggers: timers.reduce((sum, t) => sum + t.triggerCount, 0),
      recentAlerts: alerts.filter(a => a.createdAt >= oneDayAgo).length,
      upcomingTriggers: this.getUpcomingTriggers(7).length,
      averageInterval: this.calculateAverageInterval(timers),
      mostActiveStrategy: this.getMostActiveStrategy(timers),
      triggerAccuracy: this.calculateTriggerAccuracy(alerts)
    };
  }

  /**
   * Create timing rule
   */
  createRule(rule: Omit<TimingRule, 'id' | 'createdAt'>): TimingRule {
    const fullRule: TimingRule = {
      ...rule,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    this.rules.set(fullRule.id, fullRule);
    return fullRule;
  }

  /**
   * Get all rules
   */
  getAllRules(): TimingRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Handle timer trigger
   */
  private handleTimerTrigger(timer: RebalanceTimer): RebalanceAlert | null {
    try {
      // Update timer
      timer.lastTriggered = new Date();
      timer.triggerCount++;
      timer.nextTrigger = this.calculateNextTrigger(timer.strategy, timer.lastTriggered);
      timer.updatedAt = new Date();

      // Create alert
      const alert = this.createAlert(timer, 'scheduled', 'Scheduled rebalance trigger');

      // Schedule next trigger
      this.scheduleNextTrigger(timer);

      return alert;
    } catch (error) {
      console.error(`Failed to handle timer trigger for ${timer.id}:`, error);
      return null;
    }
  }

  /**
   * Create rebalance alert
   */
  private createAlert(timer: RebalanceTimer, type: TimingTrigger, reason: string): RebalanceAlert {
    const alert: RebalanceAlert = {
      id: this.generateId(),
      timerId: timer.id,
      strategyId: timer.strategyId,
      type,
      reason,
      createdAt: new Date(),
      acknowledged: false,
      data: {
        timerName: timer.name,
        triggerCount: timer.triggerCount,
        nextTrigger: timer.nextTrigger
      }
    };

    this.alerts.set(alert.id, alert);
    
    // Trigger notification if enabled
    this.triggerNotification(alert, timer);
    
    return alert;
  }

  /**
   * Calculate next trigger time
   */
     private calculateNextTrigger(strategy: TimingStrategy, fromDate?: Date): Date {
     const baseDate = fromDate || new Date();
     
     switch (strategy.type) {
       case 'fixed_interval':
         return new Date(baseDate.getTime() + (strategy.intervalMs || 24 * 60 * 60 * 1000));
         
       case 'daily':
        const daily = new Date(baseDate);
        daily.setDate(daily.getDate() + 1);
        daily.setHours(strategy.hour || 9, strategy.minute || 0, 0, 0);
        return daily;
        
      case 'weekly':
        const weekly = new Date(baseDate);
        const currentDay = weekly.getDay();
        const targetDay = strategy.dayOfWeek || 1; // Monday
        const daysToAdd = targetDay >= currentDay ? targetDay - currentDay : 7 - currentDay + targetDay;
        weekly.setDate(weekly.getDate() + daysToAdd);
        weekly.setHours(strategy.hour || 9, strategy.minute || 0, 0, 0);
        return weekly;
        
      case 'monthly':
        const monthly = new Date(baseDate);
        monthly.setMonth(monthly.getMonth() + 1);
        monthly.setDate(strategy.dayOfMonth || 1);
        monthly.setHours(strategy.hour || 9, strategy.minute || 0, 0, 0);
        return monthly;
        
      case 'market_close':
        const marketClose = new Date(baseDate);
        marketClose.setDate(marketClose.getDate() + 1);
        marketClose.setHours(16, 0, 0, 0); // 4 PM market close
        return marketClose;
        
      default:
        return new Date(baseDate.getTime() + 24 * 60 * 60 * 1000); // Default: 24 hours
    }
  }

  /**
   * Schedule next trigger
   */
  private scheduleNextTrigger(timer: RebalanceTimer): void {
    if (!timer.nextTrigger || !timer.isActive) return;

    const delay = timer.nextTrigger.getTime() - Date.now();
    
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        this.handleTimerTrigger(timer);
      }, delay);
      
      this.activeIntervals.set(timer.id, timeoutId);
    }
  }

  /**
   * Trigger notification for alert
   */
  private triggerNotification(alert: RebalanceAlert, timer: RebalanceTimer): void {
    // This would integrate with the notification system
    console.log(`[RebalanceTiming] Alert created: ${alert.reason} for strategy ${timer.strategyId}`);
  }

  /**
   * Calculate average interval between triggers
   */
     private calculateAverageInterval(timers: RebalanceTimer[]): number {
     const intervals: number[] = [];
     
     timers.forEach(timer => {
       if (timer.strategy.type === 'fixed_interval' && timer.strategy.intervalMs) {
         intervals.push(timer.strategy.intervalMs);
       }
     });

     return intervals.length > 0 
       ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length 
       : 0;
   }

  /**
   * Get most active strategy
   */
     private getMostActiveStrategy(timers: RebalanceTimer[]): string | null {
     const strategyCounts = timers.reduce((counts, timer) => {
       counts[timer.strategyId] = (counts[timer.strategyId] || 0) + timer.triggerCount;
       return counts;
     }, {} as Record<string, number>);

     const entries = Object.entries(strategyCounts);
     if (entries.length === 0) return null;

     return entries.reduce((max, [strategy, count]) => 
       (count as number) > (max.count as number) ? { strategy, count } : max,
       { strategy: entries[0][0], count: entries[0][1] }
     ).strategy;
   }

  /**
   * Calculate trigger accuracy
   */
  private calculateTriggerAccuracy(alerts: RebalanceAlert[]): number {
    const scheduledAlerts = alerts.filter(a => a.type === 'scheduled');
    if (scheduledAlerts.length === 0) return 1;

    // Mock accuracy calculation - in production, this would compare
    // scheduled vs actual trigger times
    return 0.95; // 95% accuracy
  }

  /**
   * Initialize default timing rules
   */
  private initializeDefaultRules(): void {
    const rules: Omit<TimingRule, 'id' | 'createdAt'>[] = [
      {
        name: 'Conservative Rebalancing',
        description: 'Monthly rebalancing for conservative portfolios',
        strategy: {
          type: 'monthly',
          dayOfMonth: 1,
          hour: 9,
          minute: 0
        },
        enabled: true,
        conditions: {
          minPortfolioValue: 1000,
          maxRiskLevel: 'medium'
        }
      },
      {
        name: 'Active Trading',
        description: 'Daily rebalancing for active strategies',
        strategy: {
          type: 'daily',
          hour: 16,
          minute: 30
        },
        enabled: true,
        conditions: {
          minPortfolioValue: 10000,
          maxRiskLevel: 'high'
        }
      }
    ];

    rules.forEach(rule => this.createRule(rule));
  }

  private generateId(): string {
    return `timing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const rebalanceTimingEngine = new RebalanceTimingEngine(); 