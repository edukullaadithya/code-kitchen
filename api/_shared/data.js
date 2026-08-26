const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

// ===== LOAD LISTINGS FROM app.js =====
function loadListings() {
  try {
    const appJsPath = path.join(__dirname, '..', '..', 'client.js');
    const source = fs.readFileSync(appJsPath, 'utf8');
    const match = source.match(/var ALL_LISTINGS = ([\s\S]*?);\r?\n\r?\nvar currentListings/);
    if (!match) throw new Error('Could not parse listings from app.js');
    return vm.runInNewContext(`(${match[1]})`);
  } catch (err) {
    console.error('Failed to load listings:', err.message);
    return {};
  }
}

const LISTINGS = loadListings();

// ===== IN-MEMORY USERS (seeded from users.json) =====
function loadDefaultUsers() {
  try {
    const usersPath = path.join(__dirname, '..', '..', 'users.json');
    return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch {
    return [
      {
        id: 'usr_admin',
        name: 'Administrator',
        email: 'admin@rentright.com',
        password: hashPassword('admin123'),
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_demo',
        name: 'Alex Renter',
        email: 'user@rentright.com',
        password: hashPassword('user123'),
        role: 'user',
        createdAt: new Date().toISOString()
      }
    ];
  }
}

// ===== IN-MEMORY INQUIRIES (seeded from inquiries.json) =====
function loadDefaultInquiries() {
  try {
    const inqPath = path.join(__dirname, '..', '..', 'inquiries.json');
    return JSON.parse(fs.readFileSync(inqPath, 'utf8'));
  } catch {
    return [];
  }
}

// Global in-memory stores (persist within a single serverless instance lifecycle)
let USERS = loadDefaultUsers();
let INQUIRIES = loadDefaultInquiries();
const SESSIONS = new Map();

// ===== HELPER FUNCTIONS =====
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_rentright_salt').digest('hex');
}

function normalise(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normaliseAmenity(value) {
  const aliases = { pet: 'petfriendly', security: '247security', power: 'powerbackup' };
  const key = normalise(value);
  return aliases[key] || key;
}

function normaliseCity(value) {
  const aliases = {
    bangalore: 'bengaluru', bengaluru: 'bengaluru',
    bombay: 'mumbai', mumbai: 'mumbai', hyderabad: 'hyderabad',
    pune: 'pune', chennai: 'chennai', madras: 'chennai',
    delhi: 'delhi', delhincr: 'delhi', ncr: 'delhi', gurugram: 'delhi', gurgaon: 'delhi'
  };
  return aliases[normalise(value)] || '';
}

function matchesWorkplace(listing, workplace) {
  const query = normalise(workplace);
  if (!query) return true;
  const locality = normalise(listing.area);
  const cityName = normalise(listing.city);
  const propertyName = normalise(listing.name);
  return query.includes(locality) || locality.includes(query) ||
         query.includes(cityName) || cityName.includes(query) ||
         query.includes(propertyName) || propertyName.includes(query);
}

function getRecommendedListings(preferences) {
  const city = normaliseCity(preferences.city || 'bengaluru');
  if (!city || !LISTINGS[city]) {
    throw new Error('Choose a supported city to get recommendations.');
  }
  const budget = Number(preferences.budget) || 0;
  const propertyType = normalise(preferences.propertyType);
  const workplace = preferences.workplace || '';
  const minSafety = Number.isFinite(Number(preferences.minSafety))
    ? Math.min(5, Math.max(1, Number(preferences.minSafety))) * 20
    : 0;
  const maxCommute = Number.isFinite(Number(preferences.maxCommute)) && Number(preferences.maxCommute) > 0
    ? Number(preferences.maxCommute)
    : Infinity;
  const requestedAmenities = Array.isArray(preferences.amenities)
    ? preferences.amenities.map(normaliseAmenity).filter(Boolean)
    : [];

  const candidates = LISTINGS[city].filter((listing) => {
    const availableAmenities = Array.isArray(listing.amenities) ? listing.amenities.map(normalise) : [];
    const commuteMinutes = Number.parseInt(listing.commute, 10) || 10;
    const safetyScore = (listing.scores && listing.scores.safety) || 80;
    return (!propertyType || normalise(listing.type) === propertyType)
      && safetyScore >= minSafety
      && commuteMinutes <= maxCommute
      && matchesWorkplace(listing, workplace)
      && requestedAmenities.every((amenity) => availableAmenities.includes(amenity));
  });

  return candidates
    .map((listing) => {
      const commuteMinutes = Number.parseInt(listing.commute, 10) || 10;
      const availableAmenities = Array.isArray(listing.amenities) ? listing.amenities.map(normalise) : [];
      const matchedAmenities = requestedAmenities.filter((amenity) => availableAmenities.includes(amenity)).length;
      const amenityScore = requestedAmenities.length ? (matchedAmenities / requestedAmenities.length) * 8 : 0;
      const budgetScore = budget ? Math.max(-10, 8 - Math.abs(listing.price - budget) / budget * 12) : 0;
      const commuteScore = Math.max(-8, 6 - Math.max(0, commuteMinutes - maxCommute) * 0.5);
      const propertyScore = propertyType && normalise(listing.type) === propertyType ? 8 : 0;
      const baseScore = listing.score || 85;
      const matchScore = Math.round(Math.max(0, Math.min(100, baseScore * 0.7 + amenityScore + budgetScore + commuteScore + propertyScore)));
      return { ...listing, score: matchScore, matchedAmenities };
    })
    .sort((a, b) => b.score - a.score || a.price - b.price);
}

function getSessionUser(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return { token, user: SESSIONS.get(token) || null };
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
}

module.exports = {
  LISTINGS,
  USERS,
  INQUIRIES,
  SESSIONS,
  hashPassword,
  normalise,
  normaliseAmenity,
  normaliseCity,
  matchesWorkplace,
  getRecommendedListings,
  getSessionUser,
  setCorsHeaders
};
