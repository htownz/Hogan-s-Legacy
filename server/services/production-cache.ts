import { LRUCache } from 'lru-cache';

export class ProductionCacheService {
  private cache: LRUCache<string, any>;
  private hitCount = 0;
  private missCount = 0;

  constructor() {
    this.cache = new LRUCache({
      max: 1000, // Maximum 1000 items
      ttl: 1000 * 60 * 15, // 15 minutes default TTL
      updateAgeOnGet: true,
      allowStale: true
    });
  }

  // Cache government data with appropriate TTL
  public cacheGovernmentData(key: string, data: any, customTTL?: number): void {
    const ttl = customTTL || this.getDataSourceTTL(key);
    this.cache.set(key, data, { ttl });
  }

  // Get cached data with hit/miss tracking
  public getCachedData(key: string): any | null {
    const data = this.cache.get(key);
    if (data) {
      this.hitCount++;
      return data;
    } else {
      this.missCount++;
      return null;
    }
  }

  // Get TTL based on data source
  private getDataSourceTTL(key: string): number {
    if (key.includes('texas-ethics')) {
      return 1000 * 60 * 60 * 4; // 4 hours - ethics data doesn't change frequently
    }
    if (key.includes('fec-campaign')) {
      return 1000 * 60 * 60 * 6; // 6 hours - campaign finance updates periodically
    }
    if (key.includes('texas-legislature')) {
      return 1000 * 60 * 30; // 30 minutes - legislative data can change quickly
    }
    if (key.includes('legiscan')) {
      return 1000 * 60 * 60 * 2; // 2 hours - bill tracking updates regularly
    }
    if (key.includes('legislators')) {
      return 1000 * 60 * 60 * 24; // 24 hours - legislator info rarely changes
    }
    return 1000 * 60 * 15; // 15 minutes default
  }

  // Invalidate cache for specific data source
  public invalidateDataSource(source: string): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.includes(source));
    keys.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Invalidated ${keys.length} cache entries for ${source}`);
  }

  // Get cache statistics
  public getStats() {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      remainingTTL: this.cache.getRemainingTTL?.('sample-key') || 0
    };
  }

  // Clear all cache
  public clearAll(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    console.log('🗑️ All cache cleared');
  }
}

export const productionCache = new ProductionCacheService();