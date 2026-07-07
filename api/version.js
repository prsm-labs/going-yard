// api/version.js
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.json({
    buildTime: process.env.VITE_BUILD_TIME || 'unknown',
  });
}
