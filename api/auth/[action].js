const crypto = require('crypto');
const supabase = require('../_supabase');
function hash(p) { return crypto.createHash('sha256').update(p + '_rentright_salt').digest('hex'); }
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}
module.exports = async function(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const action = req.query.action;
  if (action === 'register' && req.method === 'POST') {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
    const ce = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(ce)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const r = role === 'admin' ? 'admin' : 'user';
    const { data, error } = await supabase.from('users').insert([{ name: name.trim(), email: ce, password_hash: hash(password), role: r }]).select().single();
    if (error) return res.status(400).json({ error: error.message.includes('unique') ? 'An account with this email already exists.' : error.message });
    return res.status(201).json({ success: true, token: data.id, user: { id: data.id, name: data.name, email: data.email, role: data.role } });
  }
  if (action === 'login' && req.method === 'POST') {
    const { email, password, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const ce = email.trim().toLowerCase();
    const { data: users } = await supabase.from('users').select('*').eq('email', ce).eq('password_hash', hash(password));
    if (!users || !users.length) return res.status(400).json({ error: 'Invalid email or password.' });
    const u = users[0];
    if (role && role !== u.role) return res.status(400).json({ error: 'This account is registered as a ' + u.role + '. Please log in using the correct role tab.' });
    return res.status(200).json({ success: true, token: u.id, user: { id: u.id, name: u.name, email: u.email, role: u.role } });
  }
  if (action === 'me' && req.method === 'GET') {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const { data: users } = await supabase.from('users').select('id,name,email,role').eq('id', token);
    if (!users || !users.length) return res.status(401).json({ error: 'Not authenticated' });
    return res.status(200).json({ user: users[0] });
  }
  if (action === 'logout') return res.status(200).json({ success: true });
  return res.status(404).json({ error: 'Not found' });
};