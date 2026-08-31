const { USERS, setCorsHeaders, getSessionUser, updateUserOnDisk, deleteUserFromDisk, loadDiskUsers } = require('../../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const s = getSessionUser(req);
  if (!s || !s.user || s.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
  }

  const targetUserId = req.query.id;
  if (!targetUserId) return res.status(400).json({ error: 'User ID is required.' });

  // ===== PUT: UPDATE USER ROLE / STATUS =====
  if (req.method === 'PUT') {
    const body = req.body || {};
    const updates = {};
    if (body.role && (body.role === 'admin' || body.role === 'user')) updates.role = body.role;
    if (body.status && (body.status === 'active' || body.status === 'suspended')) updates.status = body.status;
    updates.updatedAt = new Date().toISOString();

    const idx = USERS.findIndex(u => String(u.id) === String(targetUserId));
    if (idx !== -1) {
      USERS[idx] = Object.assign({}, USERS[idx], updates);
    }
    const updated = updateUserOnDisk(targetUserId, updates);
    if (!updated && idx === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ success: true, message: 'User updated successfully.', user: updated || USERS[idx] });
  }

  // ===== DELETE: REMOVE USER =====
  if (req.method === 'DELETE') {
    // Prevent admin self-deletion
    if (String(s.user.id) === String(targetUserId)) {
      return res.status(400).json({ error: 'You cannot delete your own administrator account.' });
    }

    const idx = USERS.findIndex(u => String(u.id) === String(targetUserId));
    if (idx !== -1) USERS.splice(idx, 1);
    deleteUserFromDisk(targetUserId);

    return res.status(200).json({ success: true, message: 'User account removed.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
