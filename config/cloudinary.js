const cloudinary = require("cloudinary").v2;

/* ===========================
   ENV VALIDATION
=========================== */

if (!process.env.CLOUDINARY_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET) {

  console.error("❌ Cloudinary environment variables are missing.");
}

/* ===========================
   CLOUDINARY CONFIG
=========================== */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ===========================
   DEBUG (Optional but useful)
=========================== */

console.log("☁️ Cloudinary configured:", {
  cloud_name: process.env.CLOUDINARY_NAME ? "✔" : "❌",
  api_key: process.env.CLOUDINARY_API_KEY ? "✔" : "❌",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "✔" : "❌"
});

module.exports = cloudinary;