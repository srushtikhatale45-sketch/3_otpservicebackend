const axios = require('axios');
require('dotenv').config();

async function testTemplate() {
  console.log('🔍 Testing WhatsApp Template\n');
  
  const apiKey = process.env.PINBOT_API_KEY;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  const testNumber = '8412005368';
  const otpCode = '123456';
  
  const cleanNumber = testNumber.replace(/\D/g, '');
  const formattedNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
  const toNumber = parseInt(formattedNumber);
  const apiUrl = `https://partnersv1.pinbot.ai/v3/${phoneNumberId}/messages`;
  
  const requestBody = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toNumber,
    type: "template",
    template: {
      name: "auth_template_001",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: otpCode }]
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "payload", payload: "" }]
        }
      ]
    }
  };
  
  console.log('📤 Sending template message...');
  console.log('Template:', requestBody.template.name);
  console.log('OTP:', otpCode);
  
  try {
    const response = await axios.post(apiUrl, requestBody, {
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
      timeout: 30000
    });
    
    console.log('\n✅ Template working! Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Template error:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n⚠️ Template "auth_template_001" may not be approved.');
      console.log('   Please check your PinBot dashboard and ensure:');
      console.log('   1. The template "auth_template_001" exists');
      console.log('   2. The template is approved');
      console.log('   3. The template has the correct format');
    }
  }
}

testTemplate();