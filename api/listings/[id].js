const { LISTINGS, setCorsHeaders, getSessionUser, updateListingOnDisk, deleteListingFromDisk, normaliseCity } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const idToTarget = req.query.id;
  if (!idToTarget) return res.status(400).json({ error: 'Property ID is required.' });

  // ===== PUT: UPDATE LISTING =====
  if (req.method === 'PUT') {
    const s = getSessionUser(req);
    const body = req.body || {};
    let found = null;
    let foundCity = null;

    for (const city of Object.keys(LISTINGS)) {
      const idx = LISTINGS[city].findIndex(item => String(item.id) === String(idToTarget));
      if (idx !== -1) {
        found = LISTINGS[city][idx];
        foundCity = city;
        
        // Check authorization if property has an owner
        const hasSession = s && s.user;
        if (hasSession && found.ownerEmail) {
          const isOwner = s.user.email && String(s.user.email).toLowerCase() === String(found.ownerEmail).toLowerCase();
          const isAdmin = s.user.role === 'admin';
          if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'You do not have permission to edit this property.' });
          }
        }

        // Apply updates
        const updated = Object.assign({}, found, body, {
          id: found.id,
          updatedAt: new Date().toISOString()
        });

        // If city changed, move to new city key
        if (body.city && normaliseCity(body.city) !== foundCity) {
          LISTINGS[city].splice(idx, 1);
          const newCity = normaliseCity(body.city);
          if (!LISTINGS[newCity]) LISTINGS[newCity] = [];
          LISTINGS[newCity].unshift(updated);
        } else {
          LISTINGS[city][idx] = updated;
        }

        updateListingOnDisk(found.id, updated);
        return res.status(200).json({ success: true, listing: updated });
      }
    }

    return res.status(404).json({ error: 'Listing not found.' });
  }

  // ===== DELETE: REMOVE LISTING =====
  if (req.method === 'DELETE') {
    for (const city of Object.keys(LISTINGS)) {
      const idx = LISTINGS[city].findIndex(item => String(item.id) === String(idToTarget));
      if (idx !== -1) {
        const removed = LISTINGS[city].splice(idx, 1);
        deleteListingFromDisk(idToTarget);
        return res.status(200).json({ success: true, removed: removed[0] });
      }
    }
    return res.status(404).json({ error: 'Listing not found.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
