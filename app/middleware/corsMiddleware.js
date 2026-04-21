// middleware/corsMiddleware.js
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://otpfrontend-sigma.vercel.app'
];

const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // For development, you can also allow no origin
    if (!origin) {
      res.header('Access-Control-Allow-Origin', '*');
    }
  }
  
  // Essential CORS headers
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-Type, Accept, Origin');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling preflight request for:', req.url);
    return res.sendStatus(200); // Send 200 for preflight
  }
  
  next();
};

module.exports = corsMiddleware;