function cors(res) {
  res.setHeader('Access-Control-Allow-Origin','*');
}
module.exports = function(req, res) {
  cors(res);
  res.setHeader('Content-Type','application/javascript');
  res.setHeader('Cache-Control','no-store');
  const config = {
    hereApiKey: process.env.HERE_API_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || ''
  };
  res.end('window.RENTRIGHT_CONFIG = ' + JSON.stringify(config) + ';');
};