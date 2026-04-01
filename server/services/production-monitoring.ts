import { dataIntegrity } from './data-integrity-service';
import { productionCache } from './production-cache';
import { productionDataSync } from './production-data-sync';
import { createLogger } from "../logger";
const log = createLogger("production-monitoring");


export class ProductionMonitoringService {
  private alerts: Array<{ 
    level: 'info' | 'warning' | 'error' | 'critical',
    message: string,
    source: string,
    timestamp: Date,
    resolved: boolean
  }> = [];

  private metrics = {
    uptime: Date.now(),
    apiCalls: 0,
    errors: 0,
    dataSync: {
      lastRun: null as Date | null,
      successCount: 0,
      errorCount: 0
    },
    cache: {
      hitCount: 0,
      missCount: 0
    }
  };

  // Log system events and alerts
  public logAlert(level: 'info' | 'warning' | 'error' | 'critical', message: string, source: string) {
    const alert = {
      level,
      message,
      source,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    // Log to console with appropriate level
    const logMethod = level === 'critical' || level === 'error' ? console.error :
                     level === 'warning' ? console.warn : console.log;
    
    logMethod(`[${level.toUpperCase()}] ${source}: ${message}`);

    // In production, you would send critical alerts to monitoring services
    if (level === 'critical') {
      this.sendCriticalAlert(alert);
    }
  }

  // Track API performance
  public trackApiCall(endpoint: string, duration: number, success: boolean) {
    this.metrics.apiCalls++;
    
    if (!success) {
      this.metrics.errors++;
      this.logAlert('error', `API call to ${endpoint} failed (${duration}ms)`, 'api');
    }

    // Alert on slow API responses
    if (duration > 5000) {
      this.logAlert('warning', `Slow API response: ${endpoint} took ${duration}ms`, 'performance');
    }
  }

  // Monitor data sync health
  public trackDataSync(source: string, success: boolean, recordCount?: number) {
    this.metrics.dataSync.lastRun = new Date();
    
    if (success) {
      this.metrics.dataSync.successCount++;
      this.logAlert('info', `Data sync completed successfully for ${source} (${recordCount || 0} records)`, 'sync');
    } else {
      this.metrics.dataSync.errorCount++;
      this.logAlert('error', `Data sync failed for ${source}`, 'sync');
    }
  }

  // Monitor cache performance
  public updateCacheMetrics() {
    const cacheStats = productionCache.getStats();
    this.metrics.cache.hitCount = cacheStats.hitCount;
    this.metrics.cache.missCount = cacheStats.missCount;

    // Alert on poor cache performance
    const hitRate = cacheStats.hitRate;
    if (hitRate < 0.5 && cacheStats.hitCount + cacheStats.missCount > 100) {
      this.logAlert('warning', `Low cache hit rate: ${Math.round(hitRate * 100)}%`, 'cache');
    }
  }

  // Get system health status
  public async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy',
    uptime: number,
    metrics: any,
    alerts: any[],
    dataSources: any
  }> {
    // Update cache metrics
    this.updateCacheMetrics();

    // Get data integrity health
    const dataHealth = await dataIntegrity.performHealthCheck();
    
    // Get sync status
    const syncStatus = productionDataSync.getSyncStatus();

    // Calculate overall health
    const recentErrors = this.alerts.filter(alert => 
      alert.level === 'error' || alert.level === 'critical'
    ).filter(alert => 
      alert.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    ).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (dataHealth.overall === 'healthy' && recentErrors < 5) {
      status = 'healthy';
    } else if (dataHealth.overall === 'degraded' || recentErrors < 10) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      uptime: Date.now() - this.metrics.uptime,
      metrics: {
        ...this.metrics,
        errorRate: this.metrics.errors / Math.max(this.metrics.apiCalls, 1),
        cacheHitRate: this.metrics.cache.hitCount / Math.max(this.metrics.cache.hitCount + this.metrics.cache.missCount, 1)
      },
      alerts: this.alerts.slice(0, 10), // Recent alerts
      dataSources: dataHealth.sources
    };
  }

  // Get monitoring dashboard data
  public getMonitoringDashboard() {
    const recentAlerts = this.alerts.slice(0, 20);
    const criticalAlerts = this.alerts.filter(alert => 
      alert.level === 'critical' && !alert.resolved
    );
    
    return {
      overview: {
        totalAlerts: this.alerts.length,
        criticalAlerts: criticalAlerts.length,
        apiCalls: this.metrics.apiCalls,
        errors: this.metrics.errors,
        uptime: Date.now() - this.metrics.uptime
      },
      recentAlerts,
      criticalAlerts,
      syncStatus: productionDataSync.getSyncStatus(),
      cacheStats: productionCache.getStats(),
      dataIntegrityStats: dataIntegrity.getValidationStats()
    };
  }

  // Resolve an alert
  public resolveAlert(alertIndex: number) {
    if (this.alerts[alertIndex]) {
      this.alerts[alertIndex].resolved = true;
      this.logAlert('info', `Alert resolved: ${this.alerts[alertIndex].message}`, 'monitoring');
    }
  }

  // Send critical alert (in production, integrate with your alerting system)
  private sendCriticalAlert(alert: any) {
    log.error({ err: alert }, '🚨 CRITICAL ALERT');
    
    // In production, you would integrate with:
    // - Slack notifications
    // - Email alerts
    // - SMS alerts
    // - Monitoring services (DataDog, New Relic, etc.)
    
    // Example placeholder for integration:
    // await this.sendSlackAlert(alert);
    // await this.sendEmailAlert(alert);
  }

  // Check government API availability
  public async checkGovernmentApiHealth(): Promise<{
    [key: string]: {
      available: boolean,
      responseTime: number,
      lastChecked: Date,
      error?: string
    }
  }> {
    const results: any = {};
    
    const apis = [
      { name: 'texas-ethics', url: 'https://ethics.state.tx.us' },
      { name: 'fec', url: 'https://api.fec.gov' },
      { name: 'legiscan', url: 'https://api.legiscan.com' }
    ];

    for (const api of apis) {
      const startTime = Date.now();
      try {
        // Simple connectivity check (in production, use proper health endpoints)
        const response = await fetch(api.url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        results[api.name] = {
          available: response.ok,
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          error: response.ok ? undefined : `HTTP ${response.status}`
        };
      } catch (error: any) {
        results[api.name] = {
          available: false,
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        this.logAlert('warning', `Government API ${api.name} is unreachable`, 'api-health');
      }
    }

    return results;
  }

  // Performance monitoring
  public startPerformanceMonitoring() {
    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;
      
      if (memUsageMB > 500) { // Alert if using more than 500MB
        this.logAlert('warning', `High memory usage: ${Math.round(memUsageMB)}MB`, 'performance');
      }
    }, 60000); // Check every minute

    // Monitor API health
    setInterval(async () => {
      await this.checkGovernmentApiHealth();
    }, 300000); // Check every 5 minutes

    log.info('✅ Performance monitoring started');
  }

  // Clear old alerts
  public clearOldAlerts() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneWeekAgo);
    
    const clearedCount = initialCount - this.alerts.length;
    if (clearedCount > 0) {
      this.logAlert('info', `Cleared ${clearedCount} old alerts`, 'monitoring');
    }
  }
}

export const productionMonitoring = new ProductionMonitoringService();