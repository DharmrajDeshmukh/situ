const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/* ===========================
   SEND SMS (Still Mock)
=========================== */
exports.sendSMS = async (phone, otp) => {
  console.log(`[SMS_MOCK] Sending OTP ${otp} to ${phone}`);
  return true;
};

/* ===========================
   SEND EMAIL (REAL RESEND)
=========================== */
exports.sendEmail = async (email, code, type = 'otp') => {
  try {
    const subject = type === 'otp'
      ? 'Your OTP Code'
      : 'Verification Code';

    const html = `
      <h2>${subject}</h2>
      <p>Your code is:</p>
      <h1>${code}</h1>
      <p>This expires in 5 minutes.</p>
    `;

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html,
    });

    console.log(`Email sent to ${email}`);
    return true;

  } catch (error) {
    console.error("Resend error:", error);
    return false;
  }
};