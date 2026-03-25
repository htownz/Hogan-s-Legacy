import * as fs from 'fs';
import * as path from 'path';
import { storage } from '../storage';

/**
 * LegiScan Data Importer
 * Import authentic Texas legislative data from LegiScan files
 * Provides immediate live data for Act Up platform
 */

interface LegiScanBill {
  bill_id: string;
  bill_number: string;
  title: string;
  description: string;
  state: string;
  session: string;
  status: string;
  status_date: string;
  url: string;
  sponsors: Array<{
    people_id: string;
    name: string;
    first_name: string;
    last_name: string;
    party: string;
    role: string;
  }>;
  subjects: string[];
  committee: string;
  last_action: string;
  last_action_date: string;
  texts: Array<{
    doc_id: string;
    type: string;
    url: string;
    date: string;
  }>;
  votes: Array<{
    roll_call_id: string;
    date: string;
    desc: string;
    yea: number;
    nay: number;
    nv: number;
    absent: number;
  }>;
  amendments: any[];
  calendar: any[];
  history: Array<{
    date: string;
    action: string;
    chamber: string;
  }>;
}

interface LegiScanPerson {
  people_id: string;
  person_hash: string;
  state_id: string;
  party_id: string;
  party: string;
  role_id: string;
  role: string;
  name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  nickname: string;
  district: string;
  ftm_eid: string;
  votesmart_id: string;
  opensecrets_id: string;
  knowwho_pid: string;
  ballotpedia: string;
  committee_sponsor: string;
  committee_id: string;
}

class LegiScanDataImporter {
  private uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Import all LegiScan data from uploaded files
   */
  async importLegiScanData(): Promise<{
    success: boolean;
    billsImported: number;
    legislatorsImported: number;
    errors: string[];
    data: {
      bills: any[];
      legislators: any[];
    };
  }> {
    const results = {
      success: true,
      billsImported: 0,
      legislatorsImported: 0,
      errors: [] as string[],
      data: {
        bills: [] as any[],
        legislators: [] as any[]
      }
    };

    try {
      console.log('📋 Starting LegiScan data import...');

      // Ensure uploads directory exists
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }

      // Import bills
      try {
        const bills = await this.importBills();
        results.data.bills = bills;
        results.billsImported = bills.length;
        console.log(`✅ Imported ${bills.length} bills from LegiScan`);
      } catch (error: any) {
        console.error('❌ Error importing bills:', error.message);
        results.errors.push(`Bills: ${error.message}`);
      }

      // Import legislators
      try {
        const legislators = await this.importLegislators();
        results.data.legislators = legislators;
        results.legislatorsImported = legislators.length;
        console.log(`✅ Imported ${legislators.length} legislators from LegiScan`);
      } catch (error: any) {
        console.error('❌ Error importing legislators:', error.message);
        results.errors.push(`Legislators: ${error.message}`);
      }

      console.log(`🎉 LegiScan import completed: ${results.billsImported} bills, ${results.legislatorsImported} legislators`);

    } catch (error: any) {
      console.error('❌ LegiScan data import failed:', error.message);
      results.success = false;
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Import bills from LegiScan JSON files
   */
  private async importBills(): Promise<any[]> {
    const bills: any[] = [];

    try {
      // Look for bill JSON files in uploads directory
      const files = fs.readdirSync(this.uploadsDir);
      const billFiles = files.filter(file => 
        file.toLowerCase().includes('bill') && 
        file.toLowerCase().endsWith('.json')
      );

      console.log(`📋 Found ${billFiles.length} bill files to import`);

      for (const file of billFiles) {
        try {
          const filePath = path.join(this.uploadsDir, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const jsonData = JSON.parse(data);

          // Handle different LegiScan JSON structures
          const billData = jsonData.bill || jsonData;

          if (Array.isArray(billData)) {
            // Multiple bills in array
            for (const bill of billData) {
              const normalizedBill = this.normalizeBillData(bill);
              bills.push(normalizedBill);
            }
          } else if (billData.bill_id || billData.bill_number) {
            // Single bill
            const normalizedBill = this.normalizeBillData(billData);
            bills.push(normalizedBill);
          }

        } catch (error: any) {
          console.warn(`⚠️ Could not process bill file ${file}: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.error('❌ Error reading bill files:', error.message);
      throw error;
    }

    return bills;
  }

  /**
   * Import legislators from LegiScan JSON files
   */
  private async importLegislators(): Promise<any[]> {
    const legislators: any[] = [];

    try {
      // Look for people/legislator JSON files
      const files = fs.readdirSync(this.uploadsDir);
      const legislatorFiles = files.filter(file => 
        (file.toLowerCase().includes('people') || 
         file.toLowerCase().includes('legislator') ||
         file.toLowerCase().includes('member')) && 
        file.toLowerCase().endsWith('.json')
      );

      console.log(`👥 Found ${legislatorFiles.length} legislator files to import`);

      for (const file of legislatorFiles) {
        try {
          const filePath = path.join(this.uploadsDir, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const jsonData = JSON.parse(data);

          // Handle different LegiScan JSON structures
          const peopleData = jsonData.people || jsonData.legislators || jsonData;

          if (Array.isArray(peopleData)) {
            for (const person of peopleData) {
              const normalizedLegislator = this.normalizeLegislatorData(person);
              legislators.push(normalizedLegislator);
            }
          } else if (peopleData.people_id || peopleData.name) {
            const normalizedLegislator = this.normalizeLegislatorData(peopleData);
            legislators.push(normalizedLegislator);
          }

        } catch (error: any) {
          console.warn(`⚠️ Could not process legislator file ${file}: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.error('❌ Error reading legislator files:', error.message);
      throw error;
    }

    return legislators;
  }

  /**
   * Normalize LegiScan bill data for Act Up platform
   */
  private normalizeBillData(bill: any): any {
    return {
      id: bill.bill_id || `bill_${Date.now()}`,
      identifier: bill.bill_number || 'Unknown',
      title: bill.title || bill.description || 'No title available',
      description: bill.description || bill.title || '',
      chamber: this.determineChamber(bill.bill_number || ''),
      status: bill.status || 'Unknown',
      statusDate: bill.status_date || bill.last_action_date || new Date().toISOString(),
      session: bill.session || '89th Legislature',
      state: 'Texas',
      url: bill.url || '',
      sponsors: this.normalizeSponsors(bill.sponsors || []),
      subjects: bill.subjects || [],
      committee: bill.committee || '',
      lastAction: bill.last_action || 'Filed',
      lastActionDate: bill.last_action_date || new Date().toISOString().split('T')[0],
      texts: bill.texts || [],
      votes: bill.votes || [],
      history: bill.history || [],
      amendments: bill.amendments || [],
      calendar: bill.calendar || [],
      source: 'LegiScan',
      importedAt: new Date().toISOString()
    };
  }

  /**
   * Normalize LegiScan legislator data for Act Up platform
   */
  private normalizeLegislatorData(person: any): any {
    return {
      id: person.people_id || `legislator_${Date.now()}`,
      name: person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      firstName: person.first_name || '',
      lastName: person.last_name || '',
      party: person.party || 'Unknown',
      district: person.district || 'Unknown',
      chamber: this.determineLegislatorChamber(person.role || ''),
      role: person.role || 'Member',
      state: 'Texas',
      votesmartId: person.votesmart_id || '',
      openSecretsId: person.opensecrets_id || '',
      ballotpedia: person.ballotpedia || '',
      ftmEid: person.ftm_eid || '',
      knowWhoPid: person.knowwho_pid || '',
      source: 'LegiScan',
      importedAt: new Date().toISOString()
    };
  }

  /**
   * Determine chamber from bill number
   */
  private determineChamber(billNumber: string): string {
    if (billNumber.toUpperCase().startsWith('H')) return 'House';
    if (billNumber.toUpperCase().startsWith('S')) return 'Senate';
    return 'Unknown';
  }

  /**
   * Determine legislator chamber from role
   */
  private determineLegislatorChamber(role: string): string {
    if (role.toLowerCase().includes('rep') || role.toLowerCase().includes('house')) return 'House';
    if (role.toLowerCase().includes('sen') || role.toLowerCase().includes('senate')) return 'Senate';
    return 'Unknown';
  }

  /**
   * Normalize sponsors data
   */
  private normalizeSponsors(sponsors: any[]): any[] {
    return sponsors.map(sponsor => ({
      id: sponsor.people_id || '',
      name: sponsor.name || `${sponsor.first_name || ''} ${sponsor.last_name || ''}`.trim(),
      party: sponsor.party || 'Unknown',
      role: sponsor.role || 'Sponsor'
    }));
  }

  /**
   * Process uploaded file and move to uploads directory
   */
  async processUploadedFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = path.join(this.uploadsDir, fileName);
    
    fs.writeFileSync(filePath, file.buffer);
    
    console.log(`📁 Saved uploaded file: ${fileName}`);
    return filePath;
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{
    totalFiles: number;
    billFiles: number;
    legislatorFiles: number;
    lastImport: string | null;
  }> {
    try {
      if (!fs.existsSync(this.uploadsDir)) {
        return { totalFiles: 0, billFiles: 0, legislatorFiles: 0, lastImport: null };
      }

      const files = fs.readdirSync(this.uploadsDir);
      const billFiles = files.filter(file => 
        file.toLowerCase().includes('bill') && file.toLowerCase().endsWith('.json')
      );
      const legislatorFiles = files.filter(file => 
        (file.toLowerCase().includes('people') || 
         file.toLowerCase().includes('legislator')) && 
        file.toLowerCase().endsWith('.json')
      );

      // Get last modified file for last import date
      let lastImport: string | null = null;
      if (files.length > 0) {
        const stats = files.map(file => {
          const stat = fs.statSync(path.join(this.uploadsDir, file));
          return stat.mtime;
        });
        lastImport = Math.max(...stats.map(date => date.getTime())).toString();
      }

      return {
        totalFiles: files.length,
        billFiles: billFiles.length,
        legislatorFiles: legislatorFiles.length,
        lastImport
      };

    } catch (error: any) {
      console.error('❌ Error getting import stats:', error.message);
      return { totalFiles: 0, billFiles: 0, legislatorFiles: 0, lastImport: null };
    }
  }
}

export const legiScanDataImporter = new LegiScanDataImporter();

console.log('📋 LegiScan Data Importer initialized');