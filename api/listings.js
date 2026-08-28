const { LISTINGS, SESSIONS, setCorsHeaders, getSessionUser, normaliseCity, saveListingToDisk, loadDiskListings } = require('./_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const s = getSessionUser(req);
    const query = req.query || {};
    const mine = query.mine === 'true' || query.mine === '1';
    const ownerId = query.ownerId || query.userId || (mine && s && s.user ? s.user.id : null);
    const ownerEmail = query.ownerEmail || (mine && s && s.user ? s.user.email : null);

    // Merge disk listings to ensure latest uploaded items are present
    const disk = loadDiskListings();
    disk.forEach(item => {
      const c = normaliseCity(item.city || 'hyderabad');
      if (!LISTINGS[c]) LISTINGS[c] = [];
      if (!LISTINGS[c].some(p => String(p.id) === String(item.id))) {
        LISTINGS[c].unshift(item);
      }
    });

    if (ownerId || ownerEmail || mine) {
      const targetId = ownerId ? String(ownerId).trim() : (s && s.user && s.user.id ? String(s.user.id).trim() : '');
      const targetEmail = ownerEmail ? String(ownerEmail).trim().toLowerCase() : (s && s.user && s.user.email ? String(s.user.email).trim().toLowerCase() : '');

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
      return res.status(200).json({ listings: filtered });
    }

    return res.status(200).json({ listings: LISTINGS });
  }

  if (req.method === 'POST') {
    const s = getSessionUser(req);
    const b = req.body || {};
    if (!b.name || !b.city || !b.area || !b.price) return res.status(400).json({ error: 'Name, city, area and price are required.' });
    const city = normaliseCity(b.city);
    if (!LISTINGS[city]) LISTINGS[city] = [];
    b.id = b.id || Date.now();
    b.ownerId = (s && s.user && s.user.id) ? s.user.id : (b.ownerId || b.userId || '');
    b.ownerEmail = (s && s.user && s.user.email) ? s.user.email.toLowerCase() : (b.ownerEmail ? String(b.ownerEmail).trim().toLowerCase() : '');
    
    if (!LISTINGS[city].some(p => String(p.id) === String(b.id))) {
      LISTINGS[city].unshift(b);
    }
    saveListingToDisk(b);

    return res.status(201).json({ success: true, listing: b });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
