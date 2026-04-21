const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('\n📱 WhatsApp Service Initialized:');
console.log(`   API Key: ${process.env.PINBOT_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   Phone Number ID: ${process.env.PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing'}`);

const sendOTPviaWhatsApp = async (phoneNumber, otpCode) => {
  console.log('\n🔵 ===== SENDING WHATSAPP OTP =====');
  console.log(`📞 Phone: ${phoneNumber}`);
  console.log(`🔑 OTP: ${otpCode}`);
  
  const apiKey = process.env.PINBOT_API_KEY;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  
  if (!apiKey || !phoneNumberId) {
    console.log('⚠️ Missing API credentials');
    return { success: true, channel: 'whatsapp', simulated: true };
  }

  try {
    // Format phone number (add 91 for India if 10 digits)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const finalNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
   const toNumber = finalNumber.toString(); 
    
    const apiUrl = `https://partnersv1.pinbot.ai/v3/${phoneNumberId}/messages`;
    
    console.log(`📍 API URL: ${apiUrl}`);
    console.log(`📱 To: ${toNumber}`);
    
    const requestBody = {
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to: toNumber,
  type: "template",
  template: {
    name: "auth_template_001",   // ✅ must match exactly
    language: {
      code: "en"
    },
    components: [
      {
        type: "body",
        parameters: [
          {
            type: "text",
            text: otpCode.toString()  // 🔥 dynamic OTP
          }
        ]
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [
          {
            type: "payload",
            payload: ""   // keep empty if not used
          }
        ]
      }
    ]
  }
};
    
    console.log(`📦 Request Body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      timeout: 30000
    });
    
    console.log('✅ WhatsApp sent successfully!');
    console.log('📨 Response:', JSON.stringify(response.data, null, 2));
    
    return { success: true, channel: 'whatsapp', simulated: false };
    
  } catch (error) {
  console.error('❌ WhatsApp Error:');

  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  } else {
    console.error('Message:', error.message);
  }

  // ❌ DO NOT RETURN success true
  return { success: false, channel: 'whatsapp', simulated: true };
}
};

module.exports = { sendOTPviaWhatsApp };