const supabase = require('./_supabase');
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}
module.exports = async function(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    let ownerEmail = req.query.ownerEmail || 'admin@rentright.com';
    if (token) {
      const { data: users } = await supabase.from('users').select('email').eq('id', token);
      if (users && users.length) ownerEmail = users[0].email;
    }
    const { data, error } = await supabase.from('inquiries').select('*').eq('owner_email', ownerEmail).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    const inquiries = (data || []).map(r => ({ id: r.id, listingId: r.listing_id, listingName: r.listing_name,
      ownerEmail: r.owner_email, userName: r.user_name, userEmail: r.user_email,
      phone: r.phone, moveInDate: r.move_in_date, message: r.message, createdAt: r.created_at }));
    return res.status(200).json({ inquiries });
  }
  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.listingName || !b.userName || !b.phone) return res.status(400).json({ error: 'Name, phone, and property name are required.' });
    const id = 'inq_' + Date.now();
    const { data, error } = await supabase.from('inquiries').insert([{
      id, listing_id: b.listingId || null, listing_name: b.listingName,
      owner_email: b.ownerEmail || 'admin@rentright.com',
      user_name: b.userName, user_email: b.userEmail || '', phone: b.phone,
      move_in_date: b.moveInDate || null, message: b.message || ''
    }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ success: true, inquiry: data });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};