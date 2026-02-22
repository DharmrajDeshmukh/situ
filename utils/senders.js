const nodemailer = require("nodemailer");
const twilio = require("twilio");

/* ===========================
   GMAIL SMTP TRANSPORT
=========================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

/* ===========================
   TWILIO VERIFY CLIENT
=========================== */

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* ===========================
   SEND SMS (TWILIO VERIFY)
=========================== */

exports.sendSMS = async (phone) => {
  try {
    if (!phone) {
      console.error("SMS: Missing phone number");
      return false;
    }

    const response = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({
        to: phone,
        channel: "sms",
      });

    console.log("✅ OTP sent via Twilio:", response.sid);
    return true;

  } catch (error) {
    console.error("❌ Twilio SMS error:", error.message || error);
    return false;
  }
};

/* ===========================
   SEND EMAIL (GMAIL SMTP)
=========================== */

exports.sendEmail = async (email, code, type = "otp") => {
  try {
    if (!email || !code) {
      console.error("Email: Missing email or code");
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
        <h1 style="letter-spacing:4px;">${code}</h1>
        <p>This expires in 5 minutes.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Setu App" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return true;

  } catch (error) {
    console.error("❌ Email error:", error.message || error);
    return false;
  }
};