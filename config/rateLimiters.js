const rateLimit = require('express-rate-limit');

exports.phoneOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests
  message: { success: false, message: "Too many requests, please try again later." }
});

exports.verifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many verification attempts." }
});