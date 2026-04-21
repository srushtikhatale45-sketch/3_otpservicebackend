const { Op } = require('sequelize');
const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendOTPviaEmail } = require('../services/emailService');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    await OTP.destroy({ where: { contact: cleanEmail, isVerified: false, channel: 'email' } });
    await OTP.create({ contact: cleanEmail, otpCode, channel: 'email', expiresAt, attempts: 0 });
    
    await sendOTPviaEmail(cleanEmail, otpCode);
    
    res.status(200).json({ success: true, message: 'Email OTP sent successfully', channel: 'email' });
  } catch (error) {
    console.error('Send Email OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send Email OTP', error: error.message });
  }
};

const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otpCode, name } = req.body;
    
    if (!email || !otpCode) {
      return res.status(400).json({ success: false, verified: false, message: 'Email and OTP code are required' });
    }
    
    const cleanEmail = email.toLowerCase().trim();
    
    const otpRecord = await OTP.findOne({
      where: { contact: cleanEmail, channel: 'email', isVerified: false, expiresAt: { [Op.gt]: new Date() } },
      order: [['createdAt', 'DESC']]
    });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, verified: false, message: 'No valid OTP found. Please request a new OTP.' });
    }
    
    if (otpRecord.attempts >= 5) {
      await otpRecord.destroy();
      return res.status(400).json({ success: false, verified: false, message: 'Too many failed attempts. Please request a new OTP.' });
    }
    
    if (otpRecord.otpCode === otpCode) {
      await otpRecord.update({ isVerified: true });
      
      let user = await User.findOne({ where: { email: cleanEmail } });
      
      if (!user) {
        user = await User.create({ name: name || 'User', email: cleanEmail, isVerified: true, preferredChannel: 'email' });
      } else {
        await user.update({ isVerified: true, preferredChannel: 'email' });
      }
      
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      await user.hashRefreshToken(refreshToken);
      await user.update({ lastLogin: new Date() });
      setTokenCookies(res, accessToken, refreshToken);
      
      return res.status(200).json({
        success: true, verified: true, message: 'Email verified successfully via Email', channel: 'email',
        user: { id: user.id, name: user.name, email: user.email, isVerified: true, preferredChannel: user.preferredChannel }
      });
    } else {
      await otpRecord.update({ attempts: otpRecord.attempts + 1 });
      const remaining = 5 - (otpRecord.attempts + 1);
      return res.status(400).json({ success: false, verified: false, message: `Invalid OTP. ${remaining} attempts remaining.` });
    }
  } catch (error) {
    console.error('Verify Email OTP error:', error);
    res.status(500).json({ success: false, verified: false, message: 'Failed to verify OTP', error: error.message });
  }
};

const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    
    const cleanEmail = email.toLowerCase().trim();
    
    const recentOTP = await OTP.findOne({
      where: { contact: cleanEmail, channel: 'email', createdAt: { [Op.gt]: new Date(Date.now() - 30000) } }
    });
    
    if (recentOTP) {
      return res.status(429).json({ success: false, message: 'Please wait 30 seconds before requesting another OTP' });
    }
    
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    await OTP.destroy({ where: { contact: cleanEmail, isVerified: false, channel: 'email' } });
    await OTP.create({ contact: cleanEmail, otpCode, channel: 'email', expiresAt, attempts: 0 });
    await sendOTPviaEmail(cleanEmail, otpCode);
    
    res.status(200).json({ success: true, message: 'Email OTP resent successfully', channel: 'email' });
  } catch (error) {
    console.error('Resend Email OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP', error: error.message });
  }
};

module.exports = { sendEmailOTP, verifyEmailOTP, resendEmailOTP };