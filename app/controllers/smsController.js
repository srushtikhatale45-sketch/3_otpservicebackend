const { Op } = require('sequelize');
const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendOTPviaSMS } = require('../services/smsService');
const jwt = require('jsonwebtoken');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, mobileNumber: user.mobileNumber, name: user.name },
    process.env.ACCESS_TOKEN_SECRET || 'your_super_secret_access_token_key_change_this',
    { expiresIn: '15m' }
  );
};

const setTokenCookie = (res, token) => {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000
  });
};

// Send OTP - NO OTP IN RESPONSE
const sendSMSOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid phone number is required' 
      });
    }

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    // Delete old OTPs
    if (OTP) {
      await OTP.destroy({ 
        where: { contact: cleanNumber, isVerified: false, channel: 'sms' } 
      });
      
      // Save new OTP
      await OTP.create({
        contact: cleanNumber,
        otpCode: otpCode,
        channel: 'sms',
        expiresAt: expiresAt,
        attempts: 0
      });
    }
    
    // Send SMS
    const result = await sendOTPviaSMS(cleanNumber, otpCode);
    
    // ✅ REMOVED: devOtp from response - OTP never sent to frontend
    res.json({
      success: true,
      message: 'OTP sent successfully',
      channel: 'sms',
      simulated: result.simulated
    });
    
  } catch (error) {
    console.error('Send SMS OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Verify OTP
const verifySMSOTP = async (req, res) => {
  try {
    const { phoneNumber, otpCode, name } = req.body;
    
    if (!phoneNumber || !otpCode) {
      return res.status(400).json({ 
        success: false, 
        verified: false, 
        message: 'Phone number and OTP code are required' 
      });
    }
    
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    let isValid = false;
    let user = null;
    
    // Verify OTP from database
    if (OTP) {
      const otpRecord = await OTP.findOne({
        where: {
          contact: cleanNumber,
          channel: 'sms',
          isVerified: false,
          expiresAt: { [Op.gt]: new Date() }
        },
        order: [['createdAt', 'DESC']]
      });
      
      if (otpRecord && otpRecord.otpCode === otpCode) {
        isValid = true;
        await otpRecord.update({ isVerified: true });
        
        // Find or create user
        user = await User.findOne({ where: { mobileNumber: cleanNumber } });
        if (!user) {
          user = await User.create({
            name: name || 'User',
            mobileNumber: cleanNumber,
            isVerified: true,
            preferredChannel: 'sms'
          });
        } else {
          await user.update({ isVerified: true });
        }
      } else if (otpRecord) {
        await otpRecord.update({ attempts: otpRecord.attempts + 1 });
      }
    } else {
      // Fallback for testing - but still don't expose OTP
      isValid = (otpCode && otpCode.length === 6);
    }
    
    if (isValid) {
      // Generate token
      const token = generateAccessToken(user || { id: 'test', mobileNumber: cleanNumber, name: name || 'User' });
      setTokenCookie(res, token);
      
      res.json({
        success: true,
        verified: true,
        message: 'OTP verified successfully',
        channel: 'sms',
        user: user || {
          id: 'test-id',
          name: name || 'User',
          mobileNumber: cleanNumber,
          isVerified: true,
          preferredChannel: 'sms'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        message: 'Invalid or expired OTP'
      });
    }
    
  } catch (error) {
    console.error('Verify SMS OTP error:', error);
    res.status(500).json({ success: false, verified: false, message: 'Verification failed' });
  }
};

// Resend OTP - NO OTP IN RESPONSE
const resendSMSOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    // Check rate limiting (30 seconds)
    if (OTP) {
      const recentOTP = await OTP.findOne({
        where: {
          contact: cleanNumber,
          channel: 'sms',
          createdAt: { [Op.gt]: new Date(Date.now() - 30000) }
        }
      });
      
      if (recentOTP) {
        return res.status(429).json({ 
          success: false, 
          message: 'Please wait 30 seconds before requesting another OTP' 
        });
      }
      
      await OTP.destroy({ where: { contact: cleanNumber, isVerified: false, channel: 'sms' } });
      await OTP.create({
        contact: cleanNumber,
        otpCode: otpCode,
        channel: 'sms',
        expiresAt: expiresAt,
        attempts: 0
      });
    }
    
    await sendOTPviaSMS(cleanNumber, otpCode);
    
    // ✅ REMOVED: devOtp from response
    res.json({
      success: true,
      message: 'OTP resent successfully',
      channel: 'sms'
    });
    
  } catch (error) {
    console.error('Resend SMS OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
};

module.exports = { sendSMSOTP, verifySMSOTP, resendSMSOTP };