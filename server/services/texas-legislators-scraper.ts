// @ts-nocheck
import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from '../storage';

interface TexasLegislatorProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  party: string;
  chamber: 'House' | 'Senate';
  district: string;
  email?: string;
  phone?: string;
  office?: string;
  counties?: string[];
  committees?: string[];
  leadership?: string;
  biography?: string;
  websiteUrl?: string;
  profileImageUrl?: string;
  term?: string;
  firstElected?: string;
}

export class TexasLegislatorsScraper {
  private baseUrl = 'https://house.texas.gov';
  private senateUrl = 'https://senate.texas.gov';
  
  constructor() {
    console.log('👥 Texas Legislators scraper initialized');
  }

  /**
   * Scrape all Texas state representatives and senators
   */
  async scrapeAllLegislators(): Promise<TexasLegislatorProfile[]> {
    try {
      console.log('🏛️ Starting comprehensive Texas legislators data collection...');
      
      const legislators: TexasLegislatorProfile[] = [];
      
      // Scrape House Representatives
      console.log('🏠 Scraping Texas House Representatives...');
      const houseMembers = await this.scrapeHouseRepresentatives();
      legislators.push(...houseMembers);
      
      // Scrape Senate Members
      console.log('🏛️ Scraping Texas Senate Members...');
      const senateMembers = await this.scrapeSenateMembers();
      legislators.push(...senateMembers);
      
      console.log(`✅ Successfully collected ${legislators.length} Texas legislators`);
      return legislators;
      
    } catch (error: any) {
      console.error('❌ Error scraping Texas legislators:', error);
      throw new Error('Failed to scrape Texas legislators data');
    }
  }

  /**
   * Scrape Texas House Representatives
   */
  private async scrapeHouseRepresentatives(): Promise<TexasLegislatorProfile[]> {
    try {
      const members: TexasLegislatorProfile[] = [];
      const membersUrl = `${this.baseUrl}/members`;
      
      console.log(`📜 Fetching House members from: ${membersUrl}`);
      
      const response = await axios.get(membersUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      
      // Look for member directories/listings
      const memberSelectors = [
        '.member-card',
        '.member-listing',
        '.representative-card',
        '.legislator-card',
        'div[class*="member"]',
        'div[class*="representative"]'
      ];
      
      let memberElements = $();
      for (const selector of memberSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          memberElements = elements;
          console.log(`Found ${elements.length} House members using selector: ${selector}`);
          break;
        }
      }
      
      // If no structured member cards found, look for member links
      if (memberElements.length === 0) {
        const memberLinks = $('a[href*="/members/"], a[href*="/representative/"], a[href*="district"]');
        console.log(`Found ${memberLinks.length} House member links`);
        
        for (let i = 0; i < Math.min(memberLinks.length, 150); i++) {
          const link = memberLinks.eq(i);
          const href = link.attr('href');
          const name = this.cleanText(link.text());
          
          if (href && name && name.length > 2) {
            try {
              const memberData = await this.scrapeIndividualHouseMember(href, name);
              if (memberData) {
                members.push(memberData);
                console.log(`📋 Scraped House Rep: ${memberData.name} (District ${memberData.district})`);
              }
              
              // Add delay between requests
              await this.delay(300);
              
            } catch (error: any) {
              console.log(`⚠️ Could not scrape House member ${name}: ${error}`);
            }
          }
        }
      } else {
        // Process structured member cards
        for (let i = 0; i < Math.min(memberElements.length, 150); i++) {
          const element = memberElements.eq(i);
          
          try {
            const memberData = await this.extractHouseMemberFromCard(element, $);
            if (memberData) {
              members.push(memberData);
              console.log(`📋 Extracted House Rep: ${memberData.name} (District ${memberData.district})`);
            }
          } catch (error: any) {
            console.log(`⚠️ Could not extract House member ${i}: ${error}`);
          }
        }
      }
      
      console.log(`🏠 Collected ${members.length} House Representatives`);
      return members;
      
    } catch (error: any) {
      console.error('❌ Error scraping House representatives:', error);
      return [];
    }
  }

  /**
   * Scrape individual House member details
   */
  private async scrapeIndividualHouseMember(href: string, name: string): Promise<TexasLegislatorProfile | null> {
    try {
      const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
      
      const response = await axios.get(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract member details
      const district = this.extractDistrict($, name);
      const party = this.extractParty($);
      const email = this.extractEmail($);
      const phone = this.extractPhone($);
      const office = this.extractOffice($);
      const counties = this.extractCounties($);
      const committees = this.extractCommittees($);
      const leadership = this.extractLeadership($);
      const biography = this.extractBiography($);
      const profileImageUrl = this.extractProfileImage($, this.baseUrl);
      
      const nameParts = this.parseFullName(name);
      
      return {
        id: `house-${district}`,
        name: name.trim(),
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        party: party || 'Unknown',
        chamber: 'House',
        district: district || '0',
        email,
        phone,
        office,
        counties,
        committees,
        leadership,
        biography,
        websiteUrl: fullUrl,
        profileImageUrl
      };
      
    } catch (error: any) {
      console.log(`⚠️ Error scraping individual House member: ${error}`);
      return null;
    }
  }

  /**
   * Extract House member from card element
   */
  private extractHouseMemberFromCard(element: cheerio.Cheerio, $: cheerio.CheerioAPI): TexasLegislatorProfile | null {
    try {
      const name = this.cleanText(element.find('.name, .member-name, h3, h4, .title').first().text());
      const district = this.extractDistrictFromCard(element);
      const party = this.extractPartyFromCard(element);
      
      if (!name || name.length < 2) return null;
      
      const nameParts = this.parseFullName(name);
      
      return {
        id: `house-${district || '0'}`,
        name,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        party: party || 'Unknown',
        chamber: 'House',
        district: district || '0',
        websiteUrl: this.baseUrl
      };
      
    } catch (error: any) {
      console.log(`⚠️ Error extracting House member from card: ${error}`);
      return null;
    }
  }

  /**
   * Scrape Texas Senate Members
   */
  private async scrapeSenateMembers(): Promise<TexasLegislatorProfile[]> {
    try {
      const members: TexasLegislatorProfile[] = [];
      const membersUrl = `${this.senateUrl}/members`;
      
      console.log(`📜 Fetching Senate members from: ${membersUrl}`);
      
      const response = await axios.get(membersUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      
      // Look for Senate member links or cards
      const memberLinks = $('a[href*="/member/"], a[href*="/senator/"], a[href*="district"]');
      console.log(`Found ${memberLinks.length} Senate member links`);
      
      for (let i = 0; i < Math.min(memberLinks.length, 31); i++) { // Texas has 31 Senate districts
        const link = memberLinks.eq(i);
        const href = link.attr('href');
        const name = this.cleanText(link.text());
        
        if (href && name && name.length > 2) {
          try {
            const memberData = await this.scrapeIndividualSenateMember(href, name);
            if (memberData) {
              members.push(memberData);
              console.log(`📋 Scraped Senator: ${memberData.name} (District ${memberData.district})`);
            }
            
            // Add delay between requests
            await this.delay(300);
            
          } catch (error: any) {
            console.log(`⚠️ Could not scrape Senator ${name}: ${error}`);
          }
        }
      }
      
      console.log(`🏛️ Collected ${members.length} Senate Members`);
      return members;
      
    } catch (error: any) {
      console.error('❌ Error scraping Senate members:', error);
      return [];
    }
  }

  /**
   * Scrape individual Senate member details
   */
  private async scrapeIndividualSenateMember(href: string, name: string): Promise<TexasLegislatorProfile | null> {
    try {
      const fullUrl = href.startsWith('http') ? href : `${this.senateUrl}${href}`;
      
      const response = await axios.get(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract member details
      const district = this.extractDistrict($, name);
      const party = this.extractParty($);
      const email = this.extractEmail($);
      const phone = this.extractPhone($);
      const office = this.extractOffice($);
      const counties = this.extractCounties($);
      const committees = this.extractCommittees($);
      const leadership = this.extractLeadership($);
      const biography = this.extractBiography($);
      const profileImageUrl = this.extractProfileImage($, this.senateUrl);
      
      const nameParts = this.parseFullName(name);
      
      return {
        id: `senate-${district}`,
        name: name.trim(),
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        party: party || 'Unknown',
        chamber: 'Senate',
        district: district || '0',
        email,
        phone,
        office,
        counties,
        committees,
        leadership,
        biography,
        websiteUrl: fullUrl,
        profileImageUrl
      };
      
    } catch (error: any) {
      console.log(`⚠️ Error scraping individual Senate member: ${error}`);
      return null;
    }
  }

  /**
   * Extract district information
   */
  private extractDistrict($: cheerio.CheerioAPI, name: string): string {
    const districtSelectors = [
      '.district',
      '.district-number',
      '[class*="district"]',
      'span:contains("District")',
      'div:contains("District")'
    ];
    
    for (const selector of districtSelectors) {
      const districtText = this.cleanText($(selector).text());
      const districtMatch = districtText.match(/district\s*(\d+)/i);
      if (districtMatch) {
        return districtMatch[1];
      }
    }
    
    // Try to extract from name or URL
    const nameMatch = name.match(/district\s*(\d+)/i);
    if (nameMatch) return nameMatch[1];
    
    // Try from page URL
    const urlMatch = window.location?.href?.match(/district[^\d]*(\d+)/i);
    if (urlMatch) return urlMatch[1];
    
    return '0';
  }

  /**
   * Extract party affiliation
   */
  private extractParty($: cheerio.CheerioAPI): string {
    const partySelectors = [
      '.party',
      '.political-party',
      '[class*="party"]',
      'span:contains("Republican")',
      'span:contains("Democrat")',
      'div:contains("Republican")',
      'div:contains("Democrat")'
    ];
    
    for (const selector of partySelectors) {
      const partyText = this.cleanText($(selector).text().toLowerCase());
      if (partyText.includes('republican') || partyText.includes('gop')) return 'Republican';
      if (partyText.includes('democrat') || partyText.includes('democratic')) return 'Democrat';
    }
    
    // Check page content for party indicators
    const pageText = $.html().toLowerCase();
    if (pageText.includes('republican')) return 'Republican';
    if (pageText.includes('democrat')) return 'Democrat';
    
    return 'Unknown';
  }

  /**
   * Extract email address
   */
  private extractEmail($: cheerio.CheerioAPI): string | undefined {
    const emailSelectors = [
      'a[href^="mailto:"]',
      '.email',
      '.contact-email',
      '[class*="email"]'
    ];
    
    for (const selector of emailSelectors) {
      const emailElement = $(selector).first();
      const email = emailElement.attr('href')?.replace('mailto:', '') || emailElement.text();
      if (email && email.includes('@')) {
        return this.cleanText(email);
      }
    }
    
    return undefined;
  }

  /**
   * Extract phone number
   */
  private extractPhone($: cheerio.CheerioAPI): string | undefined {
    const phoneSelectors = [
      '.phone',
      '.contact-phone',
      '.telephone',
      '[class*="phone"]',
      'a[href^="tel:"]'
    ];
    
    for (const selector of phoneSelectors) {
      const phoneElement = $(selector).first();
      const phone = phoneElement.attr('href')?.replace('tel:', '') || phoneElement.text();
      const cleanPhone = phone?.replace(/[^\d\-\(\)\s]/g, '');
      if (cleanPhone && cleanPhone.length >= 10) {
        return cleanPhone.trim();
      }
    }
    
    return undefined;
  }

  /**
   * Extract office information
   */
  private extractOffice($: cheerio.CheerioAPI): string | undefined {
    const officeSelectors = [
      '.office',
      '.room',
      '.location',
      '[class*="office"]',
      'div:contains("Room")',
      'span:contains("Room")'
    ];
    
    for (const selector of officeSelectors) {
      const officeText = this.cleanText($(selector).text());
      if (officeText && officeText.length > 2) {
        return officeText;
      }
    }
    
    return undefined;
  }

  /**
   * Extract counties served
   */
  private extractCounties($: cheerio.CheerioAPI): string[] {
    const counties: string[] = [];
    const countySelectors = [
      '.counties',
      '.counties-served',
      '.district-counties',
      '[class*="counties"]',
      'div:contains("Counties")',
      'div:contains("County")'
    ];
    
    for (const selector of countySelectors) {
      const countiesText = this.cleanText($(selector).text());
      if (countiesText.includes('County') || countiesText.includes('Counties')) {
        const matches = countiesText.match(/([A-Z][a-z]+)\s+County/g);
        if (matches) {
          counties.push(...matches.map(m => m.replace(' County', '')));
        }
      }
    }
    
    return [...new Set(counties)]; // Remove duplicates
  }

  /**
   * Extract committee memberships
   */
  private extractCommittees($: cheerio.CheerioAPI): string[] {
    const committees: string[] = [];
    const committeeSelectors = [
      '.committees',
      '.committee-list',
      '.committee-membership',
      '[class*="committee"]',
      'div:contains("Committee")',
      'ul li:contains("Committee")'
    ];
    
    for (const selector of committeeSelectors) {
      $(selector).each((i, el) => {
        const committeeText = this.cleanText($(el).text());
        if (committeeText.includes('Committee') && committeeText.length < 100) {
          committees.push(committeeText);
        }
      });
    }
    
    return [...new Set(committees)]; // Remove duplicates
  }

  /**
   * Extract leadership positions
   */
  private extractLeadership($: cheerio.CheerioAPI): string | undefined {
    const leadershipSelectors = [
      '.leadership',
      '.position',
      '.title',
      '[class*="leadership"]',
      'div:contains("Speaker")',
      'div:contains("Chair")',
      'div:contains("Vice Chair")',
      'div:contains("Lieutenant")'
    ];
    
    for (const selector of leadershipSelectors) {
      const leadershipText = this.cleanText($(selector).text());
      const leadershipTerms = ['speaker', 'chair', 'vice', 'lieutenant', 'president', 'majority', 'minority'];
      
      if (leadershipTerms.some(term => leadershipText.toLowerCase().includes(term))) {
        return leadershipText;
      }
    }
    
    return undefined;
  }

  /**
   * Extract biography
   */
  private extractBiography($: cheerio.CheerioAPI): string | undefined {
    const bioSelectors = [
      '.biography',
      '.bio',
      '.about',
      '.profile',
      '[class*="biography"]',
      '[class*="bio"]'
    ];
    
    for (const selector of bioSelectors) {
      const bioText = this.cleanText($(selector).text());
      if (bioText && bioText.length > 50) {
        return bioText.substring(0, 500); // Limit biography length
      }
    }
    
    return undefined;
  }

  /**
   * Extract profile image URL
   */
  private extractProfileImage($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
    const imageSelectors = [
      '.profile-image img',
      '.member-photo img',
      '.headshot img',
      '.portrait img',
      'img[alt*="photo"]',
      'img[alt*="headshot"]',
      'img[src*="member"]',
      'img[src*="photo"]'
    ];
    
    for (const selector of imageSelectors) {
      const imgSrc = $(selector).first().attr('src');
      if (imgSrc) {
        return imgSrc.startsWith('http') ? imgSrc : `${baseUrl}${imgSrc}`;
      }
    }
    
    return undefined;
  }

  /**
   * Extract district from card element
   */
  private extractDistrictFromCard(element: cheerio.Cheerio): string {
    const districtText = this.cleanText(element.find('.district, .district-number, [class*="district"]').text());
    const districtMatch = districtText.match(/(\d+)/);
    return districtMatch ? districtMatch[1] : '0';
  }

  /**
   * Extract party from card element
   */
  private extractPartyFromCard(element: cheerio.Cheerio): string {
    const partyText = this.cleanText(element.find('.party, [class*="party"]').text().toLowerCase());
    if (partyText.includes('republican') || partyText.includes('gop')) return 'Republican';
    if (partyText.includes('democrat')) return 'Democrat';
    return 'Unknown';
  }

  /**
   * Parse full name into first and last name
   */
  private parseFullName(fullName: string): { firstName: string; lastName: string } {
    const nameParts = fullName.trim().split(/\s+/);
    
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: '' };
    } else if (nameParts.length === 2) {
      return { firstName: nameParts[0], lastName: nameParts[1] };
    } else {
      // Handle middle names, titles, etc.
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      return { firstName, lastName };
    }
  }

  /**
   * Clean and normalize text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .replace(/^[:\-\s]+/, '')
      .replace(/[:\-\s]+$/, '');
  }

  /**
   * Add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Store scraped legislators in the database
   */
  async storeScrapedLegislators(legislators: TexasLegislatorProfile[]): Promise<void> {
    try {
      console.log(`💾 Storing ${legislators.length} Texas legislators in database...`);
      
      for (const legislator of legislators) {
        try {
          // Store using existing legislator storage methods
          await storage.createLegislator({
            id: legislator.id,
            name: legislator.name,
            party: legislator.party,
            chamber: legislator.chamber,
            district: legislator.district,
            email: legislator.email || null,
            phone: legislator.phone || null,
            office: legislator.office || null,
            website: legislator.websiteUrl || null,
            imageUrl: legislator.profileImageUrl || null,
            bio: legislator.biography || null,
            firstElected: legislator.firstElected || null,
            lastUpdated: new Date(),
            createdAt: new Date()
          });
          
        } catch (error: any) {
          console.error(`❌ Error storing legislator ${legislator.name}:`, error);
        }
      }
      
      console.log(`✅ Successfully stored ${legislators.length} Texas legislators`);
      
    } catch (error: any) {
      console.error('❌ Error storing scraped legislators:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive legislators data collection
   */
  async performLegislatorsDataCollection(): Promise<TexasLegislatorProfile[]> {
    try {
      console.log('🚀 Starting comprehensive Texas legislators data collection...');
      
      const legislators = await this.scrapeAllLegislators();
      
      if (legislators.length > 0) {
        await this.storeScrapedLegislators(legislators);
      }
      
      console.log(`🎉 Legislators data collection completed! Collected ${legislators.length} profiles.`);
      return legislators;
      
    } catch (error: any) {
      console.error('❌ Legislators data collection failed:', error);
      throw error;
    }
  }
}

export const texasLegislatorsScraper = new TexasLegislatorsScraper();