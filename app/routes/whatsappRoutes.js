const express = require('express');
const router = express.Router();
const { sendWhatsAppOTP, verifyWhatsAppOTP, resendWhatsAppOTP } = require('../controllers/whatsappController');

// WhatsApp OTP routes
router.post('/send-otp', sendWhatsAppOTP);
router.post('/verify-otp', verifyWhatsAppOTP);
router.post('/resend-otp', resendWhatsAppOTP);

module.exports = router;