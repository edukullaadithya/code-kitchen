const { USERS, SESSIONS, hashPassword, setCorsHeaders } = require('../_shared/data');
const crypto = require('crypto');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const action = req.query.action;

  if (action === 'register' && req.method === 'POST') {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
    const cleanEmail = email.trim().toLowerCase();
    if (USERS.some(u => u.email === cleanEmail)) return res.status(400).json({ error: 'An account with this email already exists.' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: hashPassword(password),
      role: role === 'admin' ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };
    USERS.push(newUser);
    const token = crypto.randomUUID();
    const userPayload = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    SESSIONS.set(token, userPayload);
    return res.status(201).json({ success: true, token, user: userPayload });
  }

  if (action === 'login' && req.method === 'POST') {
    const { email, password, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const cleanEmail = email.trim().toLowerCase();
    const hashed = hashPassword(password);
    const user = USERS.find(u => u.email === cleanEmail && u.password === hashed);
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
    if (role && role !== user.role) return res.status(400).json({ error: 'This account is registered as a ' + user.role + '. Please log in using the correct role tab.' });
    const token = crypto.randomUUID();
    const userPayload = { id: user.id, name: user.name, email: user.email, role: user.role };
    SESSIONS.set(token, userPayload);
    return res.status(200).json({ success: true, token, user: userPayload });
  }

  if (action === 'me' && req.method === 'GET') {
    const s = require('../_shared/data').getSessionUser(req);
    if (!s || !s.user) return res.status(401).json({ error: 'Not authenticated' });
    return res.status(200).json({ user: s.user });
  }

  if (action === 'logout') {
    const s = require('../_shared/data').getSessionUser(req);
    if (s && s.token) SESSIONS.delete(s.token);
    return res.status(200).json({ success: true });
  }

  return res.status(404).json({ error: 'Not found' });
};
