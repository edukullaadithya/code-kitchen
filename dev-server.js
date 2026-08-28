const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const ROOT = __dirname;

function loadLocalEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
}

loadLocalEnv();

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const HERE_API_KEY = process.env.HERE_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('⚡ Connected to Supabase Cloud Database');
  } catch (err) {
    console.warn('Supabase SDK warning:', err.message);
  }
}

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

// ===== DATABASE: LISTINGS =====
function loadListings() {
  const source = fs.readFileSync(path.join(ROOT, 'client.js'), 'utf8');
  const match = source.match(/var ALL_LISTINGS = ([\s\S]*?);\r?\n\r?\nvar currentListings/);
  if (!match) throw new Error('Could not load rental listings.');
  return vm.runInNewContext(`(${match[1]})`);
}

const LISTINGS = loadListings();

function saveListings() {
  const filePath = path.join(ROOT, 'client.js');
  let source = fs.readFileSync(filePath, 'utf8');
  const formattedListings = JSON.stringify(LISTINGS, null, 2);
  source = source.replace(
    /var ALL_LISTINGS = [\s\S]*?;\r?\n\r?\nvar currentListings/,
    `var ALL_LISTINGS = ${formattedListings};\n\nvar currentListings`
  );
  fs.writeFileSync(filePath, source, 'utf8');
}

// ===== DATABASE: USERS STORE =====
const USERS_FILE = path.join(ROOT, 'users.json');
const SESSIONS = new Map();

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
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
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf8');
    return defaultUsers;
  }
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

let USERS = loadUsers();

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(USERS, null, 2), 'utf8');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_rentright_salt').digest('hex');
}

// ===== DATABASE: INQUIRIES / INTERESTED RENTERS STORE =====
const INQUIRIES_FILE = path.join(ROOT, 'inquiries.json');

function loadInquiries() {
  if (!fs.existsSync(INQUIRIES_FILE)) {
    const defaultInquiries = [
      {
        id: 'inq_1',
        listingId: 1,
        listingName: 'Greenwood Sanctuary',
        ownerEmail: 'admin@rentright.com',
        userName: 'Rohan Verma',
        userEmail: 'rohan@gmail.com',
        phone: '+91 98765 43210',
        moveInDate: '2026-09-01',
        message: 'Hi, I am interested in taking this 2BHK flat on rent. Is it available for immediate move-in?',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'inq_2',
        listingId: 2,
        listingName: 'TechPark Haven',
        ownerEmail: 'admin@rentright.com',
        userName: 'Priya Sharma',
        userEmail: 'priya.s@outlook.com',
        phone: '+91 98123 45678',
        moveInDate: '2026-09-15',
        message: 'Looking to rent for 1 year. Would like to schedule a visit this weekend.',
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(defaultInquiries, null, 2), 'utf8');
    return defaultInquiries;
  }
  try {
    return JSON.parse(fs.readFileSync(INQUIRIES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

let INQUIRIES = loadInquiries();

function saveInquiries() {
  fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(INQUIRIES, null, 2), 'utf8');
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        request.destroy();
        reject(new Error('Request body is too large.'));
      }
    });
    request.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Request body must be valid JSON.')); }
    });
    request.on('error', reject);
  });
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
  let detectedCity = '';
  const cities = ['hyderabad', 'bengaluru', 'mumbai', 'pune', 'chennai', 'delhi'];
  for (const c of cities) {
    if (rawPlace.includes(c) || (c === 'bengaluru' && rawPlace.includes('bangalore')) || (c === 'mumbai' && rawPlace.includes('bombay'))) {
      detectedCity = c;
      break;
    }
  }

  const effectiveCity = detectedCity || targetCity;

  // 1. City match check: Must match the city
  if (effectiveCity && listingCity && listingCity !== effectiveCity) {
    return { match: false, relevanceScore: 0 };
  }

  // 2. Place/Area match check: Must match the place/area
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

  // 1. Gather candidate pool across all listings
  let pool = [];
  Object.keys(LISTINGS).forEach(cKey => {
    (LISTINGS[cKey] || []).forEach(item => {
      if (!pool.some(p => String(p.id) === String(item.id))) {
        pool.push(item);
      }
    });
  });

  if (pool.length === 0) return [];

  // 2. ML Multi-Factor Ranking
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

function serveStatic(request, response, pathname) {
  let requested = pathname === '/' ? 'login.html' : pathname.slice(1);
  if (pathname === '/login') requested = 'login.html';
  const safePath = path.resolve(ROOT, requested);
  if (!safePath.startsWith(ROOT + path.sep) || !MIME_TYPES[path.extname(safePath)]) {
    response.writeHead(404); response.end('Not found'); return;
  }
  fs.readFile(safePath, (error, file) => {
    if (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 500); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(safePath)] });
    response.end(file);
  });
}

function getSessionToken(request) {
  const authHeader = request.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  return '';
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    response.end(); return;
  }

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { status: 'ok', supabaseConnected: !!supabase }); return;
  }

  if (request.method === 'GET' && url.pathname === '/runtime-config.js') {
    response.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    response.end(`window.RENTRIGHT_CONFIG = ${JSON.stringify({ hereApiKey: HERE_API_KEY, supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_KEY })};`);
    return;
  }

  // ===== AUTH ROUTES =====
  if (request.method === 'POST' && url.pathname === '/api/auth/register') {
    try {
      const { name, email, password, role } = await readBody(request);
      if (!name || !email || !password) {
        throw new Error('Name, email and password are required.');
      }
      const cleanEmail = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        throw new Error('Enter a valid email address.');
      }
      if (String(password).length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (USERS.some(u => u.email === cleanEmail)) {
        throw new Error('An account with this email already exists.');
      }
      const userRole = (role === 'admin') ? 'admin' : 'user';
      const newUser = {
        id: 'usr_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        password: hashPassword(password),
        role: userRole,
        createdAt: new Date().toISOString()
      };
      USERS.push(newUser);
      saveUsers();

      const token = crypto.randomUUID();
      const userPayload = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
      SESSIONS.set(token, userPayload);

      sendJson(response, 201, { success: true, token, user: userPayload });
    } catch (err) {
      sendJson(response, 400, { error: err.message });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/login') {
    try {
      const { email, password, role } = await readBody(request);
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }
      const cleanEmail = email.trim().toLowerCase();
      const hashedPassword = hashPassword(password);
      
      const user = USERS.find(u => u.email === cleanEmail && u.password === hashedPassword);
      if (!user) {
        throw new Error('Invalid email or password.');
      }

      if (role && role !== user.role) {
        throw new Error(`This account is registered as a ${user.role}. Please log in using the correct role tab.`);
      }

      const token = crypto.randomUUID();
      const userPayload = { id: user.id, name: user.name, email: user.email, role: user.role };
      SESSIONS.set(token, userPayload);

      sendJson(response, 200, { success: true, token, user: userPayload });
    } catch (err) {
      sendJson(response, 400, { error: err.message });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/auth/me') {
    const token = getSessionToken(request);
    const user = SESSIONS.get(token);
    if (!user) {
      sendJson(response, 401, { error: 'Not authenticated' });
      return;
    }
    sendJson(response, 200, { user });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = getSessionToken(request);
    if (token) SESSIONS.delete(token);
    sendJson(response, 200, { success: true });
    return;
  }

  // ===== INQUIRIES & TENANT INTEREST ROUTES =====
  if (request.method === 'POST' && url.pathname === '/api/inquiries') {
    try {
      const inquiry = await readBody(request);
      if (!inquiry.listingName || !inquiry.userName || !inquiry.phone) {
        throw new Error('Name, contact phone, and property name are required.');
      }
      inquiry.id = 'inq_' + Date.now();
      inquiry.createdAt = new Date().toISOString();
      inquiry.ownerEmail = inquiry.ownerEmail || 'admin@rentright.com';
      INQUIRIES.push(inquiry);
      saveInquiries();
      sendJson(response, 201, { success: true, inquiry });
    } catch (err) {
      sendJson(response, 400, { error: err.message });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/inquiries') {
    const token = getSessionToken(request);
    const sessionUser = SESSIONS.get(token);
    const ownerEmail = (sessionUser && sessionUser.email) ? sessionUser.email : (url.searchParams.get('ownerEmail') || 'admin@rentright.com');
    
    // Filter inquiries by landlord/admin owner email
    const myInquiries = INQUIRIES.filter(i => (!i.ownerEmail) || i.ownerEmail === ownerEmail);
    sendJson(response, 200, { inquiries: myInquiries });
    return;
  }

  if (request.method === 'DELETE' && url.pathname.startsWith('/api/inquiries/')) {
    try {
      const inqId = url.pathname.split('/').pop();
      const idx = INQUIRIES.findIndex(i => i.id === inqId);
      if (idx !== -1) {
        INQUIRIES.splice(idx, 1);
        saveInquiries();
      }
      sendJson(response, 200, { success: true });
    } catch (err) {
      sendJson(response, 400, { error: err.message });
    }
    return;
  }

  // ===== LISTINGS & CITIES ROUTES =====
  if (request.method === 'GET' && url.pathname === '/api/cities') {
    sendJson(response, 200, { cities: Object.keys(LISTINGS) }); return;
  }

  if (request.method === 'GET' && url.pathname === '/api/listings') {
    const token = getSessionToken(request);
    const sessionUser = SESSIONS.get(token);
    const mine = url.searchParams.get('mine') === 'true' || url.searchParams.get('mine') === '1';
    const ownerId = url.searchParams.get('ownerId') || url.searchParams.get('userId') || (mine && sessionUser ? sessionUser.id : null);
    const ownerEmail = url.searchParams.get('ownerEmail') || (mine && sessionUser ? sessionUser.email : null);

    if (ownerId || ownerEmail || mine) {
      const targetId = ownerId ? String(ownerId).trim() : (sessionUser && sessionUser.id ? String(sessionUser.id).trim() : '');
      const targetEmail = ownerEmail ? String(ownerEmail).trim().toLowerCase() : (sessionUser && sessionUser.email ? String(sessionUser.email).trim().toLowerCase() : '');

      const filtered = {};
      Object.keys(LISTINGS).forEach(city => {
        filtered[city] = (LISTINGS[city] || []).filter(item => {
          const itemOwnerId = String(item.ownerId || item.userId || '').trim();
          const itemOwnerEmail = String(item.ownerEmail || '').trim().toLowerCase();
          if (targetId && itemOwnerId && itemOwnerId === targetId) return true;
          if (targetEmail && itemOwnerEmail && itemOwnerEmail === targetEmail) return true;
          return false;
        });
      });
      sendJson(response, 200, { listings: filtered });
      return;
    }

    sendJson(response, 200, { listings: LISTINGS }); return;
  }

  if (request.method === 'POST' && url.pathname === '/api/listings') {
    try {
      const token = getSessionToken(request);
      const sessionUser = SESSIONS.get(token);
      const listing = await readBody(request);
      if (!listing.name || !listing.city || !listing.area || !listing.price) {
        throw new Error('Name, city, area and price are required.');
      }
      const city = normaliseCity(listing.city);
      if (!LISTINGS[city]) {
        LISTINGS[city] = [];
      }
      listing.id = Date.now();
      listing.ownerId = (sessionUser && sessionUser.id) ? sessionUser.id : (listing.ownerId || listing.userId || '');
      listing.ownerEmail = (sessionUser && sessionUser.email) ? sessionUser.email.toLowerCase() : (listing.ownerEmail ? String(listing.ownerEmail).trim().toLowerCase() : '');
      LISTINGS[city].push(listing);
      saveListings();
      sendJson(response, 201, { success: true, listing });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  if (request.method === 'DELETE' && url.pathname.startsWith('/api/listings/')) {
    try {
      const idToDelete = Number(url.pathname.split('/').pop());
      let found = false;
      for (const city of Object.keys(LISTINGS)) {
        const index = LISTINGS[city].findIndex(item => item.id === idToDelete);
        if (index !== -1) {
          LISTINGS[city].splice(index, 1);
          found = true;
          break;
        }
      }
      if (!found) throw new Error('Listing not found.');
      saveListings();
      sendJson(response, 200, { success: true });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/recommendations') {
    try {
      const preferences = await readBody(request);
      const listings = getRecommendedListings(preferences);
      sendJson(response, 200, { listings, count: listings.length });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  serveStatic(request, response, url.pathname);
});

server.listen(PORT, () => console.log(`RentRight Server running at http://localhost:${PORT}`));
