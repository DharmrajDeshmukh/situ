exports.sendSMS = async (phone, otp) => {
  console.log(`[SMS_MOCK] Sending OTP ${otp} to ${phone}`);
  return true; // Return false if provider fails
};

exports.sendEmail = async (email, code, type = 'code') => {
  console.log(`[EMAIL_MOCK] Sending ${type} ${code} to ${email}`);
  return true;
};