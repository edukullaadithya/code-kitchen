const fs = require('fs');

// ===== vercel.json =====
fs.writeFileSync('vercel.json', JSON.stringify({
  "version": 2,
  "builds": [
    { "src": "api/**/*.js", "use": "@vercel/node" },
    { "src": "*.html", "use": "@vercel/static" },
    { "src": "*.css", "use": "@vercel/static" },
    { "src": "app.js", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/auth/(.+)", "dest": "/api/auth/[action]?action=$1" },
    { "src": "/api/listings/(.+)", "dest": "/api/listings/[id]?id=$1" },
    { "src": "/api/inquiries/(.+)", "dest": "/api/inquiries/[id]?id=$1" },
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/runtime-config.js", "dest": "/api/runtime-config" },
    { "src": "/login", "dest": "/login.html" },
    { "src": "/", "dest": "/login.html" }
  ]
}, null, 2));
console.log('1/7 vercel.json');

// ===== api/auth/[action].js =====
fs.writeFileSync('api/auth/[action].js', `const { USERS, SESSIONS, hashPassword, setCorsHeaders } = require('../_shared/data');
const crypto = require('crypto');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const action = req.query.action;

  if (action === 'register' && req.method === 'POST') {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
    const cleanEmail = email.trim().toLowerCase();
    if (USERS.some(u => u.email === cleanEmail)) return res.status(400).json({ error: 'An account with this email already exists.' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: hashPassword(password),
      role: role === 'admin' ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };
    USERS.push(newUser);
    const token = crypto.randomUUID();
    const userPayload = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    SESSIONS.set(token, userPayload);
    return res.status(201).json({ success: true, token, user: userPayload });
  }

  if (action === 'login' && req.method === 'POST') {
    const { email, password, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const cleanEmail = email.trim().toLowerCase();
    const hashed = hashPassword(password);
    const user = USERS.find(u => u.email === cleanEmail && u.password === hashed);
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
    if (role && role !== user.role) return res.status(400).json({ error: 'This account is registered as a ' + user.role + '. Please log in using the correct role tab.' });
    const token = crypto.randomUUID();
    const userPayload = { id: user.id, name: user.name, email: user.email, role: user.role };
    SESSIONS.set(token, userPayload);
    return res.status(200).json({ success: true, token, user: userPayload });
  }

  if (action === 'me' && req.method === 'GET') {
    const s = require('../_shared/data').getSessionUser(req);
    if (!s || !s.user) return res.status(401).json({ error: 'Not authenticated' });
    return res.status(200).json({ user: s.user });
  }

  if (action === 'logout') {
    const s = require('../_shared/data').getSessionUser(req);
    if (s && s.token) SESSIONS.delete(s.token);
    return res.status(200).json({ success: true });
  }

  return res.status(404).json({ error: 'Not found' });
};
`);
console.log('2/7 api/auth/[action].js');

// ===== api/listings.js =====
fs.writeFileSync('api/listings.js', `const { LISTINGS, SESSIONS, setCorsHeaders, getSessionUser, normaliseCity } = require('./_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({ listings: LISTINGS });
  }

  if (req.method === 'POST') {
    const s = getSessionUser(req);
    const b = req.body || {};
    if (!b.name || !b.city || !b.area || !b.price) return res.status(400).json({ error: 'Name, city, area and price are required.' });
    const city = normaliseCity(b.city);
    if (!LISTINGS[city]) LISTINGS[city] = [];
    b.id = Date.now();
    b.ownerEmail = (s && s.user) ? s.user.email : (b.ownerEmail || 'admin@rentright.com');
    LISTINGS[city].push(b);
    return res.status(201).json({ success: true, listing: b });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
`);
console.log('3/7 api/listings.js');

// ===== api/listings/[id].js =====
if (!fs.existsSync('api/listings')) fs.mkdirSync('api/listings', { recursive: true });
fs.writeFileSync('api/listings/[id].js', `const { LISTINGS, setCorsHeaders } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'DELETE') {
    const idToDelete = Number(req.query.id);
    for (const city of Object.keys(LISTINGS)) {
      const idx = LISTINGS[city].findIndex(item => item.id === idToDelete);
      if (idx !== -1) { LISTINGS[city].splice(idx, 1); return res.status(200).json({ success: true }); }
    }
    return res.status(400).json({ error: 'Listing not found.' });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
`);
console.log('4/7 api/listings/[id].js');

// ===== api/inquiries.js =====
fs.writeFileSync('api/inquiries.js', `const { INQUIRIES, setCorsHeaders, getSessionUser } = require('./_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const s = getSessionUser(req);
    const ownerEmail = (s && s.user) ? s.user.email : (req.query.ownerEmail || 'admin@rentright.com');
    const myInquiries = INQUIRIES.filter(i => (!i.ownerEmail) || i.ownerEmail === ownerEmail);
    return res.status(200).json({ inquiries: myInquiries });
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.listingName || !b.userName || !b.phone) return res.status(400).json({ error: 'Name, phone, and property name are required.' });
    const inquiry = {
      id: 'inq_' + Date.now(),
      listingId: b.listingId,
      listingName: b.listingName,
      ownerEmail: b.ownerEmail || 'admin@rentright.com',
      userName: b.userName,
      userEmail: b.userEmail || '',
      phone: b.phone,
      moveInDate: b.moveInDate || '',
      message: b.message || '',
      createdAt: new Date().toISOString()
    };
    INQUIRIES.push(inquiry);
    return res.status(201).json({ success: true, inquiry });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
`);
console.log('5/7 api/inquiries.js');

// ===== api/inquiries/[id].js =====
if (!fs.existsSync('api/inquiries')) fs.mkdirSync('api/inquiries', { recursive: true });
fs.writeFileSync('api/inquiries/[id].js', `const { INQUIRIES, setCorsHeaders } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'DELETE') {
    const idx = INQUIRIES.findIndex(i => i.id === req.query.id);
    if (idx !== -1) INQUIRIES.splice(idx, 1);
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
`);
console.log('6/7 api/inquiries/[id].js');

// ===== api/recommendations.js =====
fs.writeFileSync('api/recommendations.js', `const { getRecommendedListings, setCorsHeaders } = require('./_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const preferences = req.body || {};
    const listings = getRecommendedListings(preferences);
    return res.status(200).json({ listings, count: listings.length });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
`);
console.log('7/7 api/recommendations.js');

// ===== api/runtime-config.js =====
fs.writeFileSync('api/runtime-config.js', `module.exports = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const config = {
    hereApiKey: process.env.HERE_API_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || ''
  };
  res.end('window.RENTRIGHT_CONFIG = ' + JSON.stringify(config) + ';');
};
`);

// ===== Clean up old Supabase-dependent files =====
try { fs.unlinkSync('api/_supabase.js'); } catch(e) {}
try { fs.unlinkSync('api/supabase.js'); } catch(e) {}
try { fs.unlinkSync('api/auth/register.js'); } catch(e) {}
try { fs.unlinkSync('api/cities.js'); } catch(e) {}
try { fs.unlinkSync('api/health.js'); } catch(e) {}

console.log('All files written! Ready to deploy.');
