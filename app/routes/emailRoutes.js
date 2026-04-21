const express = require('express');
const router = express.Router();
const { sendEmailOTP, verifyEmailOTP, resendEmailOTP } = require('../controllers/emailController');

router.post('/send-otp', sendEmailOTP);
router.post('/verify-otp', verifyEmailOTP);
router.post('/resend-otp', resendEmailOTP);

module.exports = router;