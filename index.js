// Vercel entrypoint - redirects root to login page
module.exports = (req, res) => {
  res.writeHead(302, { Location: '/login.html' });
  res.end();
};
