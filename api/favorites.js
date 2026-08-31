const { FAVORITES, LISTINGS, setCorsHeaders, getSessionUser, saveFavoriteToDisk, removeFavoriteFromDisk, loadDiskFavorites } = require('./_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const s = getSessionUser(req);
  const query = req.query || {};
  const body = req.body || {};
  const userId = (s && s.user && s.user.id) ? s.user.id : (query.userId || body.userId || 'guest');
  const userEmail = (s && s.user && s.user.email) ? s.user.email.toLowerCase() : (query.userEmail || body.userEmail || '');

  // ===== GET: FETCH USER FAVORITES =====
  if (req.method === 'GET') {
    const disk = loadDiskFavorites();
    const userFavs = disk.filter(f => 
      (userId && String(f.userId) === String(userId)) || 
      (userEmail && f.userEmail && String(f.userEmail).toLowerCase() === userEmail)
    );

    // Enrich with full listing details if available
    const enriched = userFavs.map(fav => {
      let listingDetails = null;
      for (const city of Object.keys(LISTINGS)) {
        const found = (LISTINGS[city] || []).find(l => String(l.id) === String(fav.listingId || fav.id));
        if (found) { listingDetails = found; break; }
      }
      return {
        ...fav,
        listing: listingDetails || fav.listing || null
      };
    });

    return res.status(200).json({ favorites: enriched, count: enriched.length });
  }

  // ===== POST: ADD TO FAVORITES =====
  if (req.method === 'POST') {
    const body = req.body || {};
    const listingId = body.listingId || body.id;
    if (!listingId) return res.status(400).json({ error: 'listingId is required.' });

    // Look up listing
    let property = body.listing || null;
    if (!property) {
      for (const city of Object.keys(LISTINGS)) {
        const found = (LISTINGS[city] || []).find(l => String(l.id) === String(listingId));
        if (found) { property = found; break; }
      }
    }

    const favRecord = {
      id: 'fav_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      listingId: String(listingId),
      userId: String(userId),
      userEmail: userEmail,
      propertyName: property ? property.name : (body.propertyName || 'Saved Property'),
      city: property ? property.city : (body.city || ''),
      price: property ? property.price : (body.price || 0),
      image: property ? property.image : (body.image || ''),
      listing: property,
      savedAt: new Date().toISOString()
    };

    saveFavoriteToDisk(favRecord);
    if (!FAVORITES.some(f => String(f.listingId) === String(listingId) && String(f.userId) === String(userId))) {
      FAVORITES.unshift(favRecord);
    }

    return res.status(201).json({ success: true, favorite: favRecord });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
