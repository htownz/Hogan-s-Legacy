// @ts-nocheck
import cron from 'node-cron';
import { LiveDataIntegrationService } from './live-data-integration-service';
import { createLogger } from "../logger";
const log = createLogger("production-data-sync");


export class ProductionDataSyncService {
  private liveDataService: LiveDataIntegrationService;
  private isRunning = false;
  private lastSyncTimes: { [key: string]: Date } = {};
  private errorCounts: { [key: string]: number } = {};
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor() {
    this.liveDataService = new LiveDataIntegrationService();
  }

  // Start automated sync schedules
  public startProductionSync() {
    if (this.isRunning) {
      log.info('Production sync already running');
      return;
    }

    this.isRunning = true;
    log.info('🚀 Starting production data sync schedules...');

    // Texas Ethics Commission - Every 4 hours
    cron.schedule('0 */4 * * *', async () => {
      await this.syncWithRetry('texas-ethics', () => this.syncTexasEthicsData());
    });

    // FEC Campaign Finance - Every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.syncWithRetry('fec-campaign', () => this.syncFECData());
    });

    // Texas Legislature - Every 2 hours during session, daily otherwise
    const isSessionTime = this.isLegislativeSession();
    const scheduleTime = isSessionTime ? '0 */2 * * *' : '0 6 * * *';
    
    cron.schedule(scheduleTime, async () => {
      await this.syncWithRetry('texas-legislature', () => this.syncTexasLegislature());
    });

    // LegiScan API - Every 12 hours
    cron.schedule('0 */12 * * *', async () => {
      await this.syncWithRetry('legiscan', () => this.syncLegiScanData());
    });

    log.info('✅ Production sync schedules activated');
  }

  // Sync with automatic retry logic
  private async syncWithRetry(source: string, syncFunction: () => Promise<any>, attempt = 1): Promise<boolean> {
    try {
      log.info(`📡 Starting ${source} sync (attempt ${attempt})`);
      
      const result = await syncFunction();
      
      if (result) {
        this.lastSyncTimes[source] = new Date();
        this.errorCounts[source] = 0;
        log.info(`✅ ${source} sync completed successfully`);
        return true;
      } else {
        throw new Error(`${source} sync returned empty result`);
      }
      
    } catch (error: any) {
      this.errorCounts[source] = (this.errorCounts[source] || 0) + 1;
      log.error({ err: error }, `❌ ${source} sync failed (attempt ${attempt})`);
      
      if (attempt < this.maxRetries) {
        log.info(`🔄 Retrying ${source} sync in ${this.retryDelay / 1000} seconds...`);
        await this.delay(this.retryDelay * attempt); // Exponential backoff
        return this.syncWithRetry(source, syncFunction, attempt + 1);
      } else {
        log.error(`💥 ${source} sync failed after ${this.maxRetries} attempts`);
        await this.notifyFailure(source, error);
        return false;
      }
    }
  }

  // Individual sync methods with error handling
  private async syncTexasEthicsData(): Promise<any> {
    try {
      const result = await this.liveDataService.syncTexasEthicsCommission();
      return result?.success ? result : null;
    } catch (error: any) {
      log.error({ err: error }, 'Texas Ethics Commission sync error');
      throw error;
    }
  }

  private async syncFECData(): Promise<any> {
    try {
      const result = await this.liveDataService.syncFECData();
      return result?.success ? result : null;
    } catch (error: any) {
      log.error({ err: error }, 'FEC data sync error');
      throw error;
    }
  }

  private async syncTexasLegislature(): Promise<any> {
    try {
      const result = await this.liveDataService.syncTexasLegislature();
      return result?.success ? result : null;
    } catch (error: any) {
      log.error({ err: error }, 'Texas Legislature sync error');
      throw error;
    }
  }

  private async syncLegiScanData(): Promise<any> {
    try {
      const result = await this.liveDataService.syncLegiScanAPI();
      return result?.success ? result : null;
    } catch (error: any) {
      log.error({ err: error }, 'LegiScan API sync error');
      throw error;
    }
  }

  // Check if we're in legislative session (adjust dates as needed)
  private isLegislativeSession(): boolean {
    const now = new Date();
    const year = now.getFullYear();
    
    // Texas Legislature meets odd years, Jan-May
    if (year % 2 === 1) {
      const sessionStart = new Date(year, 0, 1); // January 1
      const sessionEnd = new Date(year, 4, 31);   // May 31
      return now >= sessionStart && now <= sessionEnd;
    }
    
    return false;
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async notifyFailure(source: string, error: any) {
    // Log critical failure for monitoring
    log.error(`🚨 CRITICAL: ${source} sync failed permanently:`, {
      source,
      error: error.message,
      timestamp: new Date().toISOString(),
      errorCount: this.errorCounts[source]
    });
    
    // In production, you might send alerts here
    // e.g., Slack notification, email, monitoring service
  }

  // Get sync status for monitoring
  public getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTimes: this.lastSyncTimes,
      errorCounts: this.errorCounts,
      isLegislativeSession: this.isLegislativeSession()
    };
  }

  // Force immediate sync of all sources
  public async forceFullSync(): Promise<{ [key: string]: boolean }> {
    log.info('🔄 Starting forced full sync of all data sources...');
    
    const results = await Promise.allSettled([
      this.syncWithRetry('texas-ethics', () => this.syncTexasEthicsData()),
      this.syncWithRetry('fec-campaign', () => this.syncFECData()),
      this.syncWithRetry('texas-legislature', () => this.syncTexasLegislature()),
      this.syncWithRetry('legiscan', () => this.syncLegiScanData())
    ]);

    const syncResults: { [key: string]: boolean } = {};
    const sources = ['texas-ethics', 'fec-campaign', 'texas-legislature', 'legiscan'];
    
    results.forEach((result, index) => {
      syncResults[sources[index]] = result.status === 'fulfilled' && result.value === true;
    });

    log.info({ detail: syncResults }, '📊 Full sync completed');
    return syncResults;
  }

  public stopSync() {
    this.isRunning = false;
    log.info('⏹️ Production data sync stopped');
  }
}

// Export singleton instance
export const productionDataSync = new ProductionDataSyncService();