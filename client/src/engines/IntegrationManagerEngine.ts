// Block 81: Integration Manager - Engine
// External API Integrations and Data Feed Management

import {
  IntegrationManager,
  Integration,
  IntegrationManagerFilter,
  TestConnectionRequest,
  TestConnectionResponse,
  ManagerStatus,
  IntegrationAlert,
  IntegrationMetrics,
  HealthSummary,
  IntegrationType,
  IntegrationStatus,
  HealthStatus,
  ActivityType
} from '../types/integrationManager';

export class IntegrationManagerEngine {
  private static instance: IntegrationManagerEngine;
  private managers: Map<string, IntegrationManager> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private connectionPools: Map<string, ConnectionPool> = new Map();
  private lastUpdate = new Date();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): IntegrationManagerEngine {
    if (!IntegrationManagerEngine.instance) {
      IntegrationManagerEngine.instance = new IntegrationManagerEngine();
    }
    return IntegrationManagerEngine.instance;
  }

  private initializeEngine(): void {
    // Initialize with mock data
    this.createMockManagers();
    
    // Setup global health monitoring
    this.setupGlobalHealthChecks();
  }

  // Core Manager Operations
  public createManager(config: Omit<IntegrationManager, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): IntegrationManager {
    const newManager: IntegrationManager = {
      ...config,
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Initialize manager state
    this.initializeManagerState(newManager);
    
    this.managers.set(newManager.id, newManager);
    
    // Start health checks if enabled
    if (newManager.integrationConfig.enableHealthChecks) {
      this.startHealthChecks(newManager.id);
    }
    
    return newManager;
  }

  public updateManager(id: string, updates: Partial<IntegrationManager>): IntegrationManager {
    const existingManager = this.managers.get(id);
    if (!existingManager) {
      throw new Error(`Integration manager with id ${id} not found`);
    }

    const updatedManager = {
      ...existingManager,
      ...updates,
      updatedAt: new Date()
    };

    this.managers.set(id, updatedManager);
    return updatedManager;
  }

  public deleteManager(id: string): void {
    if (!this.managers.has(id)) {
      throw new Error(`Integration manager with id ${id} not found`);
    }
    
    // Stop health checks
    this.stopHealthChecks(id);
    
    // Cleanup connection pools
    this.cleanupConnectionPool(id);
    
    this.managers.delete(id);
  }

  public getManager(id: string): IntegrationManager | undefined {
    return this.managers.get(id);
  }

  public getManagers(): IntegrationManager[] {
    return Array.from(this.managers.values());
  }

  // Integration Operations
  public async addIntegration(managerId: string, integrationConfig: Omit<Integration, 'id' | 'managerId' | 'createdAt' | 'updatedAt'>): Promise<Integration> {
    const manager = this.managers.get(managerId);
    if (!manager) {
      throw new Error('Manager not found');
    }

    const newIntegration: Integration = {
      ...integrationConfig,
      id: this.generateId(),
      managerId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Initialize integration
    this.initializeIntegration(newIntegration);

    // Add to manager
    manager.integrations.push(newIntegration);
    manager.updatedAt = new Date();

    // Test connection if enabled
    if (newIntegration.isEnabled) {
      await this.establishConnection(newIntegration);
    }

    return newIntegration;
  }

  public async updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<Integration> {
    const manager = this.findManagerByIntegrationId(integrationId);
    if (!manager) {
      throw new Error('Integration not found');
    }

    const integrationIndex = manager.integrations.findIndex(i => i.id === integrationId);
    if (integrationIndex === -1) {
      throw new Error('Integration not found in manager');
    }

    const updatedIntegration = {
      ...manager.integrations[integrationIndex],
      ...updates,
      updatedAt: new Date()
    };

    manager.integrations[integrationIndex] = updatedIntegration;
    manager.updatedAt = new Date();

    return updatedIntegration;
  }

  public async removeIntegration(integrationId: string): Promise<void> {
    const manager = this.findManagerByIntegrationId(integrationId);
    if (!manager) {
      throw new Error('Integration not found');
    }

    // Disconnect integration
    await this.disconnectIntegration(integrationId);

    // Remove from manager
    manager.integrations = manager.integrations.filter(i => i.id !== integrationId);
    manager.updatedAt = new Date();
  }

  // Connection Management
  public async testConnection(request: TestConnectionRequest): Promise<TestConnectionResponse> {
    try {
      const integration = this.findIntegrationById(request.integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const testResults = await this.runConnectionTests(integration, request.testType);
      const overallScore = this.calculateTestScore(testResults);
      const recommendations = this.generateRecommendations(testResults);

      return {
        success: overallScore > 70,
        testResults,
        overallScore,
        recommendations
      };
    } catch (error) {
      return {
        success: false,
        testResults: [],
        overallScore: 0,
        recommendations: [error instanceof Error ? error.message : 'Connection test failed']
      };
    }
  }

  public async enableIntegration(integrationId: string): Promise<void> {
    const integration = this.findIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    integration.isEnabled = true;
    integration.updatedAt = new Date();

    await this.establishConnection(integration);
  }

  public async disableIntegration(integrationId: string): Promise<void> {
    const integration = this.findIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    integration.isEnabled = false;
    integration.status = 'inactive';
    integration.updatedAt = new Date();

    await this.disconnectIntegration(integrationId);
  }

  // Health Monitoring
  public async runHealthCheck(managerId: string): Promise<HealthSummary> {
    const manager = this.managers.get(managerId);
    if (!manager) {
      throw new Error('Manager not found');
    }

    const healthChecks = await Promise.all(
      manager.integrations.map(integration => this.checkIntegrationHealth(integration))
    );

    const healthSummary = this.aggregateHealthResults(healthChecks);
    
    // Update manager status
    manager.managerStatus.healthSummary = healthSummary;
    manager.lastHealthCheck = new Date();

    return healthSummary;
  }

  public getIntegrationMetrics(integrationId: string): IntegrationMetrics {
    const integration = this.findIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    return integration.performanceMetrics;
  }

  public getManagerStatus(managerId: string): ManagerStatus {
    const manager = this.managers.get(managerId);
    if (!manager) {
      throw new Error('Manager not found');
    }

    return manager.managerStatus;
  }

  // Alert Management
  public getActiveAlerts(managerId: string): IntegrationAlert[] {
    const manager = this.managers.get(managerId);
    if (!manager) {
      throw new Error('Manager not found');
    }

    return manager.managerStatus.activeAlerts.filter(alert => alert.status === 'active');
  }

  public async acknowledgeAlert(alertId: string): Promise<void> {
    for (const manager of this.managers.values()) {
      const alert = manager.managerStatus.activeAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.status = 'acknowledged';
        alert.acknowledgedAt = new Date();
        return;
      }
    }
    throw new Error('Alert not found');
  }

  public async resolveAlert(alertId: string): Promise<void> {
    for (const manager of this.managers.values()) {
      const alert = manager.managerStatus.activeAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        return;
      }
    }
    throw new Error('Alert not found');
  }

  // Filtering
  public filterManagers(managers: IntegrationManager[], filter: IntegrationManagerFilter): IntegrationManager[] {
    return managers.filter(manager => {
      // Integration types filter
      if (filter.integrationTypes && filter.integrationTypes.length > 0) {
        const managerTypes = manager.integrations.map(i => i.integrationType);
        if (!filter.integrationTypes.some(type => managerTypes.includes(type))) return false;
      }

      // Providers filter
      if (filter.providers && filter.providers.length > 0) {
        const managerProviders = manager.integrations.map(i => i.provider);
        if (!filter.providers.some(provider => managerProviders.includes(provider))) return false;
      }

      // Status filter
      if (filter.statuses && filter.statuses.length > 0) {
        const managerStatuses = manager.integrations.map(i => i.status);
        if (!filter.statuses.some(status => managerStatuses.includes(status))) return false;
      }

      // Health status filter
      if (filter.healthStatuses && filter.healthStatuses.length > 0) {
        const managerHealth = manager.integrations.map(i => i.connectionInfo.healthStatus);
        if (!filter.healthStatuses.some(health => managerHealth.includes(health))) return false;
      }

      // Active alerts filter
      if (filter.hasActiveAlerts !== undefined) {
        const hasAlerts = manager.managerStatus.activeAlerts.length > 0;
        if (filter.hasActiveAlerts !== hasAlerts) return false;
      }

      // Performance filters
      if (filter.minSuccessRate !== undefined) {
        const avgSuccessRate = this.calculateAverageSuccessRate(manager);
        if (avgSuccessRate < filter.minSuccessRate) return false;
      }

      // Search term
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const matchesName = manager.managerName.toLowerCase().includes(searchLower);
        const matchesDesc = manager.description?.toLowerCase().includes(searchLower);
        const matchesIntegration = manager.integrations.some(i => 
          i.integrationName.toLowerCase().includes(searchLower) ||
          i.provider.toLowerCase().includes(searchLower)
        );
        if (!matchesName && !matchesDesc && !matchesIntegration) return false;
      }

      return true;
    });
  }

  // Private Methods
  private initializeManagerState(manager: IntegrationManager): void {
    // Initialize manager status
    manager.managerStatus = this.createInitialManagerStatus();
    
    // Initialize performance metrics
    manager.performanceMetrics = this.createInitialPerformanceMetrics();
    
    // Set up default error handling
    if (!manager.errorHandling) {
      manager.errorHandling = this.createDefaultErrorHandling();
    }
  }

  private createInitialManagerStatus(): ManagerStatus {
    return {
      overallStatus: 'healthy',
      statusMessage: 'Manager initialized',
      totalIntegrations: 0,
      activeIntegrations: 0,
      errorIntegrations: 0,
      healthSummary: {
        healthyCount: 0,
        degradedCount: 0,
        unhealthyCount: 0,
        unknownCount: 0,
        overallHealthScore: 100,
        lastHealthCheck: new Date()
      },
      recentActivity: [],
      activeAlerts: [],
      performanceSummary: {
        overallPerformance: 100,
        avgResponseTime: 0,
        slowestIntegration: '',
        fastestIntegration: '',
        avgSuccessRate: 100,
        mostReliableIntegration: '',
        leastReliableIntegration: '',
        totalRequestsPerHour: 0,
        totalDataVolumePerHour: 0,
        performanceTrend: 'stable',
        reliabilityTrend: 'stable'
      }
    };
  }

  private createInitialPerformanceMetrics() {
    return {
      totalConnections: 0,
      activeConnections: 0,
      connectionPoolUtilization: 0,
      systemThroughput: 0,
      systemLatency: 0,
      systemErrorRate: 0,
      cpuUtilization: 0,
      memoryUtilization: 0,
      networkUtilization: 0,
      cacheHitRate: 0,
      cacheSize: 0,
      overallDataQuality: 95,
      validationFailureRate: 0
    };
  }

  private createDefaultErrorHandling() {
    return {
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffStrategy: 'exponential' as const,
        retryableErrors: ['timeout', 'rate_limit', 'server_error'],
        jitterEnabled: true
      },
      circuitBreakerConfig: {
        failureThreshold: 5,
        successThreshold: 3,
        timeoutDuration: 60000,
        monitoringPeriod: 30000,
        halfOpenMaxCalls: 3
      },
      errorClassification: [],
      fallbackStrategies: [],
      deadLetterQueueConfig: {
        enabled: true,
        maxRetentionDays: 7,
        maxQueueSize: 1000,
        processingStrategy: 'manual'
      },
      errorReporting: {
        enableReporting: true,
        reportingChannels: ['email'],
        severityThreshold: 'error',
        batchingEnabled: true,
        batchSize: 10,
        batchTimeout: 60
      }
    };
  }

  private initializeIntegration(integration: Integration): void {
    // Initialize connection info
    integration.connectionInfo = {
      connectionId: this.generateId(),
      connectionUrl: integration.config.baseUrl,
      isConnected: false,
      lastConnected: new Date(),
      connectionCount: 0,
      totalUptime: 0,
      healthStatus: 'unknown',
      lastHealthCheck: new Date()
    };

    // Initialize performance metrics
    integration.performanceMetrics = this.createInitialIntegrationMetrics();
  }

  private createInitialIntegrationMetrics(): IntegrationMetrics {
    return {
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      successRate: 100,
      errorRate: 0,
      uptimePercentage: 100,
      requestsPerSecond: 0,
      requestsPerHour: 0,
      dataVolumePerHour: 0,
      dataQualityScore: 95,
      validationPassRate: 100,
      totalRequests: 0,
      totalDataProcessed: 0,
      lastSuccessfulSync: new Date(),
      averageSyncDuration: 0,
      totalErrors: 0,
      errorBreakdown: []
    };
  }

  private async establishConnection(integration: Integration): Promise<void> {
    try {
      // Simulate connection establishment
      await this.delay(1000);
      
      integration.connectionInfo.isConnected = true;
      integration.connectionInfo.lastConnected = new Date();
      integration.connectionInfo.connectionCount++;
      integration.status = 'active';
      integration.connectionInfo.healthStatus = 'healthy';
      
      // Add to connection pool
      this.addToConnectionPool(integration);
      
      this.logActivity(integration.managerId, 'integration_connected', integration.id, 
        `Integration ${integration.integrationName} connected successfully`);
        
    } catch (error) {
      integration.status = 'error';
      integration.connectionInfo.healthStatus = 'unhealthy';
      
      this.logActivity(integration.managerId, 'integration_disconnected', integration.id, 
        `Failed to connect integration ${integration.integrationName}: ${error}`);
      
      throw error;
    }
  }

  private async disconnectIntegration(integrationId: string): Promise<void> {
    const integration = this.findIntegrationById(integrationId);
    if (!integration) return;

    integration.connectionInfo.isConnected = false;
    integration.connectionInfo.lastDisconnected = new Date();
    integration.status = 'disconnected';
    
    // Remove from connection pool
    this.removeFromConnectionPool(integration);
    
    this.logActivity(integration.managerId, 'integration_disconnected', integration.id, 
      `Integration ${integration.integrationName} disconnected`);
  }

  private async runConnectionTests(integration: Integration, testType: string) {
    const testResults = [];

    // Connectivity test
    testResults.push(await this.testConnectivity(integration));

    // Authentication test
    if (testType === 'authentication' || testType === 'full_flow') {
      testResults.push(await this.testAuthentication(integration));
    }

    // Health check test
    if (testType === 'health_check' || testType === 'full_flow') {
      testResults.push(await this.testHealthEndpoint(integration));
    }

    // Full flow test
    if (testType === 'full_flow') {
      testResults.push(await this.testDataFlow(integration));
    }

    return testResults;
  }

  private async testConnectivity(integration: Integration) {
    try {
      // Simulate connectivity test
      await this.delay(500);
      
      return {
        testName: 'Connectivity',
        passed: Math.random() > 0.1, // 90% success rate
        duration: 500,
        details: 'Successfully connected to endpoint'
      };
    } catch (error) {
      return {
        testName: 'Connectivity',
        passed: false,
        duration: 500,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  private async testAuthentication(integration: Integration) {
    try {
      // Simulate authentication test
      await this.delay(300);
      
      return {
        testName: 'Authentication',
        passed: Math.random() > 0.05, // 95% success rate
        duration: 300,
        details: 'Authentication successful'
      };
    } catch (error) {
      return {
        testName: 'Authentication',
        passed: false,
        duration: 300,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  private async testHealthEndpoint(integration: Integration) {
    try {
      // Simulate health check
      await this.delay(200);
      
      return {
        testName: 'Health Check',
        passed: Math.random() > 0.15, // 85% success rate
        duration: 200,
        details: 'Health endpoint responding normally'
      };
    } catch (error) {
      return {
        testName: 'Health Check',
        passed: false,
        duration: 200,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  private async testDataFlow(integration: Integration) {
    try {
      // Simulate data flow test
      await this.delay(1000);
      
      return {
        testName: 'Data Flow',
        passed: Math.random() > 0.2, // 80% success rate
        duration: 1000,
        details: 'Data flow test completed successfully'
      };
    } catch (error) {
      return {
        testName: 'Data Flow',
        passed: false,
        duration: 1000,
        error: error instanceof Error ? error.message : 'Data flow test failed'
      };
    }
  }

  private calculateTestScore(testResults: any[]): number {
    if (testResults.length === 0) return 0;
    
    const passedTests = testResults.filter(result => result.passed).length;
    return (passedTests / testResults.length) * 100;
  }

  private generateRecommendations(testResults: any[]): string[] {
    const recommendations = [];
    
    const failedTests = testResults.filter(result => !result.passed);
    
    if (failedTests.length === 0) {
      recommendations.push('All tests passed successfully');
    } else {
      failedTests.forEach(test => {
        switch (test.testName) {
          case 'Connectivity':
            recommendations.push('Check network connectivity and firewall settings');
            break;
          case 'Authentication':
            recommendations.push('Verify API credentials and token validity');
            break;
          case 'Health Check':
            recommendations.push('Check service availability and endpoint configuration');
            break;
          case 'Data Flow':
            recommendations.push('Review data mapping and transformation rules');
            break;
        }
      });
    }
    
    return recommendations;
  }

  private async checkIntegrationHealth(integration: Integration): Promise<HealthResult> {
    try {
      // Simulate health check
      await this.delay(100);
      
      const isHealthy = Math.random() > 0.1; // 90% healthy
      const responseTime = 100 + Math.random() * 200;
      
      const healthStatus: HealthStatus = isHealthy ? 'healthy' : 
        (Math.random() > 0.5 ? 'degraded' : 'unhealthy');
      
      integration.connectionInfo.healthStatus = healthStatus;
      integration.connectionInfo.lastHealthCheck = new Date();
      
      return {
        integrationId: integration.id,
        healthStatus,
        responseTime,
        lastCheck: new Date()
      };
    } catch (error) {
      integration.connectionInfo.healthStatus = 'unhealthy';
      return {
        integrationId: integration.id,
        healthStatus: 'unhealthy',
        responseTime: 0,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  private aggregateHealthResults(healthChecks: HealthResult[]): HealthSummary {
    const healthyCount = healthChecks.filter(h => h.healthStatus === 'healthy').length;
    const degradedCount = healthChecks.filter(h => h.healthStatus === 'degraded').length;
    const unhealthyCount = healthChecks.filter(h => h.healthStatus === 'unhealthy').length;
    const unknownCount = healthChecks.filter(h => h.healthStatus === 'unknown').length;
    
    const totalChecks = healthChecks.length;
    const overallHealthScore = totalChecks > 0 ? 
      (healthyCount * 100 + degradedCount * 70 + unhealthyCount * 20) / totalChecks : 100;
    
    return {
      healthyCount,
      degradedCount,
      unhealthyCount,
      unknownCount,
      overallHealthScore,
      lastHealthCheck: new Date()
    };
  }

  private calculateAverageSuccessRate(manager: IntegrationManager): number {
    if (manager.integrations.length === 0) return 100;
    
    const totalSuccessRate = manager.integrations.reduce((sum, integration) => 
      sum + integration.performanceMetrics.successRate, 0
    );
    
    return totalSuccessRate / manager.integrations.length;
  }

  private startHealthChecks(managerId: string): void {
    const manager = this.managers.get(managerId);
    if (!manager || this.healthCheckIntervals.has(managerId)) return;

    const interval = setInterval(() => {
      this.runHealthCheck(managerId).catch(error => {
        console.error(`Health check failed for manager ${managerId}:`, error);
      });
    }, manager.integrationConfig.healthCheckInterval * 1000);

    this.healthCheckIntervals.set(managerId, interval);
  }

  private stopHealthChecks(managerId: string): void {
    const interval = this.healthCheckIntervals.get(managerId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(managerId);
    }
  }

  private setupGlobalHealthChecks(): void {
    // Setup global health monitoring
    setInterval(() => {
      this.performGlobalHealthCheck();
    }, 60000); // Every minute
  }

  private performGlobalHealthCheck(): void {
    for (const manager of this.managers.values()) {
      if (manager.isActive && manager.integrationConfig.enableHealthChecks) {
        this.runHealthCheck(manager.id).catch(error => {
          console.error(`Global health check failed for manager ${manager.id}:`, error);
        });
      }
    }
  }

  private addToConnectionPool(integration: Integration): void {
    const managerId = integration.managerId;
    if (!this.connectionPools.has(managerId)) {
      this.connectionPools.set(managerId, { connections: [], maxSize: 10 });
    }
    
    const pool = this.connectionPools.get(managerId)!;
    if (pool.connections.length < pool.maxSize) {
      pool.connections.push({
        integrationId: integration.id,
        connectionId: integration.connectionInfo.connectionId,
        isActive: true,
        lastUsed: new Date()
      });
    }
  }

  private removeFromConnectionPool(integration: Integration): void {
    const pool = this.connectionPools.get(integration.managerId);
    if (pool) {
      pool.connections = pool.connections.filter(
        conn => conn.integrationId !== integration.id
      );
    }
  }

  private cleanupConnectionPool(managerId: string): void {
    this.connectionPools.delete(managerId);
  }

  private logActivity(managerId: string, activityType: ActivityType, integrationId: string, description: string): void {
    const manager = this.managers.get(managerId);
    if (!manager) return;

    const activity = {
      id: this.generateId(),
      timestamp: new Date(),
      activityType,
      integrationId,
      description,
      severity: 'info' as const
    };

    manager.managerStatus.recentActivity.unshift(activity);
    
    // Keep only recent 100 activities
    if (manager.managerStatus.recentActivity.length > 100) {
      manager.managerStatus.recentActivity = manager.managerStatus.recentActivity.slice(0, 100);
    }
  }

  private findManagerByIntegrationId(integrationId: string): IntegrationManager | null {
    for (const manager of this.managers.values()) {
      if (manager.integrations.some(i => i.id === integrationId)) {
        return manager;
      }
    }
    return null;
  }

  private findIntegrationById(integrationId: string): Integration | null {
    for (const manager of this.managers.values()) {
      const integration = manager.integrations.find(i => i.id === integrationId);
      if (integration) return integration;
    }
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    // TODO: Get from auth context
    return 'user_123';
  }

  // Mock Data Creation
  private createMockManagers(): void {
    const mockManager = this.createMockManager();
    this.managers.set(mockManager.id, mockManager);
  }

  private createMockManager(): IntegrationManager {
    const managerId = this.generateId();
    
    const mockManager: IntegrationManager = {
      id: managerId,
      userId: 'user_123',
      managerName: 'Primary Integration Manager',
      description: 'Main integration hub for AU/NZ brokers and data feeds',
      integrationConfig: this.createMockIntegrationConfig(),
      integrations: this.createMockIntegrations(managerId),
      managerStatus: this.createInitialManagerStatus(),
      lastHealthCheck: new Date(),
      performanceMetrics: this.createInitialPerformanceMetrics(),
      errorHandling: this.createDefaultErrorHandling(),
      securityConfig: this.createMockSecurityConfig(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return mockManager;
  }

  private createMockIntegrationConfig() {
    return {
      maxConcurrentConnections: 10,
      defaultTimeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffStrategy: 'exponential' as const,
        retryableErrors: ['timeout', 'rate_limit', 'server_error'],
        jitterEnabled: true
      },
      globalRateLimit: {
        limitType: 'token_bucket' as const,
        requestsPerSecond: 10,
        requestsPerMinute: 600,
        scope: 'global' as const,
        actionOnExceed: 'throttle' as const,
        recoveryStrategy: 'gradual' as const
      },
      enableHealthChecks: true,
      healthCheckInterval: 300, // 5 minutes
      enableCaching: true,
      cacheConfig: this.createMockCacheConfig(),
      loggingLevel: 'info' as const,
      logRetentionDays: 30,
      notificationChannels: ['email', 'push'] as const,
      enableAUNZCompliance: true,
      auNzDataSovereignty: {
        requireLocalStorage: true,
        allowedRegions: ['AU', 'NZ'],
        dataResidencyRules: [],
        crossBorderTransferRules: []
      }
    };
  }

  private createMockCacheConfig() {
    return {
      cacheType: 'memory' as const,
      defaultTTL: 3600,
      maxCacheSize: 256,
      evictionPolicy: 'lru' as const,
      compressionEnabled: true,
      encryptionEnabled: true,
      warmupEnabled: false,
      warmupStrategy: 'lazy' as const,
      invalidationStrategy: 'ttl' as const,
      distributedCache: false
    };
  }

  private createMockSecurityConfig() {
    return {
      enableAccessControl: true,
      allowedRoles: ['admin', 'user'],
      enableApiSecurity: true,
      apiSecurityConfig: {
        requireApiKey: true,
        enableRateLimiting: true,
        enableIPWhitelisting: false,
        enableCORS: true,
        corsOrigins: ['https://app.stackmotive.com'],
        enableCSRFProtection: true
      },
      dataProtection: {
        encryptionAtRest: true,
        encryptionInTransit: true,
        encryptionAlgorithm: 'AES-256',
        keyRotationEnabled: true,
        keyRotationDays: 90,
        dataAnonymization: false,
        piiRedaction: true
      },
      complianceRequirements: [],
      auditConfig: {
        enableAuditing: true,
        auditLevel: 'standard' as const,
        auditRetentionDays: 365,
        auditFields: ['user_id', 'action', 'timestamp', 'integration_id'],
        enableIntegrityChecks: true
      },
      threatProtection: {
        enableThreatDetection: true,
        enableAnomalyDetection: true,
        suspiciousActivityThreshold: 10,
        automaticBlockingEnabled: false,
        blockingDuration: 60
      }
    };
  }

  private createMockIntegrations(managerId: string): Integration[] {
    return [
      {
        id: this.generateId(),
        managerId,
        integrationName: 'CommSec API',
        integrationType: 'broker_api',
        provider: 'commsec',
        config: this.createMockIntegrationConfigForProvider('commsec'),
        connectionInfo: {
          connectionId: this.generateId(),
          connectionUrl: 'https://api.commsec.com.au',
          isConnected: true,
          lastConnected: new Date(),
          connectionCount: 1,
          totalUptime: 3600,
          healthStatus: 'healthy',
          lastHealthCheck: new Date()
        },
        status: 'active',
        isEnabled: true,
        dataFlow: this.createMockDataFlow(),
        monitoringConfig: this.createMockMonitoringConfig(),
        securitySettings: this.createMockIntegrationSecurity(),
        performanceMetrics: this.createInitialIntegrationMetrics(),
        jurisdiction: 'AU',
        complianceSettings: this.createMockComplianceSettings('AU'),
        lastSync: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private createMockIntegrationConfigForProvider(provider: string) {
    return {
      baseUrl: this.getProviderBaseUrl(provider),
      apiVersion: 'v1',
      endpoints: this.getProviderEndpoints(provider),
      authConfig: {
        authType: 'oauth2' as const,
        credentials: {
          clientId: `${provider}_client_123`,
          clientSecret: `${provider}_secret_456`
        },
        encryptCredentials: true,
        refreshRequired: false
      },
      requestConfig: {
        timeout: 30000,
        retries: 3,
        headers: {
          'User-Agent': 'StackMotive-IntegrationManager/1.0'
        }
      },
      responseConfig: {
        format: 'json' as const,
        compression: true
      },
      errorConfig: {
        retryableStatusCodes: [429, 500, 502, 503, 504],
        maxRetryDelay: 30000
      },
      rateLimits: [
        {
          limitType: 'token_bucket' as const,
          requestsPerSecond: 2,
          requestsPerMinute: 60,
          scope: 'per_endpoint' as const,
          actionOnExceed: 'throttle' as const,
          recoveryStrategy: 'gradual' as const
        }
      ],
      transformationRules: [],
      validationRules: []
    };
  }

  private getProviderBaseUrl(provider: string): string {
    const urls: Record<string, string> = {
      'commsec': 'https://api.commsec.com.au',
      'nabtrade': 'https://api.nabtrade.com.au',
      'sharesight': 'https://api.sharesight.com',
      'yahoo_finance': 'https://query1.finance.yahoo.com',
      'alpha_vantage': 'https://www.alphavantage.co'
    };
    return urls[provider] || 'https://api.example.com';
  }

  private getProviderEndpoints(provider: string) {
    return [
      {
        name: 'holdings',
        path: '/api/v1/holdings',
        method: 'GET' as const,
        description: 'Get portfolio holdings',
        responseFormat: 'json' as const
      },
      {
        name: 'transactions',
        path: '/api/v1/transactions',
        method: 'GET' as const,
        description: 'Get transaction history',
        responseFormat: 'json' as const
      }
    ];
  }

  private createMockDataFlow() {
    return {
      direction: 'inbound' as const,
      dataTypes: ['portfolio_holdings', 'transactions'] as const,
      syncMode: 'scheduled' as const,
      syncFrequency: 'hourly' as const,
      batchSize: 100,
      batchTimeout: 300,
      filters: [],
      fieldMappings: [],
      qualityChecks: []
    };
  }

  private createMockMonitoringConfig() {
    return {
      enableMonitoring: true,
      monitoringInterval: 300,
      trackPerformance: true,
      trackDataQuality: true,
      trackErrorRates: true,
      alertThresholds: [],
      enableDetailedLogging: true,
      logSensitiveData: false,
      expectedResponseTime: 2000
    };
  }

  private createMockIntegrationSecurity() {
    return {
      authType: 'oauth2' as const,
      credentials: {
        clientId: 'client_123',
        clientSecret: 'secret_456'
      },
      encryptInTransit: true,
      encryptAtRest: true,
      requireApiKey: true,
      rotateCredentials: true,
      credentialRotationDays: 90,
      enableAuditLogging: true,
      auditLogRetentionDays: 365,
      dataClassification: 'confidential' as const,
      privacySettings: {
        piiHandling: 'standard' as const,
        dataRetentionPeriod: 2555, // 7 years
        rightToErasure: true,
        consentRequired: true,
        anonymizeData: false
      }
    };
  }

  private createMockComplianceSettings(jurisdiction: 'AU' | 'NZ') {
    return {
      privacyActCompliance: jurisdiction === 'AU',
      nzPrivacyActCompliance: jurisdiction === 'NZ',
      austracCompliance: jurisdiction === 'AU',
      fmaCompliance: jurisdiction === 'NZ',
      dataLocalization: true,
      consentManagement: true,
      regulatoryReporting: true,
      reportingFrequency: 'monthly' as const,
      auditTrailRequired: true,
      auditRetentionPeriod: 7
    };
  }
}

interface ConnectionPool {
  connections: PoolConnection[];
  maxSize: number;
}

interface PoolConnection {
  integrationId: string;
  connectionId: string;
  isActive: boolean;
  lastUsed: Date;
}

interface HealthResult {
  integrationId: string;
  healthStatus: HealthStatus;
  responseTime: number;
  lastCheck: Date;
  error?: string;
} 