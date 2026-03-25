/**
 * Scout Bot Card Publisher Service
 * 
 * Publishes approved profiles to a live database of character cards
 * that can be displayed and used in the application
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Define directories and files
const DATA_DIR = path.join(__dirname, '../../../data');
const APPROVED_FILE = path.join(DATA_DIR, 'approved_profiles.json');
const LIVE_PROFILES_FILE = path.join(DATA_DIR, 'live_profiles.json');

/**
 * Ensure data directory and files exist
 */
function ensureFilesExist() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Create approved profiles file if it doesn't exist
  if (!fs.existsSync(APPROVED_FILE)) {
    fs.writeFileSync(APPROVED_FILE, JSON.stringify([], null, 2));
  }
  
  // Create live profiles file if it doesn't exist
  if (!fs.existsSync(LIVE_PROFILES_FILE)) {
    fs.writeFileSync(LIVE_PROFILES_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Get all approved profiles
 */
function getApprovedProfiles() {
  ensureFilesExist();
  
  try {
    const raw = fs.readFileSync(APPROVED_FILE);
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading approved profiles:', error);
    return [];
  }
}

/**
 * Get all live profiles
 */
function getLiveProfiles() {
  ensureFilesExist();
  
  try {
    const raw = fs.readFileSync(LIVE_PROFILES_FILE);
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading live profiles:', error);
    return [];
  }
}

/**
 * Save approved profiles to file
 */
function saveApprovedProfiles(profiles) {
  ensureFilesExist();
  
  try {
    fs.writeFileSync(APPROVED_FILE, JSON.stringify(profiles, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving approved profiles:', error);
    return false;
  }
}

/**
 * Save live profiles to file
 */
function saveLiveProfiles(profiles) {
  ensureFilesExist();
  
  try {
    fs.writeFileSync(LIVE_PROFILES_FILE, JSON.stringify(profiles, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving live profiles:', error);
    return false;
  }
}

/**
 * Enrich profile with additional data before publishing
 */
function enrichProfile(profile) {
  return {
    ...profile,
    influence_topics: profile.influence_topics || [],
    transparency_score: Math.floor(Math.random() * 100), // This would actually be calculated
    flag_count: 0,
    published_at: new Date().toISOString()
  };
}

/**
 * Publish a profile to live database
 */
function publishProfile(id) {
  if (!id) {
    return { error: "Profile ID is required" };
  }
  
  // Get profiles
  const approvedProfiles = getApprovedProfiles();
  const liveProfiles = getLiveProfiles();
  
  // Find the profile in approved queue
  const profileIndex = approvedProfiles.findIndex(p => p.id === id);
  
  if (profileIndex === -1) {
    return { error: "Profile not found in approved queue" };
  }
  
  // Check if already published
  const existingPublished = liveProfiles.find(p => p.id === id);
  if (existingPublished) {
    return { error: "Profile already published" };
  }
  
  // Enrich and add to live profiles
  const profile = enrichProfile(approvedProfiles[profileIndex]);
  liveProfiles.push(profile);
  
  // Remove from approved queue
  approvedProfiles.splice(profileIndex, 1);
  
  // Save changes
  const approvedSaved = saveApprovedProfiles(approvedProfiles);
  const liveSaved = saveLiveProfiles(liveProfiles);
  
  if (!approvedSaved || !liveSaved) {
    return { error: "Error saving changes" };
  }
  
  return { success: true, profile };
}

/**
 * Publish all approved profiles
 */
function publishAllProfiles() {
  // Get profiles
  const approvedProfiles = getApprovedProfiles();
  const liveProfiles = getLiveProfiles();
  
  if (approvedProfiles.length === 0) {
    return { message: "No approved profiles to publish" };
  }
  
  // Get IDs of existing published profiles
  const publishedIds = liveProfiles.map(p => p.id);
  
  // Filter out already published profiles
  const profilesToPublish = approvedProfiles.filter(p => !publishedIds.includes(p.id));
  
  if (profilesToPublish.length === 0) {
    return { message: "All approved profiles already published" };
  }
  
  // Enrich and add to live profiles
  const enrichedProfiles = profilesToPublish.map(enrichProfile);
  const newLiveProfiles = [...liveProfiles, ...enrichedProfiles];
  
  // Remove from approved queue
  const newApprovedProfiles = approvedProfiles.filter(p => !profilesToPublish.map(tp => tp.id).includes(p.id));
  
  // Save changes
  const approvedSaved = saveApprovedProfiles(newApprovedProfiles);
  const liveSaved = saveLiveProfiles(newLiveProfiles);
  
  if (!approvedSaved || !liveSaved) {
    return { error: "Error saving changes" };
  }
  
  return { 
    success: true, 
    message: `Published ${profilesToPublish.length} profiles`,
    published: profilesToPublish
  };
}

module.exports = {
  getApprovedProfiles,
  getLiveProfiles,
  publishProfile,
  publishAllProfiles
};