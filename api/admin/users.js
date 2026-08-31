const { USERS, setCorsHeaders, getSessionUser, loadDiskUsers } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const s = getSessionUser(req);
  if (!s || !s.user || s.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
  }

  if (req.method === 'GET') {
    const diskUsers = loadDiskUsers();
    const allUsers = (diskUsers.length > 0 ? diskUsers : USERS).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      preferredCity: u.preferredCity || '',
      status: u.status || 'active',
      createdAt: u.createdAt || ''
    }));

    const roleFilter = req.query && req.query.role;
    const filtered = roleFilter ? allUsers.filter(u => u.role === roleFilter) : allUsers;

    return res.status(200).json({
      users: filtered,
      totalCount: filtered.length,
      adminsCount: allUsers.filter(u => u.role === 'admin').length,
      rentersCount: allUsers.filter(u => u.role === 'user').length
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
