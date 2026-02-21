const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { phoneOtpLimiter, verifyLimiter } = require('../config/rateLimiters');
import { sendEmail } from "../utils/sendEmail.js";


// Import Validator
const { validateRequest, schemas } = require('../utils/validators');

// --- Routes ---

// Phone
router.post(
  '/request-otp', 
  phoneOtpLimiter, 
  validateRequest(schemas.requestPhoneOtp), // <--- Added Here
  controller.requestPhoneOtp
);

router.post(
  '/verify-otp', 
  verifyLimiter, 
  validateRequest(schemas.verifyPhoneOtp), 
  controller.verifyPhoneOtp
);

// Email
router.post(
  '/request-email-verification', 
  validateRequest(schemas.requestEmailVerification), 
  controller.requestEmailVerification
);

router.post(
  '/verify-email', 
  validateRequest(schemas.verifyEmail), 
  controller.verifyEmail
);

// Tokens
router.post(
  '/refresh-token', 
  validateRequest(schemas.refreshToken), 
  controller.refreshToken
);

router.post(
  '/logout', 
  validateRequest(schemas.logout), 
  controller.logout
);
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);

    const html = `
      <h2>Your OTP Code</h2>
      <p>Your verification code is:</p>
      <h1>${otp}</h1>
      <p>This expires in 5 minutes.</p>
    `;

    await sendEmail(email, "Your OTP Code", html);

    res.json({
      success: true,
      message: "OTP sent successfully",
      otp // remove in production
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to send email"
    });
  }
});


module.exports = router;
