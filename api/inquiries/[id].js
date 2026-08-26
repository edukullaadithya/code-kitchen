const supabase = require('../_supabase');
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}
module.exports = async function(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('inquiries').delete().eq('id', req.query.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};