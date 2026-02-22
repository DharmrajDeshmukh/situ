// const User = require('../models/User');
// const Otp = require('../models/Otp');
// const RefreshToken = require('../models/RefreshToken');
// const { hashData, verifyHash, generateTokens, generateOTP } = require('../utils/helpers');
// const { sendSMS, sendEmail } = require('../utils/senders');

// // --- 1. Request Phone OTP ---
// exports.requestPhoneOtp = async (req, res) => {
//   try {
//     const { phone } = req.body;
//     // 1. Validation (Basic check, use Joi in prod)
//     if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });

//     // 2. Rate Limit (Handled by middleware, but logically here)
    
//     // 3. Generate & Hash OTP
//     const otp = generateOTP();
//     const hashed_otp = await hashData(otp);

//     // 4. Store (Upsert: Update if exists, else Create)
//     await Otp.findOneAndUpdate(
//       { identifier: phone, type: 'phone' },
//       { hashed_otp, attempts: 0, createdAt: new Date() }, // Reset time
//       { upsert: true, new: true }
//     );

//     // 5. Send SMS
//     await sendSMS(phone, otp);

//     res.status(200).json({
//       success: true,
//       message: 'OTP sent to phone',
//       otp_expires_in_seconds: 300
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// // --- 2. Verify Phone OTP ---
// exports.verifyPhoneOtp = async (req, res) => {
//   try {
//     const { phone, otp, device_id } = req.body;

//     // 1. Find OTP Record
//     const otpRecord = await Otp.findOne({ identifier: phone, type: 'phone' });
    
//     // 2. Check Existence & Expiry (handled by MongoDB TTL)
//     if (!otpRecord) return res.status(410).json({ success: false, message: 'OTP expired or invalid' });

//     // 3. Check Attempts
//     if (otpRecord.attempts >= 3) {
//       return res.status(403).json({ success: false, message: 'Max attempts exceeded' });
//     }

//     // 4. Validate OTP
//     const isValid = await verifyHash(otp, otpRecord.hashed_otp);
//     if (!isValid) {
//       otpRecord.attempts += 1;
//       await otpRecord.save();
//       return res.status(400).json({ success: false, message: 'Invalid OTP' });
//     }

//     // 5. Success Logic: Find or Create User
//     let user = await User.findOne({ phone });
//     if (!user) {
//       user = await User.create({ phone, is_phone_verified: true });
//     } else {
//       user.is_phone_verified = true;
//       await user.save();
//     }

//     // 6. Generate Tokens
//     const { accessToken, refreshToken } = generateTokens(user);

//     // 7. Store Refresh Token Hash
//     await RefreshToken.create({
//       user_id: user._id,
//       token_hash: await hashData(refreshToken),
//       device_id
//     });

//     // 8. Cleanup OTP
//     await Otp.deleteOne({ _id: otpRecord._id });

//     res.status(200).json({
//       success: true,
//       message: 'OTP verified',
//       access_token: accessToken,
//       refresh_token: `${tokenDoc._id}.${refreshToken}`,

//       user: {
//         user_id: user._id,
//         phone: user.phone,
//         is_phone_verified: user.is_phone_verified
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// // --- 3. Request Email Verification ---
// exports.requestEmailVerification = async (req, res) => {
//   try {
//     const { email } = req.body;
    
//     // 1. Allowlist Check (Configurable)
//     const allowedDomains = ['gmail.com', 'outlook.com', 'example.com'];
//     const domain = email.split('@')[1];
//     if (!allowedDomains.includes(domain)) {
//       return res.status(400).json({ success: false, message: 'Domain not allowed' });
//     }

//     // 2. Generate Code
//     const code = generateOTP(); // Reusing numeric OTP for simplicity, can be alpha-numeric
//     const hashed_code = await hashData(code);

//     // 3. Store
//     await Otp.findOneAndUpdate(
//       { identifier: email, type: 'email' },
//       { hashed_otp: hashed_code, attempts: 0, createdAt: new Date() },
//       { upsert: true }
//     );

//     // 4. Send Email
//     await sendEmail(email, code);

//     res.status(200).json({
//       success: true,
//       message: 'Verification email sent',
//       email_expires_in_seconds: 900
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// // --- 4. Verify Email ---
// exports.verifyEmail = async (req, res) => {
//   try {
//     const { email, code } = req.body;

//     const record = await Otp.findOne({ identifier: email, type: 'email' });
//     if (!record) return res.status(410).json({ success: false, message: 'Code expired' });

//     const isValid = await verifyHash(code, record.hashed_otp);
//     if (!isValid) return res.status(400).json({ success: false, message: 'Invalid code' });

//     // Find or Create User
//     let user = await User.findOne({ email });
//     if (!user) {
//       user = await User.create({ email, is_email_verified: true });
//     } else {
//       user.is_email_verified = true;
//       await user.save();
//     }

//     const { accessToken, refreshToken } = generateTokens(user);
    
//     // Store refresh token
//     await RefreshToken.create({
//       user_id: user._id,
//       token_hash: await hashData(refreshToken)
//     });

//     await Otp.deleteOne({ _id: record._id });

//     res.status(200).json({
//       success: true,
//       message: 'Email verified',
//       access_token: accessToken,
//       refresh_token: `${tokenDoc._id}.${refreshToken}`,

//       user
//     });

//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// // --- 5. Refresh Token ---
// exports.refreshToken = async (req, res) => {
//   try {
//     const { refresh_token, device_id } = req.body;
//     if (!refresh_token) return res.status(401).json({ message: 'Token required' });

//     // We can't query by hash directly because of salt. 
//     // Optimization: In prod, store a non-hashed "Token ID" (jti) inside the refresh token to lookup DB.
//     // For this example, we iterate (slow) or assume we decode the token to get user_id if it was a JWT.
//     // BETTER APPROACH for Raw Strings: You must send user_id or lookup is hard. 
//     // Assuming simple implementation: Client sends user_id or we decode expired access token.
//     // *Simplified for this context*: We will assume the Refresh Token is a JWT or contains an ID.
//     // *Let's stick to the prompt*: The prompt implies simple string. 
    
//     // To make this work securely without scanning the DB, the refresh token should be `dbId.randomString`.
//     // Let's assume input is just the string for now.
    
//     // REAL WORLD FIX: We can't find the row by hashed token. 
//     // *Strategy*: We will look for *any* active token for this user? No.
//     // *Correction*: We will assume the client passes the `user_id` in headers or we decode the expired JWT. 
//     // But since the API spec doesn't ask for user_id, let's assume the RefreshToken schema stores the PLAIN token? 
//     // NO, prompt says "Store refresh token hashed". 
//     // SOLUTION: The Refresh Token sent to client should be: `<document_id>.<random_secret>`.
    
//     const [id, secret] = refresh_token.split('.'); 
//     if(!id || !secret) return res.status(401).json({ message: 'Invalid token format' });

//     const tokenRecord = await RefreshToken.findById(id);
//     if (!tokenRecord || tokenRecord.is_revoked) return res.status(401).json({ message: 'Revoked or Invalid' });

//     const isValid = await verifyHash(secret, tokenRecord.token_hash);
//     if (!isValid) return res.status(401).json({ message: 'Invalid token' });

//     // Rotation: Revoke old, Issue new
//     tokenRecord.is_revoked = true;
//     await tokenRecord.save();

//     const user = await User.findById(tokenRecord.user_id);
//     const newTokens = generateTokens(user);

//     // Save new Refresh Token
//     // We need to return the ID combined with the secret so we can find it next time
//     const newRecord = await RefreshToken.create({
//         user_id: user._id,
//         token_hash: await hashData(newTokens.refreshToken)
//     });
    
//     // Construct the "Client Facing" refresh token
//     const clientRefreshToken = `${newRecord._id}.${newTokens.refreshToken}`;

//     res.status(200).json({
//       success: true,
//       access_token: newTokens.accessToken,
//       refresh_token: clientRefreshToken,
//       refresh_token_expires_in: 2592000
//     });

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// // --- 6. Logout ---
// exports.logout = async (req, res) => {
//   try {
//     const { refresh_token } = req.body;
//     if(refresh_token) {
//         const [id] = refresh_token.split('.');
//         await RefreshToken.findByIdAndUpdate(id, { is_revoked: true });
//     }
//     res.status(200).json({ success: true, message: 'Logged out' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };
const User = require('../models/User');
const Otp = require('../models/Otp');
const RefreshToken = require('../models/RefreshToken');
const { hashData, verifyHash, generateTokens, generateOTP } = require('../utils/helpers');
const { sendSMS, sendEmail } = require('../utils/senders');

const twilio = require("twilio");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* ===========================
   1. REQUEST PHONE OTP
=========================== */
exports.requestPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone)
      return res.status(400).json({
        success: false,
        message: "Phone required"
      });

    // Twilio generates OTP automatically
    const result = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({
        to: phone,
        channel: "sms"
      });

    res.status(200).json({
      success: true,
      message: "OTP sent via Twilio"
    });

  } catch (error) {
    console.error("Twilio send error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
};

/* ===========================
   2. VERIFY PHONE OTP
=========================== */
exports.verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp, device_id } = req.body;

    const result = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({
        to: phone,
        code: otp
      });

    if (result.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // OTP VALID → LOGIN USER

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        is_phone_verified: true
      });
    } else {
      user.is_phone_verified = true;
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const tokenDoc = await RefreshToken.create({
      user_id: user._id,
      token_hash: await hashData(refreshToken),
      device_id
    });

    res.status(200).json({
      success: true,
      access_token: accessToken,
      refresh_token: `${tokenDoc._id}.${refreshToken}`,
      user
    });

  } catch (error) {
    console.error("Twilio verify error:", error);

    res.status(500).json({
      success: false,
      message: "Verification failed"
    });
  }
};

/* ===========================
   3. REQUEST EMAIL OTP
=========================== */
exports.requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // 1️⃣ Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // 2️⃣ Generate OTP
    const code = generateOTP();
    const hashed_code = await hashData(code);

    // 3️⃣ Store / Update OTP
    await Otp.findOneAndUpdate(
      { identifier: email, type: "email" },
      {
        hashed_otp: hashed_code,
        attempts: 0,
        createdAt: new Date()
      },
      { upsert: true }
    );

    // 4️⃣ Send Email
    const emailSent = await sendEmail(email, code);

    // 5️⃣ Check result
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send email"
      });
    }

    // 6️⃣ Success
    res.status(200).json({
      success: true,
      message: "Email sent",
      expires_in_seconds: 300
    });

  } catch (error) {
    console.error("Email verification error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ===========================
   4. VERIFY EMAIL
=========================== */
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const record = await Otp.findOne({ identifier: email, type: 'email' });
    if (!record) return res.status(410).json({ success: false, message: 'Expired' });

    const isValid = await verifyHash(code, record.hashed_otp);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid code' });

    let user = await User.findOne({ email });
    if (!user) user = await User.create({ email, is_email_verified: true });
    else {
      user.is_email_verified = true;
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const tokenDoc = await RefreshToken.create({
      user_id: user._id,
      token_hash: await hashData(refreshToken)
    });

    await Otp.deleteOne({ _id: record._id });

    res.status(200).json({
      success: true,
      access_token: accessToken,
      refresh_token: `${tokenDoc._id}.${refreshToken}`,
      user
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ===========================
   5. REFRESH TOKEN
=========================== */
exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(401).json({ message: 'Token required' });

    const [id, secret] = refresh_token.split('.');
    if (!id || !secret)
      return res.status(401).json({ message: 'Invalid format' });

    const tokenRecord = await RefreshToken.findById(id);
    if (!tokenRecord || tokenRecord.is_revoked)
      return res.status(401).json({ message: 'Revoked token' });

    const valid = await verifyHash(secret, tokenRecord.token_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid token' });

    tokenRecord.is_revoked = true;
    await tokenRecord.save();

    const user = await User.findById(tokenRecord.user_id);
    const { accessToken, refreshToken: newSecret } = generateTokens(user);

    const newDoc = await RefreshToken.create({
      user_id: user._id,
      token_hash: await hashData(newSecret)
    });

    res.status(200).json({
      success: true,
      access_token: accessToken,
      refresh_token: `${newDoc._id}.${newSecret}`
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ===========================
   6. LOGOUT
=========================== */
exports.logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      const [id] = refresh_token.split('.');
      await RefreshToken.findByIdAndUpdate(id, { is_revoked: true });
    }
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
};
