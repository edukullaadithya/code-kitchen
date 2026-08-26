const supabase = require('./_supabase');
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}
function normaliseCity(v) {
  const a = { bangalore:'bengaluru',bengaluru:'bengaluru',bombay:'mumbai',mumbai:'mumbai',
    hyderabad:'hyderabad',pune:'pune',chennai:'chennai',madras:'chennai',
    delhi:'delhi',delhincr:'delhi',ncr:'delhi',gurugram:'delhi',gurgaon:'delhi' };
  return a[String(v||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'')] || String(v||'').trim().toLowerCase();
}
module.exports = async function(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    // Group by city for compatibility
    const grouped = {};
    for (const row of data) {
      const city = row.city || 'other';
      if (!grouped[city]) grouped[city] = [];
      const listing = { id: row.id, name: row.name, area: row.area, city: row.city,
        type: row.type, price: row.price, score: row.score, distance: row.distance,
        commute: row.commute, ownerEmail: row.owner_email, tags: row.tags || [],
        amenities: row.amenities || [], scores: row.scores || {}, reviews: row.reviews || [],
        icon: row.icon, color: row.color, lat: row.lat, lng: row.lng };
      grouped[city].push(listing);
    }
    return res.status(200).json({ listings: grouped });
  }
  if (req.method === 'POST') {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    let ownerEmail = (req.body || {}).ownerEmail || 'admin@rentright.com';
    if (token) {
      const { data: users } = await supabase.from('users').select('email').eq('id', token);
      if (users && users.length) ownerEmail = users[0].email;
    }
    const b = req.body || {};
    if (!b.name || !b.city || !b.area || !b.price) return res.status(400).json({ error: 'Name, city, area and price are required.' });
    const city = normaliseCity(b.city);
    const { data, error } = await supabase.from('listings').insert([{
      name: b.name, city: city, area: b.area, type: b.type || '1BHK',
      price: Number(b.price), score: b.score || 80, distance: b.distance || '1 km',
      commute: b.commute || '10 min', owner_email: ownerEmail,
      tags: b.tags || [], amenities: b.amenities || [], scores: b.scores || {},
      reviews: b.reviews || [], icon: b.icon || '🏢', color: b.color || '#6366f1',
      lat: b.lat || 0, lng: b.lng || 0
    }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ success: true, listing: { ...data, ownerEmail: data.owner_email } });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};