const { LISTINGS, SESSIONS, setCorsHeaders, getSessionUser, normaliseCity } = require('./_shared/data');

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
