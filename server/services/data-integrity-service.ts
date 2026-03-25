import { z } from 'zod';

// Data validation schemas for government sources
const TexasEthicsRecordSchema = z.object({
  lobbyistName: z.string().min(1),
  clientName: z.string().min(1),
  year: z.number().min(2000).max(new Date().getFullYear() + 1),
  registrationDate: z.string().optional(),
  amount: z.number().nonnegative().optional()
});

const FECRecordSchema = z.object({
  entityName: z.string().min(1),
  entityType: z.string().min(1),
  amount: z.number().nonnegative(),
  cycle: z.number().min(2000).max(new Date().getFullYear() + 1),
  state: z.string().length(2).optional(),
  city: z.string().optional()
});

const LegislatorSchema = z.object({
  name: z.string().min(1),
  chamber: z.enum(['House', 'Senate']).optional(),
  district: z.string().optional(),
  party: z.enum(['Republican', 'Democratic', 'Independent', 'Other']).optional(),
  office: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional()
});

export class DataIntegrityService {
  private errorLog: Array<{ source: string; error: string; timestamp: Date; data?: any }> = [];
  private validationStats = {
    texasEthics: { validated: 0, errors: 0 },
    fec: { validated: 0, errors: 0 },
    legislators: { validated: 0, errors: 0 }
  };

  // Validate Texas Ethics Commission data
  public validateTexasEthicsData(records: any[]): { valid: any[], invalid: any[], errors: string[] } {
    const valid: any[] = [];
    const invalid: any[] = [];
    const errors: string[] = [];

    records.forEach((record, index) => {
      try {
        const validatedRecord = TexasEthicsRecordSchema.parse(record);
        valid.push(validatedRecord);
        this.validationStats.texasEthics.validated++;
      } catch (error: any) {
        invalid.push(record);
        const errorMsg = `Texas Ethics record ${index}: ${error.message}`;
        errors.push(errorMsg);
        this.logError('texas-ethics', errorMsg, record);
        this.validationStats.texasEthics.errors++;
      }
    });

    return { valid, invalid, errors };
  }

  // Validate FEC campaign finance data
  public validateFECData(records: any[]): { valid: any[], invalid: any[], errors: string[] } {
    const valid: any[] = [];
    const invalid: any[] = [];
    const errors: string[] = [];

    records.forEach((record, index) => {
      try {
        const validatedRecord = FECRecordSchema.parse(record);
        valid.push(validatedRecord);
        this.validationStats.fec.validated++;
      } catch (error: any) {
        invalid.push(record);
        const errorMsg = `FEC record ${index}: ${error.message}`;
        errors.push(errorMsg);
        this.logError('fec', errorMsg, record);
        this.validationStats.fec.errors++;
      }
    });

    return { valid, invalid, errors };
  }

  // Validate legislator data
  public validateLegislatorData(records: any[]): { valid: any[], invalid: any[], errors: string[] } {
    const valid: any[] = [];
    const invalid: any[] = [];
    const errors: string[] = [];

    records.forEach((record, index) => {
      try {
        const validatedRecord = LegislatorSchema.parse(record);
        valid.push(validatedRecord);
        this.validationStats.legislators.validated++;
      } catch (error: any) {
        invalid.push(record);
        const errorMsg = `Legislator record ${index}: ${error.message}`;
        errors.push(errorMsg);
        this.logError('legislators', errorMsg, record);
        this.validationStats.legislators.errors++;
      }
    });

    return { valid, invalid, errors };
  }

  // Check data freshness and availability
  public checkDataFreshness(source: string, lastUpdate: Date): { isStale: boolean, hoursOld: number, recommendation: string } {
    const now = new Date();
    const hoursOld = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    let maxHours: number;
    switch (source) {
      case 'texas-ethics':
        maxHours = 24; // Ethics data should be updated daily
        break;
      case 'fec':
        maxHours = 12; // Campaign finance updated twice daily
        break;
      case 'texas-legislature':
        maxHours = 2; // Legislative data should be very fresh
        break;
      case 'legislators':
        maxHours = 168; // Legislator info can be weekly
        break;
      default:
        maxHours = 24;
    }

    const isStale = hoursOld > maxHours;
    const recommendation = isStale ? 
      `Data is ${Math.round(hoursOld)} hours old. Consider refreshing from ${source}.` :
      'Data is fresh and current.';

    return { isStale, hoursOld: Math.round(hoursOld), recommendation };
  }

  // Fail-safe data handling when APIs are unavailable
  public createFailsafeResponse(source: string, error: any): any {
    const failsafeMessage = {
      source,
      available: false,
      error: 'Government data source temporarily unavailable',
      lastAttempt: new Date().toISOString(),
      retryRecommended: true,
      fallbackData: null
    };

    this.logError(source, `API unavailable: ${error.message}`);
    
    console.warn(`⚠️ ${source} API unavailable, returning failsafe response`);
    return failsafeMessage;
  }

  // Cross-reference data consistency between sources
  public crossReferenceData(fecData: any[], texasEthicsData: any[]): { 
    matches: any[], 
    fecOnly: any[], 
    texasOnly: any[], 
    discrepancies: any[] 
  } {
    const matches: any[] = [];
    const fecOnly: any[] = [];
    const texasOnly: any[] = [];
    const discrepancies: any[] = [];

    // Simple name-based matching (in production, use more sophisticated matching)
    fecData.forEach(fecRecord => {
      const matchingTexasRecord = texasEthicsData.find(texasRecord => 
        this.normalizeEntityName(fecRecord.entityName) === this.normalizeEntityName(texasRecord.lobbyistName)
      );

      if (matchingTexasRecord) {
        matches.push({
          fecRecord,
          texasRecord: matchingTexasRecord,
          matchType: 'name'
        });
      } else {
        fecOnly.push(fecRecord);
      }
    });

    // Find Texas-only records
    texasEthicsData.forEach(texasRecord => {
      const matchingFecRecord = fecData.find(fecRecord => 
        this.normalizeEntityName(texasRecord.lobbyistName) === this.normalizeEntityName(fecRecord.entityName)
      );

      if (!matchingFecRecord) {
        texasOnly.push(texasRecord);
      }
    });

    return { matches, fecOnly, texasOnly, discrepancies };
  }

  // Data completeness scoring
  public scoreDataCompleteness(record: any): { score: number, missingFields: string[], suggestions: string[] } {
    const requiredFields = ['name', 'amount', 'date'];
    const optionalFields = ['address', 'phone', 'email', 'description'];
    
    const missingRequired = requiredFields.filter(field => !record[field]);
    const missingOptional = optionalFields.filter(field => !record[field]);
    
    const requiredScore = (requiredFields.length - missingRequired.length) / requiredFields.length;
    const optionalScore = (optionalFields.length - missingOptional.length) / optionalFields.length;
    
    const score = (requiredScore * 0.7) + (optionalScore * 0.3); // Weight required fields more heavily
    
    const suggestions = [
      ...missingRequired.map(field => `Required field '${field}' is missing`),
      ...missingOptional.map(field => `Optional field '${field}' would improve data quality`)
    ];

    return {
      score: Math.round(score * 100),
      missingFields: [...missingRequired, ...missingOptional],
      suggestions
    };
  }

  // Utility methods
  private normalizeEntityName(name: string): string {
    return name?.toLowerCase().replace(/[^\w\s]/g, '').trim() || '';
  }

  private logError(source: string, error: string, data?: any): void {
    this.errorLog.push({
      source,
      error,
      timestamp: new Date(),
      data
    });

    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  // Get validation statistics
  public getValidationStats() {
    return {
      stats: this.validationStats,
      recentErrors: this.errorLog.slice(-10),
      totalErrors: this.errorLog.length
    };
  }

  // Clear error log
  public clearErrorLog(): void {
    this.errorLog = [];
    console.log('🗑️ Data integrity error log cleared');
  }

  // Health check for all data sources
  public async performHealthCheck(): Promise<{ 
    overall: 'healthy' | 'degraded' | 'unhealthy',
    sources: { [key: string]: any }
  }> {
    const sources = {
      'texas-ethics': await this.checkSourceHealth('texas-ethics'),
      'fec': await this.checkSourceHealth('fec'),
      'texas-legislature': await this.checkSourceHealth('texas-legislature'),
      'legislators': await this.checkSourceHealth('legislators')
    };

    const healthyCount = Object.values(sources).filter(s => s.status === 'healthy').length;
    const totalCount = Object.values(sources).length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      overall = 'healthy';
    } else if (healthyCount >= totalCount / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return { overall, sources };
  }

  private async checkSourceHealth(source: string): Promise<any> {
    const stats = this.validationStats[source as keyof typeof this.validationStats];
    const recentErrors = this.errorLog.filter(log => 
      log.source === source && 
      log.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    ).length;

    const errorRate = stats ? stats.errors / (stats.validated + stats.errors) : 0;
    
    return {
      status: errorRate < 0.1 && recentErrors < 5 ? 'healthy' : 
              errorRate < 0.3 && recentErrors < 10 ? 'degraded' : 'unhealthy',
      errorRate: Math.round(errorRate * 100),
      recentErrors,
      validated: stats?.validated || 0,
      totalErrors: stats?.errors || 0
    };
  }
}

export const dataIntegrity = new DataIntegrityService();