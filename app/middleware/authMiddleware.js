const { verifyAccessToken } = require('../config/jwt');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
    
    const decoded = verifyAccessToken(token);
    if (!decoded) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authentication error', error: error.message });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await User.findByPk(decoded.id);
        if (user) req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticateToken, optionalAuth };