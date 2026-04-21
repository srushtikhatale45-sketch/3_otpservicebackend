const { Op } = require('sequelize');
const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendOTPviaWhatsApp } = require('../services/whatsappService');
const jwt = require('jsonwebtoken');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send WhatsApp OTP
const sendWhatsAppOTP = async (req, res) => {
  try {
    console.log('\n🔵 ===== WHATSAPP OTP REQUEST =====');
    console.log('Request Body:', req.body);
    
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid phone number required' });
    }

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    console.log(`✅ Generated OTP: ${otpCode} for ${cleanNumber}`);
    
    // Save to database
    await OTP.destroy({ where: { contact: cleanNumber, isVerified: false, channel: 'whatsapp' } });
    await OTP.create({
      contact: cleanNumber,
      otpCode: otpCode,
      channel: 'whatsapp',
      expiresAt: expiresAt,
      attempts: 0
    });
    
    const result = await sendOTPviaWhatsApp(cleanNumber, otpCode);

if (!result.success) {
  return res.status(500).json({
    success: false,
    message: 'Failed to send WhatsApp OTP'
  });
}

res.json({
  success: true,
  message: 'WhatsApp OTP sent successfully',
  channel: 'whatsapp'
});
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Verify WhatsApp OTP
const verifyWhatsAppOTP = async (req, res) => {
  try {
    const { phoneNumber, otpCode, name } = req.body;
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    const otpRecord = await OTP.findOne({
      where: {
        contact: cleanNumber,
        channel: 'whatsapp',
        isVerified: false,
        expiresAt: { [Op.gt]: new Date() }
      }
    });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, verified: false, message: 'Invalid or expired OTP' });
    }
    
    if (otpRecord.otpCode !== otpCode) {
      await otpRecord.update({ attempts: otpRecord.attempts + 1 });
      return res.status(400).json({ success: false, verified: false, message: 'Invalid OTP' });
    }
    
    await otpRecord.update({ isVerified: true });
    
    let user = await User.findOne({ where: { mobileNumber: cleanNumber } });
    if (!user) {
      user = await User.create({
        name: name || 'User',
        mobileNumber: cleanNumber,
        isVerified: true,
        preferredChannel: 'whatsapp'
      });
    }
    
    const token = jwt.sign(
      { id: user.id, mobileNumber: user.mobileNumber },
      process.env.ACCESS_TOKEN_SECRET || 'secret',
      { expiresIn: '15m' }
    );
    
    res.cookie('accessToken', token, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    
    res.json({
      success: true,
      verified: true,
      message: 'OTP verified successfully',
      channel: 'whatsapp',
      user
    });
    
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// Resend WhatsApp OTP
const resendWhatsAppOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const otpCode = generateOTP();
    
    await OTP.destroy({ where: { contact: cleanNumber, isVerified: false, channel: 'whatsapp' } });
    await OTP.create({
      contact: cleanNumber,
      otpCode: otpCode,
      channel: 'whatsapp',
      expiresAt: new Date(Date.now() + 5 * 60000),
      attempts: 0
    });
    
    await sendOTPviaWhatsApp(cleanNumber, otpCode);
    
    res.json({ success: true, message: 'OTP resent successfully', channel: 'whatsapp' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resend' });
  }
};

module.exports = { sendWhatsAppOTP, verifyWhatsAppOTP, resendWhatsAppOTP };