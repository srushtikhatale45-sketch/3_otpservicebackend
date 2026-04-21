const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const sendOTPviaSMS = async (phoneNumber, otpCode) => {
  try {
    const username = process.env.SMS_USERNAME;
    const password = process.env.SMS_PASSWORD;
    const senderId = process.env.SMS_SENDER;
    
    if (!username || !password) {
      console.log('⚠️ SMS credentials missing. Using simulated mode.');
      return { success: true, channel: 'sms', simulated: true };
    }
    
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const message = `Dear Customer Your OTP is : ${otpCode}. Rich Solutions`;
    
    const smsUrl = `https://www.smsjust.com/sms/user/urlsms.php?username=${username}&pass=${password}&senderid=${senderId}&dest_mobileno=${cleanNumber}&msgtype=TXT&message=${encodeURIComponent(message)}&response=Y`;
    
    console.log(`📤 Sending SMS to ${cleanNumber}: ${otpCode}`);
    
    const response = await axios.get(smsUrl, { timeout: 15000 });
    console.log(`✅ SMS API Response: ${response.data}`);
    
    const isSuccess = response.data && (
      response.data.includes('Success') || 
      response.data.includes('success') ||
      response.status === 200
    );
    
    return { 
      success: true, 
      channel: 'sms', 
      simulated: !isSuccess 
    };
  } catch (error) {
    console.error(`❌ SMS failed: ${error.message}`);
    return { success: true, channel: 'sms', simulated: true };
  }
};

module.exports = { sendOTPviaSMS };