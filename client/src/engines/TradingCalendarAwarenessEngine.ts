// Block 87: Trading Calendar Awareness - Engine
// Core engine for trading calendar awareness and market closure conflict detection

import {
  TradingCalendarAwareness,
  TradingCalendar,
  CalendarAlert,
  MarketConflict,
  PendingRebalance,
  ScheduledTrade,
  AllocationIntent,
  MarketHoliday,
  AlertType,
  AlertSeverity,
  ConflictType,
  ConflictSeverity,
  CalendarSettings,
  TradingCalendarError,
  CalendarDataError,
  ConflictDetectionError
} from '../types/tradingCalendarAwareness';

export class TradingCalendarAwarenessEngine {
  private static instance: TradingCalendarAwarenessEngine;
  private calendars: Map<string, TradingCalendar> = new Map();
  private awarenessInstances: Map<string, TradingCalendarAwareness> = new Map();
  private marketHolidays: Map<string, MarketHoliday[]> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();
  private alertQueue: CalendarAlert[] = [];
  private conflictCache: Map<string, MarketConflict[]> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): TradingCalendarAwarenessEngine {
    if (!TradingCalendarAwarenessEngine.instance) {
      TradingCalendarAwarenessEngine.instance = new TradingCalendarAwarenessEngine();
    }
    return TradingCalendarAwarenessEngine.instance;
  }

  private initializeEngine(): void {
    this.loadDefaultCalendars();
    this.startMonitoring();
    console.log('Trading Calendar Awareness Engine initialized');
  }

  // Calendar Management
  public loadCalendar(calendar: TradingCalendar): TradingCalendar {
    this.calendars.set(calendar.market.code, calendar);
    this.emit('calendarLoaded', calendar);
    return calendar;
  }

  public getCalendar(marketCode: string): TradingCalendar | undefined {
    return this.calendars.get(marketCode);
  }

  public getAllCalendars(): TradingCalendar[] {
    return Array.from(this.calendars.values());
  }

  // Awareness Instance Management
  public createAwareness(
    portfolioId: string,
    userId: string,
    allocations: AllocationIntent[],
    settings?: Partial<CalendarSettings>
  ): TradingCalendarAwareness {
    const defaultSettings: CalendarSettings = {
      enableMonitoring: true,
      monitoringFrequency: 'hourly',
      lookAheadDays: 14,
      monitoredMarkets: ['NZX', 'ASX', 'NYSE', 'NASDAQ'],
      primaryMarkets: ['NZX', 'ASX'],
      secondaryMarkets: ['NYSE', 'NASDAQ'],
      alertPreferences: {
        minSeverity: 'medium',
        advanceNoticeHours: [24, 48, 168], // 1 day, 2 days, 1 week
        businessHoursOnly: false,
        weekendsEnabled: true,
        emailAlerts: true,
        pushNotifications: true,
        smsAlerts: false,
        dashboardAlerts: true,
        includeImpactAnalysis: true,
        includeSuggestedActions: true,
        includeAlternatives: true,
        maxAlertsPerDay: 10,
        consolidateAlerts: true,
        quietHours: { start: '22:00', end: '06:00', timezone: 'Pacific/Auckland' }
      },
      notificationChannels: [
        { type: 'email', enabled: true, config: {}, filters: [] },
        { type: 'dashboard', enabled: true, config: {}, filters: [] }
      ],
      enableAutomation: false,
      automationRules: [],
      businessRules: [],
      thresholds: [
        { metric: 'conflict_severity', warningLevel: 3, criticalLevel: 4, unit: 'level' },
        { metric: 'lead_time', warningLevel: 24, criticalLevel: 12, unit: 'hours' }
      ],
      notificationCenterIntegration: true,
      externalIntegrations: []
    };

    const awareness: TradingCalendarAwareness = {
      id: this.generateId(),
      portfolioId,
      userId,
      calendars: this.getRelevantCalendars(allocations),
      currentAllocations: allocations,
      pendingRebalances: [],
      scheduledTrades: [],
      alerts: [],
      conflicts: [],
      settings: { ...defaultSettings, ...settings },
      status: 'active',
      lastUpdated: new Date(),
      nextUpdate: this.calculateNextUpdate('hourly'),
      metadata: {
        dataSources: [
          { name: 'NZX_Calendar', type: 'official', lastUpdate: new Date(), reliability: 0.99 },
          { name: 'ASX_Calendar', type: 'official', lastUpdate: new Date(), reliability: 0.99 },
          { name: 'US_Markets', type: 'third_party', lastUpdate: new Date(), reliability: 0.95 }
        ],
        lastRefresh: new Date(),
        nextRefresh: new Date(Date.now() + 3600000), // 1 hour
        dataQuality: { overall: 0.95, completeness: 0.98, accuracy: 0.97, timeliness: 0.93 },
        coverage: { markets: 0.95, timeRange: 0.90, holidays: 0.98 },
        accuracy: { historical: 0.99, forecasted: 0.85, realtime: 0.97 },
        performance: {
          responseTime: 150,
          throughput: 1000,
          errorRate: 0.01,
          availability: 0.999
        },
        auditTrail: [{
          timestamp: new Date(),
          user: userId,
          action: 'awareness_created',
          details: { portfolioId, allocationsCount: allocations.length },
          impact: 'medium'
        }],
        version: '1.0.0',
        schemaVersion: '1.0.0'
      }
    };

    this.awarenessInstances.set(awareness.id, awareness);
    
    // Start monitoring
    this.analyzeAndAlert(awareness.id);
    
    this.emit('awarenessCreated', awareness);
    return awareness;
  }

  public updateAwareness(id: string, updates: Partial<TradingCalendarAwareness>): TradingCalendarAwareness {
    const awareness = this.awarenessInstances.get(id);
    if (!awareness) {
      throw new TradingCalendarError('Awareness instance not found', 'AWARENESS_NOT_FOUND', { id });
    }

    const updatedAwareness = { ...awareness, ...updates, lastUpdated: new Date() };
    this.awarenessInstances.set(id, updatedAwareness);
    
    this.emit('awarenessUpdated', updatedAwareness);
    return updatedAwareness;
  }

  // Conflict Detection
  public detectConflicts(awarenessId: string): MarketConflict[] {
    const awareness = this.awarenessInstances.get(awarenessId);
    if (!awareness) {
      throw new TradingCalendarError('Awareness instance not found', 'AWARENESS_NOT_FOUND', { id: awarenessId });
    }

    const conflicts: MarketConflict[] = [];
    const lookAheadDate = new Date(Date.now() + awareness.settings.lookAheadDays * 24 * 60 * 60 * 1000);

    // Check pending rebalances
    for (const rebalance of awareness.pendingRebalances) {
      const rebalanceConflicts = this.checkRebalanceConflicts(rebalance, awareness.calendars, lookAheadDate);
      conflicts.push(...rebalanceConflicts);
    }

    // Check scheduled trades
    for (const trade of awareness.scheduledTrades) {
      const tradeConflicts = this.checkTradeConflicts(trade, awareness.calendars, lookAheadDate);
      conflicts.push(...tradeConflicts);
    }

    // Cache conflicts
    this.conflictCache.set(awarenessId, conflicts);
    
    return conflicts;
  }

  private checkRebalanceConflicts(
    rebalance: PendingRebalance,
    calendars: TradingCalendar[],
    lookAheadDate: Date
  ): MarketConflict[] {
    const conflicts: MarketConflict[] = [];

    for (const marketDep of rebalance.marketDependencies) {
      const calendar = calendars.find(cal => cal.market.code === marketDep.market);
      if (!calendar) continue;

      // Check if rebalance date conflicts with market closure
      const rebalanceDate = rebalance.scheduledDate;
      const isMarketOpen = this.isMarketOpen(calendar, rebalanceDate);

      if (!isMarketOpen) {
        const conflict: MarketConflict = {
          id: this.generateId(),
          type: 'market_closure',
          severity: this.calculateConflictSeverity(marketDep.criticality, rebalance.canDefer),
          description: `Rebalance scheduled during ${calendar.market.name} closure`,
          affectedOperations: [{
            type: 'rebalance',
            id: rebalance.id,
            description: `Portfolio rebalance worth $${rebalance.totalValue.toLocaleString()}`,
            impact: 'blocked'
          }],
          conflictStart: rebalanceDate,
          conflictEnd: this.getNextMarketOpen(calendar, rebalanceDate),
          duration: this.getNextMarketOpen(calendar, rebalanceDate).getTime() - rebalanceDate.getTime(),
          affectedMarkets: [calendar.market.code],
          availableAlternatives: this.findAlternativeMarkets(calendar.market.code, calendars),
          resolutionOptions: this.generateResolutionOptions(rebalance, calendar),
          recommendedAction: rebalance.canDefer ? 'defer_to_next_session' : 'use_alternative_market',
          costImpact: {
            directCosts: rebalance.estimatedCost * 0.1, // 10% additional cost
            indirectCosts: rebalance.totalValue * 0.001, // 0.1% opportunity cost
            opportunityCosts: this.calculateOpportunityCost(rebalance),
            savingsLost: 0,
            totalImpact: 0,
            costBreakdown: [],
            costPerHour: rebalance.totalValue * 0.0001,
            costPerDay: rebalance.totalValue * 0.0024
          },
          opportunityCost: this.calculateOpportunityCost(rebalance),
          status: 'detected'
        };

        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  private checkTradeConflicts(
    trade: ScheduledTrade,
    calendars: TradingCalendar[],
    lookAheadDate: Date
  ): MarketConflict[] {
    const conflicts: MarketConflict[] = [];

    const preferredCalendar = calendars.find(cal => cal.market.code === trade.preferredMarket);
    if (!preferredCalendar) return conflicts;

    const isMarketOpen = this.isMarketOpen(preferredCalendar, trade.scheduledTime);

    if (!isMarketOpen) {
      const conflict: MarketConflict = {
        id: this.generateId(),
        type: 'market_closure',
        severity: trade.isFlexible ? 'moderate' : 'major',
        description: `Trade scheduled during ${preferredCalendar.market.name} closure`,
        affectedOperations: [{
          type: 'trade',
          id: trade.id,
          description: `${trade.side} ${trade.quantity} ${trade.symbol}`,
          impact: trade.isFlexible ? 'delayed' : 'blocked'
        }],
        conflictStart: trade.scheduledTime,
        conflictEnd: this.getNextMarketOpen(preferredCalendar, trade.scheduledTime),
        duration: this.getNextMarketOpen(preferredCalendar, trade.scheduledTime).getTime() - trade.scheduledTime.getTime(),
        affectedMarkets: [preferredCalendar.market.code],
        availableAlternatives: trade.acceptableMarkets.filter(market => 
          calendars.some(cal => cal.market.code === market && this.isMarketOpen(cal, trade.scheduledTime))
        ),
        resolutionOptions: this.generateTradeResolutionOptions(trade, preferredCalendar),
        recommendedAction: trade.isFlexible ? 'reschedule_to_next_session' : 'use_alternative_market',
        costImpact: {
          directCosts: trade.quantity * 0.01, // $0.01 per share additional cost
          indirectCosts: 0,
          opportunityCosts: this.calculateTradeOpportunityCost(trade),
          savingsLost: 0,
          totalImpact: 0,
          costBreakdown: [],
          costPerHour: trade.quantity * 0.001,
          costPerDay: trade.quantity * 0.024
        },
        opportunityCost: this.calculateTradeOpportunityCost(trade),
        status: 'detected'
      };

      conflicts.push(conflict);
    }

    return conflicts;
  }

  // Alert Generation
  public generateAlerts(awarenessId: string): CalendarAlert[] {
    const awareness = this.awarenessInstances.get(awarenessId);
    if (!awareness) {
      throw new TradingCalendarError('Awareness instance not found', 'AWARENESS_NOT_FOUND', { id: awarenessId });
    }

    const alerts: CalendarAlert[] = [];
    const conflicts = this.detectConflicts(awarenessId);

    // Generate alerts for conflicts
    for (const conflict of conflicts) {
      if (this.shouldAlert(conflict, awareness.settings)) {
        const alert = this.createAlertFromConflict(conflict, awareness);
        alerts.push(alert);
      }
    }

    // Generate alerts for upcoming holidays
    const upcomingHolidays = this.getUpcomingHolidays(awareness.calendars, awareness.settings.lookAheadDays);
    for (const holiday of upcomingHolidays) {
      if (this.shouldAlertForHoliday(holiday, awareness)) {
        const alert = this.createHolidayAlert(holiday, awareness);
        alerts.push(alert);
      }
    }

    return alerts;
  }

  private createAlertFromConflict(conflict: MarketConflict, awareness: TradingCalendarAwareness): CalendarAlert {
    const leadTime = conflict.conflictStart.getTime() - Date.now();
    const leadTimeHours = Math.max(0, leadTime / (1000 * 60 * 60));

    return {
      id: this.generateId(),
      type: this.mapConflictToAlertType(conflict.type),
      severity: this.mapConflictToAlertSeverity(conflict.severity),
      title: `Market Conflict Detected`,
      message: conflict.description,
      description: this.generateAlertDescription(conflict),
      alertTime: new Date(),
      eventTime: conflict.conflictStart,
      leadTime: leadTimeHours,
      affectedRebalances: conflict.affectedOperations
        .filter(op => op.type === 'rebalance')
        .map(op => op.id),
      affectedTrades: conflict.affectedOperations
        .filter(op => op.type === 'trade')
        .map(op => op.id),
      affectedMarkets: conflict.affectedMarkets,
      affectedAssets: this.extractAffectedAssets(conflict),
      impact: {
        financialImpact: {
          estimatedCost: conflict.costImpact.totalImpact,
          opportunityCost: conflict.opportunityCost,
          potentialSavings: 0,
          netImpact: conflict.costImpact.totalImpact + conflict.opportunityCost,
          tradingCosts: conflict.costImpact.directCosts,
          delayCosts: conflict.costImpact.indirectCosts,
          alternativeCosts: 0,
          costPerDay: conflict.costImpact.costPerDay,
          totalDays: conflict.duration / (1000 * 60 * 60 * 24)
        },
        operationalImpact: {
          complexity: 'moderate',
          additionalWork: 2,
          resourceRequirements: ['portfolio_manager', 'trader'],
          dependentOperations: [],
          cascadeEffects: [],
          timelineImpact: {
            delay: conflict.duration,
            criticalPath: false,
            milestoneImpact: []
          }
        },
        strategicImpact: {
          strategyAlignment: 'good',
          objectiveImpact: [],
          longTermEffects: [],
          precedentSetting: false,
          stakeholderImpact: []
        },
        riskImpact: {
          marketRisk: 'medium',
          liquidityRisk: 'low',
          operationalRisk: 'low',
          reputationalRisk: 'very_low',
          riskIncrease: 0.1,
          newRisks: ['execution_delay'],
          mitigatedRisks: [],
          overallRiskChange: 'slight_increase',
          riskMitigation: []
        },
        overallRating: 'moderate',
        confidence: 0.85
      },
      suggestedActions: conflict.resolutionOptions.map(option => ({
        id: this.generateId(),
        action: option.option,
        description: option.description,
        feasibility: option.feasibility > 0.7 ? 'easy' : 'moderate',
        effort: option.cost > 1000 ? 'high' : 'low',
        timeRequired: option.timeRequired,
        expectedBenefit: option.effectiveness,
        riskReduction: 1 - option.riskLevel,
        costImplication: option.cost,
        steps: [],
        prerequisites: [],
        dependencies: [],
        alternatives: []
      })),
      automaticActions: [],
      status: 'active',
      acknowledged: false,
      requiresResponse: conflict.severity === 'critical' || conflict.severity === 'blocking',
      responseDeadline: conflict.severity === 'critical' ? 
        new Date(Date.now() + 4 * 60 * 60 * 1000) : // 4 hours for critical
        new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for others
      escalationRules: [
        {
          condition: 'no_response_4h',
          action: 'escalate_to_manager',
          to: 'portfolio_manager',
          timeout: 4 * 60 * 60 * 1000
        }
      ]
    };
  }

  // Integration with Notification Center
  public async sendToNotificationCenter(alert: CalendarAlert, awarenessId: string): Promise<boolean> {
    try {
      const awareness = this.awarenessInstances.get(awarenessId);
      if (!awareness?.settings.notificationCenterIntegration) {
        return false;
      }

      // Create notification for Notification Center (Block 33)
      const notification = {
        id: this.generateId(),
        type: 'calendar_alert',
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        data: {
          alertId: alert.id,
          awarenessId,
          portfolioId: awareness.portfolioId,
          userId: awareness.userId,
          conflictDetails: alert.impact,
          suggestedActions: alert.suggestedActions
        },
        channels: awareness.settings.notificationChannels
          .filter(channel => channel.enabled)
          .map(channel => channel.type),
        priority: this.mapSeverityToPriority(alert.severity),
        expiresAt: alert.responseDeadline,
        metadata: {
          source: 'trading_calendar_awareness',
          correlationId: alert.id,
          tags: ['calendar', 'conflict', alert.type]
        }
      };

      // Here we would integrate with the actual Notification Center
      // For now, we'll emit an event that the notification system can listen to
      this.emit('notificationRequired', notification);

      return true;
    } catch (error) {
      console.error('Failed to send to notification center:', error);
      return false;
    }
  }

  // Analysis and Monitoring
  public analyzeAndAlert(awarenessId: string): void {
    try {
      const conflicts = this.detectConflicts(awarenessId);
      const alerts = this.generateAlerts(awarenessId);

      // Update awareness with new conflicts and alerts
      this.updateAwareness(awarenessId, { conflicts, alerts });

      // Send critical alerts to notification center
      for (const alert of alerts) {
        if (alert.severity === 'critical' || alert.severity === 'high') {
          this.sendToNotificationCenter(alert, awarenessId);
        }
      }

      this.emit('analysisCompleted', { awarenessId, conflicts, alerts });
    } catch (error) {
      console.error('Analysis failed:', error);
      this.emit('analysisError', { awarenessId, error });
    }
  }

  // Utility Methods
  private loadDefaultCalendars(): void {
    // Load NZX Calendar
    const nzxCalendar: TradingCalendar = {
      id: 'nzx_main',
      market: { code: 'NZX', name: 'New Zealand Exchange', country: 'NZ', region: 'Oceania' },
      timezone: 'Pacific/Auckland',
      currency: 'NZD',
      tradingDays: [],
      holidays: [],
      specialSessions: [],
      regularHours: {
        timezone: 'Pacific/Auckland',
        marketOpen: '10:00',
        marketClose: '16:45'
      },
      tradingRules: [],
      settlementRules: [],
      isActive: true,
      lastUpdated: new Date(),
      dataSource: 'NZX_Official',
      reliability: 0.99
    };

    // Load ASX Calendar
    const asxCalendar: TradingCalendar = {
      id: 'asx_main',
      market: { code: 'ASX', name: 'Australian Securities Exchange', country: 'AU', region: 'Oceania' },
      timezone: 'Australia/Sydney',
      currency: 'AUD',
      tradingDays: [],
      holidays: [],
      specialSessions: [],
      regularHours: {
        timezone: 'Australia/Sydney',
        marketOpen: '10:00',
        marketClose: '16:00'
      },
      tradingRules: [],
      settlementRules: [],
      isActive: true,
      lastUpdated: new Date(),
      dataSource: 'ASX_Official',
      reliability: 0.99
    };

    this.calendars.set('NZX', nzxCalendar);
    this.calendars.set('ASX', asxCalendar);
  }

  private startMonitoring(): void {
    // Monitor every hour
    setInterval(() => {
      this.performScheduledAnalysis();
    }, 60 * 60 * 1000);
  }

  private performScheduledAnalysis(): void {
    for (const [id, awareness] of this.awarenessInstances.entries()) {
      if (awareness.status === 'active') {
        this.analyzeAndAlert(id);
      }
    }
  }

  private isMarketOpen(calendar: TradingCalendar, date: Date): boolean {
    // Simplified market open check
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Weekend

    // Check holidays
    const isHoliday = calendar.holidays.some(holiday => 
      holiday.date.toDateString() === date.toDateString()
    );

    return !isHoliday;
  }

  private getNextMarketOpen(calendar: TradingCalendar, fromDate: Date): Date {
    let checkDate = new Date(fromDate);
    checkDate.setDate(checkDate.getDate() + 1);

    while (!this.isMarketOpen(calendar, checkDate)) {
      checkDate.setDate(checkDate.getDate() + 1);
    }

    return checkDate;
  }

  private getRelevantCalendars(allocations: AllocationIntent[]): TradingCalendar[] {
    const marketCodes = new Set<string>();
    
    for (const allocation of allocations) {
      for (const asset of allocation.targets) {
        marketCodes.add(asset.primaryMarket);
        asset.tradingMarkets.forEach(market => marketCodes.add(market));
      }
    }

    return Array.from(marketCodes)
      .map(code => this.calendars.get(code))
      .filter(Boolean) as TradingCalendar[];
  }

  private calculateNextUpdate(frequency: string): Date {
    const intervals = {
      'realtime': 5 * 60 * 1000, // 5 minutes
      'hourly': 60 * 60 * 1000, // 1 hour
      'daily': 24 * 60 * 60 * 1000, // 1 day
      'weekly': 7 * 24 * 60 * 60 * 1000 // 1 week
    };

    return new Date(Date.now() + (intervals[frequency] || intervals.hourly));
  }

  private shouldAlert(conflict: MarketConflict, settings: CalendarSettings): boolean {
    const severityLevels = ['minor', 'moderate', 'major', 'critical', 'blocking'];
    const minSeverityIndex = severityLevels.indexOf(settings.alertPreferences.minSeverity);
    const conflictSeverityIndex = severityLevels.indexOf(conflict.severity);
    
    return conflictSeverityIndex >= minSeverityIndex;
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  public on(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(event, handlers);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper methods (simplified implementations)
  private calculateConflictSeverity(criticality: any, canDefer: boolean): ConflictSeverity {
    if (criticality === 'critical' && !canDefer) return 'blocking';
    if (criticality === 'critical') return 'critical';
    if (criticality === 'important') return 'major';
    return 'moderate';
  }

  private findAlternativeMarkets(marketCode: string, calendars: TradingCalendar[]): string[] {
    return calendars
      .filter(cal => cal.market.code !== marketCode && cal.isActive)
      .map(cal => cal.market.code);
  }

  private generateResolutionOptions(rebalance: any, calendar: TradingCalendar): any[] {
    return [
      {
        id: this.generateId(),
        option: 'defer_to_next_session',
        description: 'Wait for next market session',
        feasibility: 0.9,
        cost: 100,
        timeRequired: 24,
        riskLevel: 0.2,
        effectiveness: 0.8
      }
    ];
  }

  private generateTradeResolutionOptions(trade: any, calendar: TradingCalendar): any[] {
    return [
      {
        id: this.generateId(),
        option: 'reschedule_to_next_session',
        description: 'Reschedule to next market session',
        feasibility: 0.9,
        cost: 50,
        timeRequired: 24,
        riskLevel: 0.1,
        effectiveness: 0.9
      }
    ];
  }

  private calculateOpportunityCost(rebalance: any): number {
    return rebalance.totalValue * 0.001; // 0.1% of total value
  }

  private calculateTradeOpportunityCost(trade: any): number {
    return trade.quantity * 0.01; // $0.01 per share
  }

  private mapConflictToAlertType(conflictType: ConflictType): AlertType {
    const mapping = {
      'market_closure': 'market_closure',
      'liquidity_shortage': 'liquidity_alert',
      'timing_conflict': 'conflict_detected',
      'settlement_delay': 'deadline_approaching',
      'system_maintenance': 'market_closure'
    };
    return mapping[conflictType] || 'conflict_detected';
  }

  private mapConflictToAlertSeverity(conflictSeverity: ConflictSeverity): AlertSeverity {
    const mapping = {
      'minor': 'low',
      'moderate': 'medium',
      'major': 'high',
      'critical': 'critical',
      'blocking': 'critical'
    };
    return mapping[conflictSeverity] || 'medium';
  }

  private generateAlertDescription(conflict: MarketConflict): string {
    return `A ${conflict.severity} conflict has been detected affecting ${conflict.affectedOperations.length} operations. ` +
           `The conflict will last approximately ${Math.round(conflict.duration / (1000 * 60 * 60))} hours. ` +
           `Recommended action: ${conflict.recommendedAction}`;
  }

  private extractAffectedAssets(conflict: MarketConflict): string[] {
    // Extract asset IDs from affected operations
    return conflict.affectedOperations
      .map(op => op.id)
      .filter(Boolean);
  }

  private getUpcomingHolidays(calendars: TradingCalendar[], lookAheadDays: number): MarketHoliday[] {
    const cutoffDate = new Date(Date.now() + lookAheadDays * 24 * 60 * 60 * 1000);
    const holidays: MarketHoliday[] = [];

    for (const calendar of calendars) {
      const upcomingHolidays = calendar.holidays.filter(holiday => 
        holiday.date > new Date() && holiday.date <= cutoffDate
      );
      holidays.push(...upcomingHolidays);
    }

    return holidays;
  }

  private shouldAlertForHoliday(holiday: MarketHoliday, awareness: TradingCalendarAwareness): boolean {
    // Check if holiday affects any planned operations
    const leadTime = holiday.date.getTime() - Date.now();
    const leadTimeHours = leadTime / (1000 * 60 * 60);
    
    return awareness.settings.alertPreferences.advanceNoticeHours.some(hours => 
      Math.abs(leadTimeHours - hours) < 1
    );
  }

  private createHolidayAlert(holiday: MarketHoliday, awareness: TradingCalendarAwareness): CalendarAlert {
    const leadTime = holiday.date.getTime() - Date.now();
    const leadTimeHours = Math.max(0, leadTime / (1000 * 60 * 60));

    return {
      id: this.generateId(),
      type: 'holiday_warning',
      severity: 'medium',
      title: `Upcoming Market Holiday`,
      message: `${holiday.name} on ${holiday.date.toDateString()}`,
      description: `${holiday.name} will affect trading on ${holiday.affectedMarkets.join(', ')}`,
      alertTime: new Date(),
      eventTime: holiday.date,
      leadTime: leadTimeHours,
      affectedRebalances: [],
      affectedTrades: [],
      affectedMarkets: holiday.affectedMarkets,
      affectedAssets: [],
      impact: {
        financialImpact: {
          estimatedCost: 0,
          opportunityCost: 0,
          potentialSavings: 0,
          netImpact: 0,
          tradingCosts: 0,
          delayCosts: 0,
          alternativeCosts: 0,
          costPerDay: 0,
          totalDays: 1
        },
        operationalImpact: {
          complexity: 'simple',
          additionalWork: 0.5,
          resourceRequirements: [],
          dependentOperations: [],
          cascadeEffects: [],
          timelineImpact: {
            delay: 24 * 60 * 60 * 1000, // 1 day
            criticalPath: false,
            milestoneImpact: []
          }
        },
        strategicImpact: {
          strategyAlignment: 'good',
          objectiveImpact: [],
          longTermEffects: [],
          precedentSetting: false,
          stakeholderImpact: []
        },
        riskImpact: {
          marketRisk: 'low',
          liquidityRisk: 'low',
          operationalRisk: 'very_low',
          reputationalRisk: 'very_low',
          riskIncrease: 0,
          newRisks: [],
          mitigatedRisks: [],
          overallRiskChange: 'no_change',
          riskMitigation: []
        },
        overallRating: 'low',
        confidence: 0.95
      },
      suggestedActions: [
        {
          id: this.generateId(),
          action: 'plan_around_holiday',
          description: 'Adjust trading schedules to account for market closure',
          feasibility: 'easy',
          effort: 'minimal',
          timeRequired: 1,
          expectedBenefit: 0.8,
          riskReduction: 0.9,
          costImplication: 0,
          steps: [],
          prerequisites: [],
          dependencies: [],
          alternatives: []
        }
      ],
      automaticActions: [],
      status: 'active',
      acknowledged: false,
      requiresResponse: false,
      escalationRules: []
    };
  }

  private mapSeverityToPriority(severity: AlertSeverity): string {
    const mapping = {
      'info': 'low',
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'urgent'
    };
    return mapping[severity] || 'medium';
  }
} 