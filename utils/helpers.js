const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Hashing
exports.hashData = async (data) => await bcrypt.hash(data, 10);
exports.verifyHash = async (data, hash) => await bcrypt.compare(data, hash);

// Token Generation
exports.generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, phone: user.phone, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  
  // Refresh token is just a random secure string, we hash it in DB
  const refreshToken = crypto.randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
};

// Generate Numeric OTP
exports.generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();