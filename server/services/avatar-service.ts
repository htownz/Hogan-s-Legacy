// @ts-nocheck
import path from 'path';
import fs from 'fs';
import { generateImage } from './openai-service';
import { db } from '../db';
import { eq, isNull, and, or, sql } from 'drizzle-orm';
import { stateOfficials } from '@shared/schema-officials';
import type { StateOfficial } from '@shared/schema-officials';
import { createLogger } from "../logger";
const log = createLogger("avatar-service");


/**
 * Service to generate and manage cartoon avatars for state officials
 */
export class AvatarService {
  private avatarCacheDir: string = path.join(process.cwd(), 'public', 'avatars');
  private defaultSize: string = '1024x1024';
  
  /**
   * Constructor
   */
  constructor() {
    // Ensure avatar cache directory exists
    if (!fs.existsSync(this.avatarCacheDir)) {
      fs.mkdirSync(this.avatarCacheDir, { recursive: true });
    }
  }
  
  /**
   * Generate a cartoon avatar for an official based on their profile information
   */
  async generateCartoonAvatar(official: StateOfficial): Promise<string | null> {
    try {
      // Create a detailed prompt
      const prompt = this.createAvatarPrompt(official);
      
      // Generate image via OpenAI
      const imageUrl = await generateImage(prompt, this.defaultSize as '1024x1024');
      
      if (!imageUrl) {
        return null;
      }
      
      // Update the official's record with the new avatar URL
      await db.update(stateOfficials)
        .set({ 
          cartoonAvatarUrl: imageUrl,
          updatedAt: new Date()
        })
        .where(eq(stateOfficials.id, official.id));
      
      return imageUrl;
    } catch (error: any) {
      log.error({ err: error }, 'Error generating cartoon avatar');
      return null;
    }
  }
  
  /**
   * Create a detailed prompt for the cartoon avatar generation
   */
  private createAvatarPrompt(official: StateOfficial): string {
    // Format physical attributes for the prompt if available
    const genderInfo = official.gender ? `Gender: ${official.gender}.` : '';
    const ethnicityInfo = official.ethnicity ? `Ethnicity: ${official.ethnicity}.` : '';
    const ageInfo = official.approximateAge ? `Approximate age: ${official.approximateAge} years old.` : '';
    const ageRange = this.getAgeRangeFromBirthYear(official);
    const hairInfo = official.hairDescription ? `Hair: ${official.hairDescription}.` : '';
    const facialInfo = official.facialFeatures ? `Facial features: ${official.facialFeatures}.` : '';
    
    // Format political information for the prompt
    const partyInfo = official.party 
      ? `Political party: ${official.party.charAt(0).toUpperCase() + official.party.slice(1)}.`
      : '';
    
    const distinguishingInfo = official.distinguishingFeatures 
      ? `Distinguishing features: ${official.distinguishingFeatures}.`
      : '';
    
    // Combine all information into a detailed prompt
    return `
      Create a professional cartoon profile portrait of ${official.name}, a ${this.formatOfficialType(official.officialType)} from Texas.
      ${genderInfo} ${ethnicityInfo} ${ageInfo || ageRange} ${hairInfo} ${facialInfo} ${distinguishingInfo}
      ${partyInfo}
      
      Style: Professional but with a cartoon/illustrated style similar to a political caricature but not overly exaggerated.
      The portrait should be front-facing, showing just the head and shoulders (portrait style).
      Use a neutral background appropriate for a government/political figure.
      Ensure the illustration style is clean, professional, and would be appropriate for an official government website.
      
      Important: Do not include any text or watermarks in the image.
    `;
  }
  
  /**
   * Format the official type to be more readable
   */
  private formatOfficialType(type: string): string {
    const typeMap: Record<string, string> = {
      'senator': 'State Senator',
      'representative': 'State Representative',
      'governor': 'Governor',
      'lt_governor': 'Lieutenant Governor',
      'attorney_general': 'Attorney General',
      'comptroller': 'Comptroller',
      'land_commissioner': 'Land Commissioner',
      'agriculture_commissioner': 'Agriculture Commissioner',
      'railroad_commissioner': 'Railroad Commissioner',
      'supreme_court_justice': 'Supreme Court Justice',
      'appeals_court_judge': 'Appeals Court Judge',
      'secretary_of_state': 'Secretary of State'
    };
    
    return typeMap[type] || type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  /**
   * Try to determine an approximate age range if exact age is not provided
   */
  private getAgeRangeFromBirthYear(official: StateOfficial): string {
    // If we have an approximate age, use that
    if (official.approximateAge) {
      return `Approximate age: ${official.approximateAge} years old.`;
    }
    
    // If we have term data, try to infer an age range
    if (official.termStart) {
      const yearsInOffice = Math.floor(
        (new Date().getTime() - new Date(official.termStart).getTime()) / 
        (1000 * 60 * 60 * 24 * 365)
      );
      
      if (yearsInOffice > 20) {
        return 'Mature individual (likely over 55 years old).';
      } else if (yearsInOffice > 10) {
        return 'Middle-aged individual (likely between 40-55 years old).';
      } else {
        return 'Adult individual (likely between 30-50 years old).';
      }
    }
    
    // Default if we can't determine
    return 'Adult individual.';
  }
  
  /**
   * Generate cartoon avatars for all officials who don't have one yet
   */
  async generateMissingAvatars(): Promise<number> {
    try {
      // Find all officials without avatars
      const officialsWithoutAvatars = await db
        .select()
        .from(stateOfficials).$dynamic()
        .where(isNull(stateOfficials.cartoonAvatarUrl));
      
      if (!officialsWithoutAvatars.length) {
        log.info('No officials found without avatars');
        return 0;
      }
      
      log.info(`Found ${officialsWithoutAvatars.length} officials without avatars. Starting generation...`);
      
      let successCount = 0;
      
      // Process officials with a delay between each to avoid rate limits
      for (const official of officialsWithoutAvatars) {
        try {
          const avatarUrl = await this.generateCartoonAvatar(official);
          if (avatarUrl) {
            successCount++;
            log.info(`Generated avatar for ${official.name} (${successCount}/${officialsWithoutAvatars.length})`);
          } else {
            log.error(`Failed to generate avatar for ${official.name}`);
          }
          
          // Add a delay to avoid rate limits (1.5 seconds)
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (officialError: any) {
          log.error({ err: officialError }, `Error generating avatar for ${official.name}`);
        }
      }
      
      return successCount;
    } catch (error: any) {
      log.error({ err: error }, 'Error generating missing avatars');
      return 0;
    }
  }
  
  /**
   * Bulk update avatars by criteria (e.g., by party, type, etc.)
   */
  async regenerateAvatarsByFilter(filter: {
    party?: string;
    officialType?: string;
    officialStatus?: string;
  }): Promise<number> {
    try {
      let query = db.select().from(stateOfficials).$dynamic();
      const conditions = [];
      
      // Add filter conditions
      if (filter.party) {
        conditions.push(eq(stateOfficials.party, filter.party));
      }
      
      if (filter.officialType) {
        conditions.push(eq(stateOfficials.officialType, filter.officialType));
      }
      
      if (filter.officialStatus) {
        conditions.push(eq(stateOfficials.officialStatus, filter.officialStatus));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const officials = await query;
      
      if (!officials.length) {
        log.info('No officials found matching the filter criteria');
        return 0;
      }
      
      log.info(`Found ${officials.length} officials matching the filter criteria. Starting regeneration...`);
      
      let successCount = 0;
      
      // Process officials with a delay between each to avoid rate limits
      for (const official of officials) {
        try {
          const avatarUrl = await this.generateCartoonAvatar(official);
          if (avatarUrl) {
            successCount++;
            log.info(`Regenerated avatar for ${official.name} (${successCount}/${officials.length})`);
          } else {
            log.error(`Failed to regenerate avatar for ${official.name}`);
          }
          
          // Add a delay to avoid rate limits (1.5 seconds)
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (officialError: any) {
          log.error({ err: officialError }, `Error regenerating avatar for ${official.name}`);
        }
      }
      
      return successCount;
    } catch (error: any) {
      log.error({ err: error }, 'Error regenerating avatars by filter');
      return 0;
    }
  }
}

// Export an instance of the avatar service
export const avatarService = new AvatarService();