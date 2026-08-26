const supabase = require('../supabase');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'rentright_salt').digest('hex');
}

module.exports = async function(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  const pwHash = hashPassword(password);
  const { data, error } = await supabase.from('users').insert([{ name, email, password_hash: pwHash, role }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ success: true, user: { id: data.id, name: data.name, email: data.email, role: data.role }, token: data.id });
};
