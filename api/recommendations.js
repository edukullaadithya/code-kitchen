const supabase = require('./_supabase');
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}
function norm(v) { return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]/g,''); }
function normCity(v) {
  const a = { bangalore:'bengaluru',bengaluru:'bengaluru',bombay:'mumbai',mumbai:'mumbai',
    hyderabad:'hyderabad',pune:'pune',chennai:'chennai',madras:'chennai',
    delhi:'delhi',delhincr:'delhi',ncr:'delhi',gurugram:'delhi',gurgaon:'delhi' };
  return a[norm(v)] || norm(v);
}
module.exports = async function(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const p = req.body || {};
  const city = normCity(p.city || 'bengaluru');
  const budget = Number(p.budget) || 0;
  const propertyType = norm(p.propertyType);
  const maxCommute = Number(p.maxCommute) > 0 ? Number(p.maxCommute) : 9999;
  const minSafety = Number.isFinite(Number(p.minSafety)) ? Math.min(5,Math.max(1,Number(p.minSafety)))*20 : 0;
  const reqAmenities = Array.isArray(p.amenities) ? p.amenities.map(norm).filter(Boolean) : [];
  const { data, error } = await supabase.from('listings').select('*').eq('city', city);
  if (error) return res.status(500).json({ error: error.message });
  const listings = (data || []).map(row => ({ id: row.id, name: row.name, area: row.area, city: row.city,
    type: row.type, price: row.price, score: row.score, distance: row.distance,
    commute: row.commute, ownerEmail: row.owner_email, tags: row.tags || [],
    amenities: row.amenities || [], scores: row.scores || {}, reviews: row.reviews || [],
    icon: row.icon, color: row.color, lat: row.lat, lng: row.lng }));
  const filtered = listings.filter(l => {
    const avail = (l.amenities || []).map(norm);
    const commuteMin = parseInt(l.commute,10) || 999;
    const safety = (l.scores && l.scores.safety) || 0;
    return (!propertyType || norm(l.type) === propertyType)
      && safety >= minSafety && commuteMin <= maxCommute
      && reqAmenities.every(a => avail.includes(a));
  }).map(l => {
    const commuteMin = parseInt(l.commute,10) || 90;
    const avail = (l.amenities || []).map(norm);
    const matched = reqAmenities.filter(a => avail.includes(a)).length;
    const amenityScore = reqAmenities.length ? (matched/reqAmenities.length)*8 : 0;
    const budgetScore = budget ? Math.max(-10,8-Math.abs(l.price-budget)/budget*12) : 0;
    const commuteScore = Math.max(-8, 6-Math.max(0,commuteMin-maxCommute)*0.5);
    const propScore = propertyType && norm(l.type)===propertyType ? 8 : 0;
    const matchScore = Math.round(Math.max(0,Math.min(100,l.score*0.7+amenityScore+budgetScore+commuteScore+propScore)));
    return { ...l, score: matchScore, matchedAmenities: matched };
  }).sort((a,b) => b.score-a.score || a.price-b.price);
  return res.status(200).json({ listings: filtered, count: filtered.length });
};