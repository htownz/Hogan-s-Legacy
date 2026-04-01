/**
 * Enhanced Cache Service
 * 
 * This service provides an improved caching mechanism using LRU Cache
 * for storing API responses more efficiently than file-based caching.
 */

import { LRUCache } from 'lru-cache';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { createLogger } from "../logger";
const log = createLogger("enhanced-cache");


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure the cache directories for persistent storage
const CACHE_DIR = path.join(__dirname, '../../temp/api-cache');
const LEGISCAN_CACHE_DIR = path.join(CACHE_DIR, 'legiscan');

// Ensure cache directories exist
[CACHE_DIR, LEGISCAN_CACHE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Define cache config type
type CacheConfig = {
  max: number;
  ttl: number;
  allowStale: boolean;
  updateAgeOnGet: boolean;
  cacheDir: string;
};

// Define cache options for different API services
const cacheConfigs: Record<string, CacheConfig> = {
  legiscan: {
    max: 500,           // Maximum items in memory
    ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    allowStale: true,   // Allow returning stale items before removing
    updateAgeOnGet: true, // Reset TTL when item is accessed
    cacheDir: LEGISCAN_CACHE_DIR
  },
  default: {
    max: 200,
    ttl: 30 * 60 * 1000, // 30 minutes in milliseconds
    allowStale: false,
    updateAgeOnGet: false,
    cacheDir: CACHE_DIR
  }
};

/**
 * Create a key for the cache based on operation and parameters
 */
function createCacheKey(operation: string, params: Record<string, any> = {}): string {
  const paramString = JSON.stringify(params);
  return createHash('md5').update(`${operation}:${paramString}`).digest('hex');
}

/**
 * Enhanced cache service for API responses
 */
class ApiCacheService {
  private caches: Map<string, LRUCache<string, any>> = new Map();

  constructor() {
    // Initialize caches for each configured service
    Object.entries(cacheConfigs).forEach(([service, config]) => {
      this.caches.set(service, new LRUCache({
        max: config.max,
        ttl: config.ttl,
        allowStale: config.allowStale,
        updateAgeOnGet: config.updateAgeOnGet
      }));
    });
    
    this.loadCachesFromDisk();
  }

  /**
   * Load cached data from disk into memory
   */
  private loadCachesFromDisk(): void {
    try {
      // For each service, load its cache from disk
      Object.entries(cacheConfigs).forEach(([service, config]) => {
        const cacheDir = config.cacheDir;
        const cache = this.caches.get(service);
        
        if (!cache || !fs.existsSync(cacheDir)) return;
        
        // Read files from cache directory
        const files = fs.readdirSync(cacheDir);
        files.forEach(file => {
          if (!file.endsWith('.json')) return;
          
          try {
            const filePath = path.join(cacheDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const now = Date.now();
            
            // Only load if not expired
            if (data.timestamp && (now - data.timestamp) < config.ttl) {
              const key = path.basename(file, '.json');
              cache.set(key, data.data);
            }
          } catch (error: any) {
            log.error({ err: error }, `Error loading cache file ${file}`);
          }
        });
        
        log.info(`Loaded ${cache.size} items into ${service} cache from disk`);
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error loading caches from disk');
    }
  }

  /**
   * Save cache item to disk
   */
  private saveCacheToDisk(service: string, key: string, data: any): void {
    try {
      // Use as to tell TypeScript we know this is valid
      const config = (cacheConfigs as Record<string, CacheConfig>)[service] || cacheConfigs.default;
      const cacheDir = config.cacheDir;
      
      const cacheData = {
        timestamp: Date.now(),
        data: data
      };
      
      const filePath = path.join(cacheDir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(cacheData));
    } catch (error: any) {
      log.error({ err: error }, `Error saving cache to disk for ${service}:${key}`);
    }
  }

  /**
   * Get item from cache
   */
  public get(service: string, operation: string, params: Record<string, any> = {}): any {
    const cache = this.caches.get(service) || this.caches.get('default');
    const key = createCacheKey(operation, params);
    
    if (!cache) return null;
    
    return cache.get(key);
  }

  /**
   * Set item in cache
   */
  public set(service: string, operation: string, params: Record<string, any> = {}, data: any): void {
    const cache = this.caches.get(service) || this.caches.get('default');
    const key = createCacheKey(operation, params);
    
    if (!cache) return;
    
    cache.set(key, data);
    this.saveCacheToDisk(service, key, data);
  }

  /**
   * Check if item exists in cache
   */
  public has(service: string, operation: string, params: Record<string, any> = {}): boolean {
    const cache = this.caches.get(service) || this.caches.get('default');
    const key = createCacheKey(operation, params);
    
    if (!cache) return false;
    
    return cache.has(key);
  }

  /**
   * Remove item from cache
   */
  public delete(service: string, operation: string, params: Record<string, any> = {}): boolean {
    const cache = this.caches.get(service) || this.caches.get('default');
    const key = createCacheKey(operation, params);
    
    if (!cache) return false;
    
    try {
      const filePath = path.join(
        (cacheConfigs as Record<string, CacheConfig>)[service]?.cacheDir || cacheConfigs.default.cacheDir,
        `${key}.json`
      );
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return cache.delete(key);
    } catch (error: any) {
      log.error({ err: error }, `Error deleting cache for ${service}:${key}`);
      return false;
    }
  }

  /**
   * Clear all items for a service
   */
  public clear(service: string): void {
    const cache = this.caches.get(service);
    const cacheDir = (cacheConfigs as Record<string, CacheConfig>)[service]?.cacheDir || cacheConfigs.default.cacheDir;
    
    if (cache) {
      cache.clear();
    }
    
    // Clear disk cache
    try {
      const files = fs.readdirSync(cacheDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(cacheDir, file));
        }
      });
    } catch (error: any) {
      log.error({ err: error }, `Error clearing cache directory for ${service}`);
    }
  }
}

// Export a singleton instance
export const apiCache = new ApiCacheService();