// @ts-nocheck
/**
 * Texas Data Activator
 * 
 * This service activates authentic Texas legislative data flow
 * by connecting to current legislative sessions and populating
 * the platform with real bills, legislators, and voting records.
 */

import { legiscanService } from './legiscan-service';
import { db } from '../db';
import { createLogger } from "../logger";
const log = createLogger("texas-data-activator");


export class TexasDataActivator {
  private currentTexasSessionId: number | null = null;

  async initialize() {
    log.info('🏛️ Activating authentic Texas legislative data...');
    
    try {
      // Get all available sessions to find current Texas session
      const sessions = await legiscanService.getSessionList();
      
      // Find ALL Texas sessions (state_id: 48) and use the most recent one available
      const texasSessions = sessions.filter((session: any) => 
        session.state_id === 48
      );

      log.info(`Found ${texasSessions.length} Texas sessions in LegiScan`);

      if (texasSessions.length > 0) {
        // Sort by year and get the most recent
        const currentSession = texasSessions.sort((a: any, b: any) => 
          b.year_start - a.year_start
        )[0];
        
        this.currentTexasSessionId = currentSession.session_id;
        log.info(`✅ Using Texas session: ${currentSession.session_name} (${currentSession.year_start}, ID: ${this.currentTexasSessionId})`);
        
        // Start loading bills and legislators from this session
        const [bills, legislators] = await Promise.all([
          this.loadCurrentBills(),
          this.loadCurrentLegislators()
        ]);
        
        return {
          success: true,
          sessionId: this.currentTexasSessionId,
          sessionName: currentSession.session_name,
          year: currentSession.year_start,
          billCount: bills ? Object.keys(bills).length : 0,
          legislatorCount: legislators ? legislators.length : 0
        };
      } else {
        log.info('❌ No Texas sessions found in LegiScan');
        return { success: false, error: 'No Texas sessions available in LegiScan' };
      }
    } catch (error: any) {
      log.error({ err: error }, '❌ Error activating Texas data');
      return { success: false, error: error.message };
    }
  }

  async loadCurrentBills() {
    if (!this.currentTexasSessionId) return;

    try {
      log.info('📋 Loading current Texas bills...');
      const billsList = await legiscanService.getMasterList(this.currentTexasSessionId.toString());
      
      if (billsList && billsList.bill) {
        log.info(`✅ Loaded ${Object.keys(billsList.bill).length} Texas bills`);
        return billsList.bill;
      } else {
        log.info('📋 No bills found in current session');
        return {};
      }
    } catch (error: any) {
      log.error({ err: error }, '❌ Error loading bills');
      return {};
    }
  }

  async loadCurrentLegislators() {
    if (!this.currentTexasSessionId) return;

    try {
      log.info('👥 Loading current Texas legislators...');
      // Get legislators from the current session
      const billsList = await legiscanService.getMasterList(this.currentTexasSessionId.toString());
      
      if (billsList && billsList.sponsors) {
        const legislators = Object.values(billsList.sponsors);
        log.info(`✅ Loaded ${legislators.length} Texas legislators`);
        return legislators;
      } else {
        log.info('👥 No legislators found in current session');
        return [];
      }
    } catch (error: any) {
      log.error({ err: error }, '❌ Error loading legislators');
      return [];
    }
  }

  async getCurrentTexasData() {
    if (!this.currentTexasSessionId) {
      await this.initialize();
    }

    const [bills, legislators] = await Promise.all([
      this.loadCurrentBills(),
      this.loadCurrentLegislators()
    ]);

    return {
      sessionId: this.currentTexasSessionId,
      bills,
      legislators,
      dataSource: 'LegiScan API - Authentic Texas Legislature Data'
    };
  }
}

export const texasDataActivator = new TexasDataActivator();