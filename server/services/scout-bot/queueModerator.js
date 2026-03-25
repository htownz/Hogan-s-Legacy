/**
 * Scout Bot Queue Moderator Service
 * 
 * Handles the moderation of pending profiles, allowing admin users
 * to approve or reject consultant and influencer profiles
 */

const fs = require('fs');
const path = require('path');

// Define directories and files
const DATA_DIR = path.join(__dirname, '../../../data');
const PENDING_FILE = path.join(DATA_DIR, 'pending_profiles.json');
const APPROVED_FILE = path.join(DATA_DIR, 'approved_profiles.json');
const REJECTED_FILE = path.join(DATA_DIR, 'rejected_profiles.json');

/**
 * Ensure data directory and files exist
 */
function ensureFilesExist() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Create pending profiles file if it doesn't exist
  if (!fs.existsSync(PENDING_FILE)) {
    fs.writeFileSync(PENDING_FILE, JSON.stringify([], null, 2));
  }
  
  // Create approved profiles file if it doesn't exist
  if (!fs.existsSync(APPROVED_FILE)) {
    fs.writeFileSync(APPROVED_FILE, JSON.stringify([], null, 2));
  }
  
  // Create rejected profiles file if it doesn't exist
  if (!fs.existsSync(REJECTED_FILE)) {
    fs.writeFileSync(REJECTED_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Get all pending profiles
 */
function getPendingProfiles() {
  ensureFilesExist();
  
  try {
    const raw = fs.readFileSync(PENDING_FILE);
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading pending profiles:', error);
    return [];
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
 * Get all rejected profiles
 */
function getRejectedProfiles() {
  ensureFilesExist();
  
  try {
    const raw = fs.readFileSync(REJECTED_FILE);
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading rejected profiles:', error);
    return [];
  }
}

/**
 * Save queue to file
 */
function savePendingProfiles(profiles) {
  ensureFilesExist();
  
  try {
    fs.writeFileSync(PENDING_FILE, JSON.stringify(profiles, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving pending profiles:', error);
    return false;
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
 * Save rejected profiles to file
 */
function saveRejectedProfiles(profiles) {
  ensureFilesExist();
  
  try {
    fs.writeFileSync(REJECTED_FILE, JSON.stringify(profiles, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving rejected profiles:', error);
    return false;
  }
}

/**
 * Approve a profile by ID
 */
function approveProfile(id) {
  if (!id) {
    return { error: "Profile ID is required" };
  }
  
  // Get profiles
  const pendingProfiles = getPendingProfiles();
  const approvedProfiles = getApprovedProfiles();
  
  // Find the profile in pending queue
  const profileIndex = pendingProfiles.findIndex(p => p.id === id);
  
  if (profileIndex === -1) {
    return { error: "Profile not found in pending queue" };
  }
  
  // Add to approved profiles
  const profile = { ...pendingProfiles[profileIndex] };
  profile.status = 'approved';
  profile.updated_at = new Date().toISOString();
  approvedProfiles.push(profile);
  
  // Remove from pending queue
  pendingProfiles.splice(profileIndex, 1);
  
  // Save changes
  const pendingSaved = savePendingProfiles(pendingProfiles);
  const approvedSaved = saveApprovedProfiles(approvedProfiles);
  
  if (!pendingSaved || !approvedSaved) {
    return { error: "Error saving changes" };
  }
  
  return { success: true, profile };
}

/**
 * Reject a profile by ID
 */
function rejectProfile(id) {
  if (!id) {
    return { error: "Profile ID is required" };
  }
  
  // Get profiles
  const pendingProfiles = getPendingProfiles();
  const rejectedProfiles = getRejectedProfiles();
  
  // Find the profile in pending queue
  const profileIndex = pendingProfiles.findIndex(p => p.id === id);
  
  if (profileIndex === -1) {
    return { error: "Profile not found in pending queue" };
  }
  
  // Add to rejected profiles
  const profile = { ...pendingProfiles[profileIndex] };
  profile.status = 'rejected';
  profile.updated_at = new Date().toISOString();
  rejectedProfiles.push(profile);
  
  // Remove from pending queue
  pendingProfiles.splice(profileIndex, 1);
  
  // Save changes
  const pendingSaved = savePendingProfiles(pendingProfiles);
  const rejectedSaved = saveRejectedProfiles(rejectedProfiles);
  
  if (!pendingSaved || !rejectedSaved) {
    return { error: "Error saving changes" };
  }
  
  return { success: true, profile };
}

module.exports = {
  getPendingProfiles,
  getApprovedProfiles,
  getRejectedProfiles,
  approveProfile,
  rejectProfile
};