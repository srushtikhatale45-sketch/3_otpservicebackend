const { sendOTPEmail } = require('../config/email');
const dotenv = require('dotenv');

dotenv.config();

const sendOTPviaEmail = async (email, otpCode) => {
  try {
    console.log(`📤 Sending Email OTP to ${email}: ${otpCode}`);
    
    const result = await sendOTPEmail(email, otpCode);
    
    if (result.success) {
      console.log('✅ Email OTP sent successfully');
      return { success: true, channel: 'email' };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    return { success: true, channel: 'email', simulated: true };
  }
};

module.exports = { sendOTPviaEmail };