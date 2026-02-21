const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is missing in environment variables");
}

if (!process.env.EMAIL_FROM) {
  console.error("❌ EMAIL_FROM is missing in environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/* ===========================
   SEND SMS (Mock for now)
=========================== */
exports.sendSMS = async (phone, otp) => {
  try {
    if (!phone || !otp) {
      console.error("SMS: Missing phone or otp");
      return false;
    }

    console.log(`[SMS_MOCK] Sending OTP ${otp} to ${phone}`);
    return true;

  } catch (error) {
    console.error("SMS error:", error);
    return false;
  }
};

/* ===========================
   SEND EMAIL (Resend)
=========================== */
exports.sendEmail = async (email, code, type = "otp") => {
  try {
    if (!email || !code) {
      console.error("Email: Missing email or code");
      return false;
    }

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      console.error("Email: Missing environment configuration");
      return false;
    }

    const subject =
      type === "otp"
        ? "Your OTP Code"
        : "Verification Code";

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>${subject}</h2>
        <p>Your code is:</p>
        <h1 style="letter-spacing: 4px;">${code}</h1>
        <p>This expires in 5 minutes.</p>
      </div>
    `;

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html
    });

    console.log("✅ Resend response:", response);

    if (response?.id) {
      return true;
    }

    console.error("Email: Resend did not return ID");
    return false;

  } catch (error) {
    console.error("❌ Resend error:", error.response?.data || error.message || error);
    return false;
  }
};