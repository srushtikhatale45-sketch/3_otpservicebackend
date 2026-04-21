const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html, text = null) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

const sendOTPEmail = async (email, otpCode) => {
  const subject = 'Your OTP Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4F46E5; text-align: center;">OTP Verification</h2>
      <p style="font-size: 16px; color: #333;">Hello,</p>
      <p style="font-size: 16px; color: #333;">Your OTP verification code is:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 10px 20px; border-radius: 5px;">${otpCode}</span>
      </div>
      <p style="font-size: 14px; color: #666;">This code is valid for 5 minutes.</p>
      <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">© 2024 OTP Verification System. All rights reserved.</p>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};

module.exports = { sendEmail, sendOTPEmail };