const { LISTINGS, setCorsHeaders, getSessionUser, loadDiskUsers, loadDiskListings, loadDiskInquiries, loadDiskFavorites } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const s = getSessionUser(req);
  if (!s || !s.user || s.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
  }

  if (req.method === 'GET') {
    const users = loadDiskUsers();
    const diskListings = loadDiskListings();
    const inquiries = loadDiskInquiries();
    const favorites = loadDiskFavorites();

    // Total active properties across in-memory and disk
    const allProps = [];
    Object.keys(LISTINGS).forEach(city => {
      (LISTINGS[city] || []).forEach(p => allProps.push(p));
    });
    diskListings.forEach(dp => {
      if (!allProps.some(p => String(p.id) === String(dp.id))) {
        allProps.push(dp);
      }
    });

    // Breakdown by City
    const cityBreakdown = {};
    allProps.forEach(p => {
      const c = (p.city || 'other').toLowerCase();
      cityBreakdown[c] = (cityBreakdown[c] || 0) + 1;
    });

    // Average Rent Price
    const totalRent = allProps.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const avgRent = allProps.length > 0 ? Math.round(totalRent / allProps.length) : 0;

    // Inquiry status breakdown
    const inquiryStatus = {
      pending: inquiries.filter(i => !i.status || i.status === 'pending').length,
      confirmed: inquiries.filter(i => i.status === 'confirmed').length,
      completed: inquiries.filter(i => i.status === 'completed').length,
      declined: inquiries.filter(i => i.status === 'declined').length
    };

    return res.status(200).json({
      summary: {
        totalListings: allProps.length,
        totalUsers: users.length,
        totalInquiries: inquiries.length,
        totalFavorites: favorites.length,
        averageRent: avgRent
      },
      cityDistribution: cityBreakdown,
      inquiryStatusBreakdown: inquiryStatus,
      recentActivity: {
        recentInquiries: inquiries.slice(0, 5),
        recentUsers: users.slice(-5).reverse()
      },
      generatedAt: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
