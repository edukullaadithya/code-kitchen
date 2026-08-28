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

function matchesLocation(listing, searchLocation) {
  if (!searchLocation || !String(searchLocation).trim()) return true;
  
  const query = String(searchLocation).trim().toLowerCase();
  const queryNorm = normalise(query);
  if (!queryNorm) return true;

  const area = String(listing.area || '').toLowerCase();
  const areaNorm = normalise(area);
  const city = String(listing.city || '').toLowerCase();
  const cityNorm = normalise(city);
  const name = String(listing.name || '').toLowerCase();
  const nameNorm = normalise(name);

  // 1. Direct substring matching
  if (area.includes(query) || query.includes(area) ||
      (areaNorm && (areaNorm.includes(queryNorm) || queryNorm.includes(areaNorm)))) {
    return true;
  }
  if (city.includes(query) || query.includes(city) ||
      (cityNorm && (cityNorm.includes(queryNorm) || queryNorm.includes(cityNorm)))) {
    return true;
  }
  if (name.includes(query) || query.includes(name) ||
      (nameNorm && (nameNorm.includes(queryNorm) || queryNorm.includes(nameNorm)))) {
    return true;
  }

  // 2. Tokenized word-by-word matching
  const tokens = query.split(/[\s,.-]+/).filter(t => t.length > 2).map(normalise);
  for (const token of tokens) {
    if (areaNorm && (areaNorm.includes(token) || token.includes(areaNorm))) return true;
    if (cityNorm && (cityNorm.includes(token) || token.includes(cityNorm))) return true;
    if (nameNorm && (nameNorm.includes(token) || token.includes(nameNorm))) return true;
  }

  // 3. Phonetic and locality aliases
  const aliases = [
    ['kukatpally', 'kukattepally', 'kukatpalli'],
    ['madhapur', 'madhapur'],
    ['gachibowli', 'gachibowli'],
    ['hitec', 'hitech', 'hiteccity', 'cybercity'],
    ['koramangala', 'kora'],
    ['indiranagar', 'indiranagar'],
    ['whitefield', 'whitefield'],
    ['bellandur', 'bellandur'],
    ['hsr', 'hsrlayout'],
    ['ecity', 'electroniccity'],
    ['bandra', 'bandrawest', 'bandraeast'],
    ['powai', 'powai'],
    ['andheri', 'andheriwest', 'andherieast'],
    ['hinjewadi', 'hinjawadi'],
    ['koregaon', 'koregaonpark'],
    ['baner', 'baner'],
    ['omr', 'thoraipakkam'],
    ['adyar', 'adyar'],
    ['gurgaon', 'gurugram', 'cybercity']
  ];

  for (const group of aliases) {
    const queryMatchesGroup = group.some(alias => queryNorm.includes(alias) || alias.includes(queryNorm));
    if (queryMatchesGroup) {
      const listingMatchesGroup = group.some(alias => areaNorm.includes(alias) || nameNorm.includes(alias));
      if (listingMatchesGroup) return true;
    }
  }

  return false;
}

function matchesWorkplace(listing, workplace) {
  return matchesLocation(listing, workplace);
}

function getRecommendedListings(preferences) {
  const city = normaliseCity(preferences.city || 'bengaluru');
  const workplace = preferences.workplace || preferences.location || '';
  const workplaceNorm = normalise(workplace);
  const budget = Number(preferences.budget) || 0;
  const propertyType = normalise(preferences.propertyType);
  const maxCommute = Number.isFinite(Number(preferences.maxCommute)) && Number(preferences.maxCommute) > 0
    ? Number(preferences.maxCommute)
    : Infinity;
  const requestedAmenities = Array.isArray(preferences.amenities)
    ? preferences.amenities.map(normaliseAmenity).filter(Boolean)
    : [];

  // Gather candidate properties from selected city
  let pool = [];
  if (city && LISTINGS[city]) {
    pool = [...LISTINGS[city]];
  }

  // Cross-city search if a location keyword was provided
  if (workplaceNorm) {
    Object.keys(LISTINGS).forEach(cKey => {
      if (cKey !== city) {
        (LISTINGS[cKey] || []).forEach(item => {
          if (matchesLocation(item, workplace)) {
            if (!pool.some(p => String(p.id) === String(item.id))) {
              pool.push(item);
            }
          }
        });
      }
    });
  }

  // Fallback to all cities if pool is empty
  if (pool.length === 0) {
    Object.keys(LISTINGS).forEach(cKey => {
      (LISTINGS[cKey] || []).forEach(item => {
        if (!pool.some(p => String(p.id) === String(item.id))) {
          pool.push(item);
        }
      });
    });
  }

  if (pool.length === 0) return [];

  // Soft scoring algorithm
  const scored = pool.map(listing => {
    const availableAmenities = Array.isArray(listing.amenities) ? listing.amenities.map(normalise) : [];
    const commuteMinutes = Number.parseInt(listing.commute, 10) || 10;

    const isLocationMatch = matchesLocation(listing, workplace);
    const isTypeMatch = (!propertyType || normalise(listing.type) === propertyType);

    const matchedAmenities = requestedAmenities.filter(a => availableAmenities.includes(a)).length;
    const amenityBonus = requestedAmenities.length ? (matchedAmenities / requestedAmenities.length) * 15 : 5;
    const locationBonus = (workplaceNorm && isLocationMatch) ? 35 : 0;
    const budgetScore = budget ? Math.max(-15, 10 - Math.abs((listing.price || 0) - budget) / budget * 15) : 5;
    const commuteScore = Math.max(-10, 8 - Math.max(0, commuteMinutes - maxCommute) * 0.5);
    const typeScore = isTypeMatch ? 10 : -10;

    const baseScore = listing.score || 85;
    const finalScore = Math.round(Math.max(10, Math.min(99, baseScore * 0.5 + locationBonus + amenityBonus + budgetScore + commuteScore + typeScore)));

    return {
      ...listing,
      score: finalScore,
      matchedAmenities,
      isExactLocationMatch: Boolean(workplaceNorm && isLocationMatch)
    };
  });

  // Filter for exact location matches if any workplace/area was searched
  const results = workplaceNorm ? scored.filter(s => s.isExactLocationMatch) : scored;

  results.sort((a, b) => {
    return b.score - a.score || (a.price || 0) - (b.price || 0);
  });

  return results;
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
  matchesLocation,
  matchesWorkplace,
  getRecommendedListings,
  getSessionUser,
  setCorsHeaders
};
