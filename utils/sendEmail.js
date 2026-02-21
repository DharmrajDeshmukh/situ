import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      html: html,
    });

    return response;
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};
