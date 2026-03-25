// @ts-nocheck
import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface MobileMetrics {
  pageLoadTime: number;
  interactionDelay: number;
  dataUsage: number;
  cacheHitRate: number;
  offlineCapability: boolean;
}

export class MobileOptimizationService {
  // Optimize data payloads for mobile
  async optimizeDataForMobile(data: any, userAgent: string): Promise<any> {
    const isMobile = this.isMobileDevice(userAgent);
    
    if (!isMobile) return data;

    // Reduce payload size for mobile
    return {
      ...data,
      // Limit results for faster loading
      bills: data.bills?.slice(0, 10),
      // Remove heavy metadata
      metadata: undefined,
      // Compress image URLs
      images: data.images?.map((img: string) => this.optimizeImageForMobile(img))
    };
  }

  // Check if request is from mobile device
  private isMobileDevice(userAgent: string): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  }

  // Optimize images for mobile
  private optimizeImageForMobile(imageUrl: string): string {
    // In production, this would integrate with an image optimization service
    return imageUrl.replace('/full/', '/mobile/');
  }

  // Get critical bill data for mobile homepage
  async getCriticalBillData(): Promise<any> {
    const criticalBills = await db.execute(sql`
      SELECT 
        id, bill_number, title, status, last_action_date,
        CASE 
          WHEN last_action_date > NOW() - INTERVAL '24 hours' THEN 'urgent'
          WHEN last_action_date > NOW() - INTERVAL '7 days' THEN 'recent'
          ELSE 'standard'
        END as priority
      FROM bills 
      WHERE is_active = true
      ORDER BY 
        CASE 
          WHEN last_action_date > NOW() - INTERVAL '24 hours' THEN 1
          WHEN last_action_date > NOW() - INTERVAL '7 days' THEN 2
          ELSE 3
        END,
        last_action_date DESC
      LIMIT 5
    `);

    return criticalBills;
  }

  // Generate mobile-optimized notifications
  async createMobileNotification(userId: number, billId: number, action: string): Promise<void> {
    const notification = {
      title: `Bill Update`,
      body: `${action} - Tap for details`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: { billId, action },
      actions: [
        { action: 'view', title: 'View Bill' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    await db.execute(sql`
      INSERT INTO notification_queue (
        user_id, type, title, message, data, priority
      ) VALUES (
        ${userId},
        'mobile_push',
        ${notification.title},
        ${notification.body},
        ${JSON.stringify(notification)},
        'high'
      )
    `);
  }

  // Track mobile performance metrics
  async trackMobileMetrics(metrics: MobileMetrics, userId?: number): Promise<void> {
    await db.execute(sql`
      INSERT INTO mobile_performance_metrics (
        user_id, page_load_time, interaction_delay, 
        data_usage, cache_hit_rate, offline_capability, created_at
      ) VALUES (
        ${userId || null},
        ${metrics.pageLoadTime},
        ${metrics.interactionDelay},
        ${metrics.dataUsage},
        ${metrics.cacheHitRate},
        ${metrics.offlineCapability},
        NOW()
      )
    `);
  }

  // Get mobile performance insights
  async getMobilePerformanceInsights(): Promise<any> {
    const metrics = await db.execute(sql`
      SELECT 
        AVG(page_load_time) as avg_load_time,
        AVG(interaction_delay) as avg_interaction_delay,
        AVG(data_usage) as avg_data_usage,
        AVG(cache_hit_rate) as avg_cache_hit_rate,
        COUNT(CASE WHEN offline_capability THEN 1 END) as offline_sessions,
        COUNT(*) as total_sessions
      FROM mobile_performance_metrics
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    const deviceMetrics = await db.execute(sql`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        AVG(page_load_time) as avg_load_time,
        COUNT(*) as session_count
      FROM mobile_performance_metrics
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `);

    return {
      overall: metrics[0],
      hourly: deviceMetrics
    };
  }

  // Optimize bill content for mobile reading
  async optimizeBillForMobile(billId: number): Promise<any> {
    const bill = await db.execute(sql`
      SELECT id, bill_number, title, description, status, last_action
      FROM bills
      WHERE id = ${billId}
    `);

    if (!bill[0]) return null;

    const billData = bill[0] as any;

    // Create mobile-friendly summary
    const mobileSummary = {
      id: billData.id,
      number: billData.bill_number,
      title: this.truncateText(billData.title, 60),
      summary: this.createMobileSummary(billData.description),
      status: billData.status,
      lastAction: billData.last_action,
      keyPoints: await this.extractKeyPoints(billData.description)
    };

    return mobileSummary;
  }

  // Create concise mobile summary
  private createMobileSummary(description: string): string {
    if (!description) return 'No summary available';
    
    // Extract first meaningful sentence
    const sentences = description.split('.');
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length < 120) {
      return firstSentence + '.';
    }
    
    return this.truncateText(description, 100);
  }

  // Extract key points for mobile display
  private async extractKeyPoints(description: string): Promise<string[]> {
    if (!description) return [];
    
    // Simple keyword extraction for mobile display
    const keywords = description
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 4)
      .slice(0, 3);
    
    return keywords.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
  }

  // Truncate text for mobile display
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  // Generate offline cache manifest
  async generateOfflineCacheManifest(): Promise<string[]> {
    const criticalResources = [
      '/',
      '/dashboard',
      '/bills',
      '/manifest.json',
      '/icon-192x192.png',
      '/icon-512x512.png'
    ];

    // Add critical bill data
    const recentBills = await this.getCriticalBillData();
    const billUrls = recentBills.map((bill: any) => `/bills/${bill.id}`);

    return [...criticalResources, ...billUrls];
  }

  // Check mobile data connection speed
  estimateConnectionSpeed(dataUsage: number, loadTime: number): 'slow' | 'medium' | 'fast' {
    const speed = dataUsage / loadTime; // KB/ms
    
    if (speed < 0.1) return 'slow';
    if (speed < 0.5) return 'medium';
    return 'fast';
  }

  // Adaptive content loading based on connection
  async getAdaptiveContent(connectionSpeed: 'slow' | 'medium' | 'fast'): Promise<any> {
    switch (connectionSpeed) {
      case 'slow':
        return {
          bills: await this.getCriticalBillData(),
          images: false,
          animations: false,
          autoRefresh: false
        };
      case 'medium':
        return {
          bills: await this.getCriticalBillData(),
          images: true,
          animations: false,
          autoRefresh: 30000 // 30 seconds
        };
      case 'fast':
        return {
          bills: await this.getCriticalBillData(),
          images: true,
          animations: true,
          autoRefresh: 10000 // 10 seconds
        };
    }
  }
}

export const mobileOptimizationService = new MobileOptimizationService();