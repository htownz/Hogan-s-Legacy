/**
 * Scout Bot Name Processor Service
 * 
 * This service is responsible for processing names of consultants and influencers,
 * checking for duplicates, and queuing them for further processing.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../../../data');
const PENDING_FILE = path.join(DATA_DIR, 'pending_profiles.json');

/**
 * Ensure data directory exists
 */
function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load the pending profiles queue from file
 */
function loadQueue() {
  ensureDataDirExists();
  
  if (!fs.existsSync(PENDING_FILE)) {
    // Initialize with empty array if file doesn't exist
    fs.writeFileSync(PENDING_FILE, JSON.stringify([], null, 2));
    return [];
  }
  
  try {
    const raw = fs.readFileSync(PENDING_FILE);
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading pending profiles:', error);
    return [];
  }
}

/**
 * Save the pending profiles queue to file
 */
function saveQueue(queue) {
  ensureDataDirExists();
  
  try {
    fs.writeFileSync(PENDING_FILE, JSON.stringify(queue, null, 2));
  } catch (error) {
    console.error('Error saving pending profiles:', error);
  }
}

/**
 * Check if a name and firm combination already exists in the queue
 */
function isDuplicate(name, firm, queue) {
  return queue.some(entry =>
    entry.name.toLowerCase() === name.toLowerCase() &&
    (!firm || entry.firm?.toLowerCase() === firm.toLowerCase())
  );
}

/**
 * Process a new name submission, checking for duplicates
 */
function processName({ name, firm, source = 'manual' }) {
  if (!name || typeof name !== 'string') {
    return { error: 'Invalid name input' };
  }

  const queue = loadQueue();
  if (isDuplicate(name, firm, queue)) {
    return { message: 'Duplicate found. Skipping.', status: 'skipped' };
  }

  const newEntry = {
    id: uuidv4(),
    name,
    firm: firm || null,
    status: 'pending',
    source: source,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  queue.push(newEntry);
  saveQueue(queue);

  return { message: 'Name queued for processing', entry: newEntry, status: 'queued' };
}

/**
 * Get all pending profiles
 */
function getPendingProfiles() {
  return loadQueue();
}

/**
 * Update the status of a pending profile
 */
function updateProfileStatus(id, status) {
  if (!id || !status) {
    return { error: 'Invalid inputs' };
  }
  
  const queue = loadQueue();
  const index = queue.findIndex(entry => entry.id === id);
  
  if (index === -1) {
    return { error: 'Profile not found' };
  }
  
  queue[index].status = status;
  queue[index].updated_at = new Date().toISOString();
  
  saveQueue(queue);
  
  return { message: 'Profile status updated', entry: queue[index] };
}

/**
 * Delete a profile from the pending queue
 */
function deleteProfile(id) {
  if (!id) {
    return { error: 'Invalid profile ID' };
  }
  
  const queue = loadQueue();
  const filteredQueue = queue.filter(entry => entry.id !== id);
  
  if (filteredQueue.length === queue.length) {
    return { error: 'Profile not found' };
  }
  
  saveQueue(filteredQueue);
  
  return { message: 'Profile deleted from queue' };
}

module.exports = {
  processName,
  getPendingProfiles,
  updateProfileStatus,
  deleteProfile
};