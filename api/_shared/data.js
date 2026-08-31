const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

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
  const raw = String(value || '').toLowerCase().trim();
  if (raw.includes('hyd') || raw.includes('telangana')) return 'hyderabad';
  if (raw.includes('bang') || raw.includes('beng') || raw.includes('karnataka')) return 'bangalore';
  if (raw.includes('mum') || raw.includes('bombay') || raw.includes('maharashtra')) return 'mumbai';
  if (raw.includes('del') || raw.includes('ncr') || raw.includes('gurgaon') || raw.includes('noida')) return 'delhi';
  if (raw.includes('chen') || raw.includes('madras') || raw.includes('tamil')) return 'chennai';
  if (raw.includes('kol') || raw.includes('calcutta') || raw.includes('bengal')) return 'kolkata';
  if (raw.includes('pune')) return 'pune';
  return 'hyderabad';
}

// ===== LOAD LISTINGS FROM app.js & DISK STORE =====
const TMP_LISTINGS_FILE = process.platform === 'win32'
  ? path.join(__dirname, '..', '..', 'listings.json')
  : path.join('/tmp', 'listings_store.json');

function saveListingToDisk(listing) {
  try {
    let custom = [];
    if (fs.existsSync(TMP_LISTINGS_FILE)) {
      custom = JSON.parse(fs.readFileSync(TMP_LISTINGS_FILE, 'utf8'));
    }
    const idx = custom.findIndex(c => String(c.id) === String(listing.id));
    if (idx !== -1) {
      custom[idx] = Object.assign({}, custom[idx], listing);
    } else {
      custom.unshift(listing);
    }
    fs.writeFileSync(TMP_LISTINGS_FILE, JSON.stringify(custom, null, 2), 'utf8');
  } catch(e) {}
}

function updateListingOnDisk(id, updatedFields) {
  try {
    let custom = [];
    if (fs.existsSync(TMP_LISTINGS_FILE)) {
      custom = JSON.parse(fs.readFileSync(TMP_LISTINGS_FILE, 'utf8'));
    }
    const idx = custom.findIndex(c => String(c.id) === String(id));
    if (idx !== -1) {
      custom[idx] = Object.assign({}, custom[idx], updatedFields);
      fs.writeFileSync(TMP_LISTINGS_FILE, JSON.stringify(custom, null, 2), 'utf8');
      return custom[idx];
    }
  } catch(e) {}
  return null;
}

function deleteListingFromDisk(id) {
  try {
    if (fs.existsSync(TMP_LISTINGS_FILE)) {
      let custom = JSON.parse(fs.readFileSync(TMP_LISTINGS_FILE, 'utf8'));
      custom = custom.filter(c => String(c.id) !== String(id));
      fs.writeFileSync(TMP_LISTINGS_FILE, JSON.stringify(custom, null, 2), 'utf8');
    }
  } catch(e) {}
}

// ===== FAVORITES STORE =====
const TMP_FAVORITES_FILE = process.platform === 'win32'
  ? path.join(__dirname, '..', '..', 'favorites.json')
  : path.join('/tmp', 'favorites_store.json');

function loadDiskFavorites() {
  try {
    if (fs.existsSync(TMP_FAVORITES_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_FAVORITES_FILE, 'utf8'));
    }
  } catch(e) {}
  return [];
}

function saveFavoriteToDisk(fav) {
  try {
    let list = loadDiskFavorites();
    if (!list.some(f => String(f.id) === String(fav.id) && String(f.userId) === String(fav.userId))) {
      list.unshift(fav);
      fs.writeFileSync(TMP_FAVORITES_FILE, JSON.stringify(list, null, 2), 'utf8');
    }
  } catch(e) {}
}

function removeFavoriteFromDisk(listingId, userId) {
  try {
    let list = loadDiskFavorites();
    list = list.filter(f => !(String(f.listingId || f.id) === String(listingId) && (!userId || String(f.userId) === String(userId))));
    fs.writeFileSync(TMP_FAVORITES_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch(e) {}
}

function loadDiskListings() {
  try {
    if (fs.existsSync(TMP_LISTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_LISTINGS_FILE, 'utf8'));
    }
  } catch(e) {}
  return [];
}

let FAVORITES = loadDiskFavorites();

function loadListings() {
  try {
    const appJsPath = path.join(__dirname, '..', '..', 'client.js');
    const source = fs.readFileSync(appJsPath, 'utf8');
    const match = source.match(/var ALL_LISTINGS = ([\s\S]*?);\s*var currentListings/);
    if (!match) throw new Error('Could not parse listings from client.js');
    const base = vm.runInNewContext(`(${match[1]})`);
    const custom = loadDiskListings();
    custom.forEach(item => {
      const c = normaliseCity(item.city || 'hyderabad');
      if (!base[c]) base[c] = [];
      if (!base[c].some(p => String(p.id) === String(item.id))) {
        base[c].unshift(item);
      }
    });
    return base;
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

const PINCODE_MAP = {
  // Hyderabad
  '500072': { area: 'kukatpally', city: 'hyderabad' },
  '500081': { area: 'madhapur', city: 'hyderabad' },
  '500032': { area: 'gachibowli', city: 'hyderabad' },
  '500084': { area: 'kondapur', city: 'hyderabad' },
  '500034': { area: 'banjara hills', city: 'hyderabad' },
  '500033': { area: 'jubilee hills', city: 'hyderabad' },
  '500016': { area: 'begumpet', city: 'hyderabad' },
  '500082': { area: 'somajiguda', city: 'hyderabad' },
  // Bengaluru
  '560038': { area: 'indiranagar', city: 'bengaluru' },
  '560034': { area: 'koramangala', city: 'bengaluru' },
  '560066': { area: 'whitefield', city: 'bengaluru' },
  '560102': { area: 'hsr layout', city: 'bengaluru' },
  '560103': { area: 'bellandur', city: 'bengaluru' },
  '560100': { area: 'electronic city', city: 'bengaluru' },
  // Mumbai
  '400050': { area: 'bandra west', city: 'mumbai' },
  '400058': { area: 'andheri west', city: 'mumbai' },
  '400076': { area: 'powai', city: 'mumbai' },
  // Pune
  '411057': { area: 'hinjewadi', city: 'pune' },
  '411001': { area: 'koregaon park', city: 'pune' },
  '411045': { area: 'baner', city: 'pune' },
  // Chennai
  '600097': { area: 'thoraipakkam', city: 'chennai' },
  '600020': { area: 'adyar', city: 'chennai' },
  // Delhi
  '122002': { area: 'gurgaon', city: 'delhi' },
  '110017': { area: 'saket', city: 'delhi' }
};

const LANDMARK_MAP = {
  'kphb': 'kukatpally',
  'jntu': 'kukatpally',
  'forum mall': 'kukatpally',
  'cyber towers': 'madhapur',
  'mindspace': 'madhapur',
  'inorbit': 'madhapur',
  'dlf': 'gachibowli',
  'financial district': 'gachibowli',
  '100ft road': 'indiranagar',
  'sony world': 'koramangala',
  'itpl': 'whitefield'
};

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function matchesLocation(listing, searchLocation) {
  if (!searchLocation || !String(searchLocation).trim()) return { match: true, relevanceScore: 1.0 };
  
  const rawQuery = String(searchLocation).trim().toLowerCase();
  const queryNorm = normalise(rawQuery);
  if (!queryNorm) return { match: true, relevanceScore: 1.0 };

  const area = String(listing.area || '').toLowerCase();
  const areaNorm = normalise(area);
  const city = String(listing.city || '').toLowerCase();
  const cityNorm = normalise(city);
  const name = String(listing.name || '').toLowerCase();
  const nameNorm = normalise(name);
  const pincode = listing.pincode ? String(listing.pincode).trim() : '';

  // 1. PIN code matching
  const pinMatch = rawQuery.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) {
    const searchedPin = pinMatch[1];
    if (pincode && pincode === searchedPin) return { match: true, relevanceScore: 1.0 };
    if (PINCODE_MAP[searchedPin]) {
      const targetArea = normalise(PINCODE_MAP[searchedPin].area);
      if (areaNorm.includes(targetArea) || targetArea.includes(areaNorm)) {
        return { match: true, relevanceScore: 1.0 };
      }
    }
  }

  // 2. Landmark / IT corridor resolution
  for (const [landmark, targetArea] of Object.entries(LANDMARK_MAP)) {
    if (rawQuery.includes(landmark)) {
      const targetNorm = normalise(targetArea);
      if (areaNorm.includes(targetNorm) || targetNorm.includes(areaNorm)) {
        return { match: true, relevanceScore: 0.95 };
      }
    }
  }

  // 3. Direct Substring matching
  if (area.includes(rawQuery) || rawQuery.includes(area) ||
      (areaNorm && (areaNorm.includes(queryNorm) || queryNorm.includes(areaNorm)))) {
    return { match: true, relevanceScore: 1.0 };
  }
  if (name.includes(rawQuery) || rawQuery.includes(name) ||
      (nameNorm && (nameNorm.includes(queryNorm) || queryNorm.includes(nameNorm)))) {
    return { match: true, relevanceScore: 0.95 };
  }
  if (city.includes(rawQuery) || rawQuery.includes(city) ||
      (cityNorm && (cityNorm.includes(queryNorm) || queryNorm.includes(cityNorm)))) {
    return { match: true, relevanceScore: 0.85 };
  }

  // 4. Tokenized word matching
  const tokens = rawQuery.split(/[\s,.-]+/).filter(t => t.length > 2).map(normalise);
  for (const token of tokens) {
    if (areaNorm && (areaNorm.includes(token) || token.includes(areaNorm))) return { match: true, relevanceScore: 0.9 };
    if (cityNorm && (cityNorm.includes(token) || token.includes(cityNorm))) return { match: true, relevanceScore: 0.85 };
    if (nameNorm && (nameNorm.includes(token) || token.includes(nameNorm))) return { match: true, relevanceScore: 0.85 };
  }

  // 5. Phonetic & Locality Aliases
  const aliases = [
    ['kukatpally', 'kukattepally', 'kukatpalli', 'kphb'],
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
      if (listingMatchesGroup) return { match: true, relevanceScore: 0.9 };
    }
  }

  // 6. Fuzzy Typo Distance (Levenshtein)
  if (queryNorm.length >= 4 && areaNorm.length >= 4) {
    const dist = levenshteinDistance(queryNorm, areaNorm);
    if (dist <= 2) {
      return { match: true, relevanceScore: 0.8 };
    }
  }

  return { match: false, relevanceScore: 0.0 };
}

function matchesCombinedCityAndPlace(listing, selectedCity, searchPlace) {
  const listingCity = normaliseCity(listing.city || '');
  const targetCity = normaliseCity(selectedCity || '');

  const rawPlace = String(searchPlace || '').trim().toLowerCase();
  const rawPlaceNorm = normalise(rawPlace);
  const listingName = String(listing.name || '').toLowerCase();
  const listingNameNorm = normalise(listingName);
  const listingArea = String(listing.area || '').toLowerCase();
  const listingAreaNorm = normalise(listingArea);

  // 1. Direct property name match (e.g. user searches "kkk" or "xyz hotel")
  if (rawPlace && (listingName.includes(rawPlace) || rawPlace.includes(listingName) ||
      (listingNameNorm && (listingNameNorm.includes(rawPlaceNorm) || rawPlaceNorm.includes(listingNameNorm))))) {
    return { match: true, relevanceScore: 1.0 };
  }

  // 2. Detect city in search query (e.g. "Kukatpally, Hyderabad")
  let detectedCity = '';
  const cities = ['hyderabad', 'bengaluru', 'mumbai', 'pune', 'chennai', 'delhi'];
  for (const c of cities) {
    if (rawPlace.includes(c) || (c === 'bengaluru' && rawPlace.includes('bangalore')) || (c === 'mumbai' && rawPlace.includes('bombay'))) {
      detectedCity = c;
      break;
    }
  }

  const effectiveCity = detectedCity || targetCity;

  // 3. City match check: Must match the city (with area discovery if area matches directly)
  if (effectiveCity && listingCity && listingCity !== effectiveCity) {
    if (listingAreaNorm && (listingAreaNorm.includes(rawPlaceNorm) || rawPlaceNorm.includes(listingAreaNorm))) {
      return { match: true, relevanceScore: 0.95 };
    }
    return { match: false, relevanceScore: 0 };
  }

  // 4. Place/Area match check: Must match the place/area
  if (rawPlace) {
    const cleanPlace = rawPlace.replace(/\b(hyderabad|bengaluru|bangalore|mumbai|bombay|pune|chennai|madras|delhi|gurgaon|gurugram)\b/gi, '').trim();
    if (!cleanPlace) {
      return { match: true, relevanceScore: 1.0 };
    }
    return matchesLocation(listing, cleanPlace);
  }

  return { match: true, relevanceScore: 1.0 };
}

function matchesWorkplace(listing, workplace, city) {
  const result = matchesCombinedCityAndPlace(listing, city, workplace);
  return result && result.match;
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

  // 1. Gather candidate pool across all listings + customListings from client
  let pool = [];
  Object.keys(LISTINGS).forEach(cKey => {
    (LISTINGS[cKey] || []).forEach(item => {
      if (!pool.some(p => String(p.id) === String(item.id))) {
        pool.push(item);
      }
    });
  });

  if (Array.isArray(preferences.customListings)) {
    preferences.customListings.forEach(item => {
      if (!pool.some(p => String(p.id) === String(item.id))) {
        pool.unshift(item);
      }
    });
  }

  if (pool.length === 0) return [];

  // 2. ML Multi-Factor Ranking with Combined City & Place evaluation
  const scored = pool.map(listing => {
    const availableAmenities = Array.isArray(listing.amenities) ? listing.amenities.map(normalise) : [];
    const commuteMinutes = Number.parseInt(listing.commute, 10) || 10;

    const locEval = matchesCombinedCityAndPlace(listing, city, workplace);
    const isLocationMatch = locEval && locEval.match;
    const locRelevance = (locEval && locEval.relevanceScore) || 0.0;

    const isTypeMatch = (!propertyType || normalise(listing.type) === propertyType);

    // Feature 1: Location Feature (Weight: 40%)
    const locationScore = isLocationMatch ? locRelevance * 40 : 0;

    // Feature 2: Amenity Jaccard Vector (Weight: 15%)
    const matchedAmenities = requestedAmenities.filter(a => availableAmenities.includes(a)).length;
    const amenityScore = requestedAmenities.length ? (matchedAmenities / requestedAmenities.length) * 15 : 10;

    // Feature 3: Budget Elasticity Curve (Weight: 20%)
    const budgetScore = budget ? Math.max(0, 20 - (Math.abs((listing.price || 0) - budget) / budget) * 25) : 15;

    // Feature 4: Commute Decay Function (Weight: 15%)
    const commuteScore = Math.max(0, 15 - Math.max(0, commuteMinutes - maxCommute) * 0.8);

    // Feature 5: Property Type & Base Quality (Weight: 10%)
    const typeScore = isTypeMatch ? 10 : 0;

    const finalScore = Math.round(Math.max(10, Math.min(99, locationScore + amenityScore + budgetScore + commuteScore + typeScore)));

    return {
      ...listing,
      score: finalScore,
      matchedAmenities,
      isExactLocationMatch: Boolean(isLocationMatch)
    };
  });

  // Filter strictly by combined city and place match
  const results = scored.filter(s => s.isExactLocationMatch);

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
}

module.exports = {
  LISTINGS,
  USERS,
  INQUIRIES,
  FAVORITES,
  SESSIONS,
  hashPassword,
  normalise,
  normaliseAmenity,
  normaliseCity,
  matchesLocation,
  matchesWorkplace,
  getRecommendedListings,
  getSessionUser,
  setCorsHeaders,
  saveListingToDisk,
  updateListingOnDisk,
  deleteListingFromDisk,
  loadDiskListings,
  saveFavoriteToDisk,
  removeFavoriteFromDisk,
  loadDiskFavorites
};
