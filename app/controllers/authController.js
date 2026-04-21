const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

const checkAuth = async (req, res) => {
  try {
    if (req.user) {
      res.status(200).json({ success: true, authenticated: true, user: req.user });
    } else {
      res.status(200).json({ success: true, authenticated: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, authenticated: false, error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user) await req.user.update({ refreshToken: null });
    clearTokenCookies(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to logout', error: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });
    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      clearTokenCookies(res);
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }
    
    const user = await User.findByPk(decoded.id);
    if (!user || !(await user.verifyRefreshToken(refreshToken))) {
      clearTokenCookies(res);
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }
    
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    await user.hashRefreshToken(newRefreshToken);
    setTokenCookies(res, newAccessToken, newRefreshToken);
    
    res.status(200).json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to refresh token', error: error.message });
  }
};

module.exports = { checkAuth, logout, refreshToken };