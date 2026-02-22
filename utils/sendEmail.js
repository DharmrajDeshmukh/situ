const nodemailer = require("nodemailer");

/* ===========================
   MAIL TRANSPORTER (GMAIL SMTP)
=========================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

/* ===========================
   SEND SMS (Mock for now)
=========================== */
exports.sendSMS = async (phone, otp) => {
  try {
    console.log(`[SMS_MOCK] Sending OTP ${otp} to ${phone}`);
    return true;
  } catch (error) {
    console.error("SMS error:", error);
    return false;
  }
};

/* ===========================
   SEND EMAIL (GMAIL SMTP)
=========================== */
exports.sendEmail = async (email, code, type = "otp") => {
  try {
    const subject =
      type === "otp"
        ? "Your OTP Code"
        : "Verification Code";

    const html = `
      <div style="font-family: Arial;">
        <h2>${subject}</h2>
        <p>Your code is:</p>
        <h1 style="letter-spacing:4px">${code}</h1>
        <p>This expires in 5 minutes.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Setu App" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html
    });

    console.log("✅ Email sent:", info.messageId);
    return true;

  } catch (error) {
    console.error("❌ Email error:", error);
    return false;
  }
};