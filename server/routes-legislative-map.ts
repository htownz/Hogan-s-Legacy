// @ts-nocheck
/**
 * Legislative Map Visualization API Routes
 * Provides geographic data for Texas elected officials and bill authorship
 */

import { Router } from "express";
import { storage } from "./storage";
import { createLogger } from "./logger";
const log = createLogger("routes-legislative-map");


const router = Router();

/**
 * GET /api/legislative-map-data
 * Get comprehensive map data for Texas legislators and bills
 */
router.get("/legislative-map-data", async (req, res) => {
  try {
    log.info("Fetching legislative map data...");

    // Get all Texas legislators with geographic data
    const legislators = await storage.getAllLegislators();
    
    // Get all bills for authorship mapping
    const bills = await storage.getAllBills();

    // Process legislators with geographic coordinates and bill counts
    const legislatorsWithMapData = legislators.map(legislator => {
      // Count bills authored by this legislator
      const authoredBills = bills.filter(bill => 
        bill.sponsors && bill.sponsors.toLowerCase().includes(legislator.name.toLowerCase())
      );

      // Add geographic coordinates based on district/location
      const coordinates = getDistrictCoordinates(legislator.district, legislator.chamber);

      return {
        ...legislator,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        billCount: authoredBills.length,
        bills: authoredBills.slice(0, 5), // Include recent bills for popup display
        city: extractCityFromDistrict(legislator.district),
        county: extractCountyFromDistrict(legislator.district)
      };
    });

    // Filter to only include legislators with valid coordinates
    const mappableLegislators = legislatorsWithMapData.filter(leg => 
      leg.latitude && leg.longitude
    );

    // Generate district boundary data
    const districts = generateDistrictData(mappableLegislators);

    const mapData = {
      legislators: mappableLegislators,
      bills: bills,
      districts: districts,
      summary: {
        totalLegislators: mappableLegislators.length,
        totalBills: bills.length,
        houseMemberCount: mappableLegislators.filter(l => l.chamber === 'House').length,
        senateMemberCount: mappableLegislators.filter(l => l.chamber === 'Senate').length,
        republicanCount: mappableLegislators.filter(l => l.party === 'Republican').length,
        democraticCount: mappableLegislators.filter(l => l.party === 'Democratic').length
      }
    };

    log.info(`Map data prepared: ${mappableLegislators.length} legislators with coordinates`);
    res.json(mapData);

  } catch (error: any) {
    log.error({ err: error }, "Error fetching legislative map data");
    res.status(500).json({ 
      error: "Failed to fetch legislative map data",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/legislative-map-data/district/:chamber/:number
 * Get detailed district information
 */
router.get("/legislative-map-data/district/:chamber/:number", async (req, res) => {
  try {
    const { chamber, number } = req.params;
    
    const legislators = await storage.getAllLegislators();
    const bills = await storage.getAllBills();

    // Find legislator for this district
    const districtLegislator = legislators.find(leg => 
      leg.chamber.toLowerCase() === chamber.toLowerCase() && 
      leg.district === number
    );

    if (!districtLegislator) {
      return res.status(404).json({ error: "District not found" });
    }

    // Get bills authored by this legislator
    const authoredBills = bills.filter(bill => 
      bill.sponsors && bill.sponsors.toLowerCase().includes(districtLegislator.name.toLowerCase())
    );

    const districtData = {
      legislator: districtLegislator,
      bills: authoredBills,
      coordinates: getDistrictCoordinates(number, chamber),
      demographics: getDistrictDemographics(number, chamber),
      boundaries: getDistrictBoundaries(number, chamber)
    };

    res.json(districtData);

  } catch (error: any) {
    log.error({ err: error }, "Error fetching district data");
    res.status(500).json({ 
      error: "Failed to fetch district data",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/legislative-map-data/activity-heatmap
 * Get legislative activity data for heatmap visualization
 */
router.get("/legislative-map-data/activity-heatmap", async (req, res) => {
  try {
    const legislators = await storage.getAllLegislators();
    const bills = await storage.getAllBills();

    const activityData = legislators.map(legislator => {
      const authoredBills = bills.filter(bill => 
        bill.sponsors && bill.sponsors.toLowerCase().includes(legislator.name.toLowerCase())
      );

      const coordinates = getDistrictCoordinates(legislator.district, legislator.chamber);

      return {
        legislatorId: legislator.id,
        name: legislator.name,
        district: legislator.district,
        chamber: legislator.chamber,
        party: legislator.party,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        billCount: authoredBills.length,
        activityLevel: categorizeActivity(authoredBills.length),
        recentBills: authoredBills
          .sort((a, b) => new Date(b.introducedAt).getTime() - new Date(a.introducedAt).getTime())
          .slice(0, 3)
      };
    }).filter(data => data.latitude && data.longitude);

    res.json({ 
      activityData,
      stats: {
        highActivity: activityData.filter(d => d.activityLevel === 'high').length,
        mediumActivity: activityData.filter(d => d.activityLevel === 'medium').length,
        lowActivity: activityData.filter(d => d.activityLevel === 'low').length,
        noActivity: activityData.filter(d => d.activityLevel === 'none').length
      }
    });

  } catch (error: any) {
    log.error({ err: error }, "Error generating activity heatmap");
    res.status(500).json({ 
      error: "Failed to generate activity heatmap",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Helper Functions for Geographic Data Processing
 */

// Get approximate coordinates for Texas legislative districts
function getDistrictCoordinates(district: string, chamber: string): { latitude: number | null, longitude: number | null } {
  // This uses representative coordinates for Texas legislative districts
  // In production, you would use actual district boundary data
  
  const districtNum = parseInt(district);
  
  if (chamber.toLowerCase() === 'house') {
    // Texas House districts - approximate coordinates
    const houseCoordinates: { [key: number]: [number, number] } = {
      1: [33.5581, -101.8552], // Lubbock area
      2: [31.7619, -106.4850], // El Paso
      3: [32.7767, -96.7970],  // Dallas
      4: [32.3513, -95.3011],  // Tyler
      5: [30.2672, -97.7431],  // Austin
      10: [29.7604, -95.3698], // Houston
      15: [26.2034, -98.2300], // McAllen
      20: [29.4241, -98.4936], // San Antonio
      25: [31.3199, -92.4426], // Shreveport area
      30: [32.7767, -96.7970], // Dallas
      35: [30.2672, -97.7431], // Austin
      40: [29.7604, -95.3698], // Houston
      45: [29.4241, -98.4936], // San Antonio
      50: [32.7767, -96.7970], // Dallas
      // Add more as needed - this is a sample
    };
    
    if (houseCoordinates[districtNum]) {
      return { 
        latitude: houseCoordinates[districtNum][0], 
        longitude: houseCoordinates[districtNum][1] 
      };
    }
  } else if (chamber.toLowerCase() === 'senate') {
    // Texas Senate districts - approximate coordinates
    const senateCoordinates: { [key: number]: [number, number] } = {
      1: [33.5581, -101.8552], // West Texas
      2: [31.7619, -106.4850], // El Paso
      3: [32.7767, -96.7970],  // Dallas
      4: [32.3513, -95.3011],  // East Texas
      5: [30.2672, -97.7431],  // Austin
      6: [29.7604, -95.3698],  // Houston
      7: [29.4241, -98.4936],  // San Antonio
      8: [32.7767, -96.7970],  // Dallas
      9: [29.7604, -95.3698],  // Houston
      10: [29.7604, -95.3698], // Houston
      // Add more as needed
    };
    
    if (senateCoordinates[districtNum]) {
      return { 
        latitude: senateCoordinates[districtNum][0], 
        longitude: senateCoordinates[districtNum][1] 
      };
    }
  }
  
  // Fallback to general Texas coordinates
  return { latitude: 31.0, longitude: -100.0 };
}

// Extract city information from district data
function extractCityFromDistrict(district: string): string {
  const districtNum = parseInt(district);
  
  // Major city mapping for Texas districts
  const cityMapping: { [key: string]: string } = {
    // House districts
    "1": "Lubbock",
    "2": "El Paso", 
    "3": "Dallas",
    "4": "Tyler",
    "5": "Austin",
    "10": "Houston",
    "15": "McAllen",
    "20": "San Antonio",
    // Senate districts  
    "s1": "Lubbock",
    "s2": "El Paso",
    "s3": "Dallas",
    "s5": "Austin",
    "s6": "Houston",
    "s7": "San Antonio"
  };
  
  return cityMapping[district] || cityMapping[`s${district}`] || "Texas";
}

// Extract county information
function extractCountyFromDistrict(district: string): string {
  const districtNum = parseInt(district);
  
  const countyMapping: { [key: string]: string } = {
    "1": "Lubbock County",
    "2": "El Paso County",
    "3": "Dallas County", 
    "4": "Smith County",
    "5": "Travis County",
    "10": "Harris County",
    "15": "Hidalgo County",
    "20": "Bexar County"
  };
  
  return countyMapping[district] || "Texas County";
}

// Generate district boundary data for mapping
function generateDistrictData(legislators: any[]): any[] {
  return legislators.map(leg => ({
    id: `${leg.chamber}-${leg.district}`,
    chamber: leg.chamber,
    district: leg.district,
    legislator: leg.name,
    party: leg.party,
    center: {
      latitude: leg.latitude,
      longitude: leg.longitude
    },
    billCount: leg.billCount
  }));
}

// Get district demographics (placeholder for actual demographic data)
function getDistrictDemographics(district: string, chamber: string) {
  return {
    population: Math.floor(Math.random() * 200000) + 100000,
    medianAge: Math.floor(Math.random() * 20) + 30,
    medianIncome: Math.floor(Math.random() * 50000) + 40000,
    urbanRural: Math.random() > 0.5 ? 'Urban' : 'Rural'
  };
}

// Get district boundaries (placeholder for actual boundary data)
function getDistrictBoundaries(district: string, chamber: string) {
  return {
    type: "Polygon",
    coordinates: [[
      // Placeholder boundary coordinates
      [-100.0, 31.0],
      [-99.5, 31.0], 
      [-99.5, 31.5],
      [-100.0, 31.5],
      [-100.0, 31.0]
    ]]
  };
}

// Categorize legislative activity level
function categorizeActivity(billCount: number): 'high' | 'medium' | 'low' | 'none' {
  if (billCount === 0) return 'none';
  if (billCount >= 10) return 'high';
  if (billCount >= 5) return 'medium';
  return 'low';
}

export default router;