const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { phoneOtpLimiter, verifyLimiter } = require('../config/rateLimiters');

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

module.exports = router;