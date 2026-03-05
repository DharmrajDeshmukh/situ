const { S3Client } = require("@aws-sdk/client-s3");

/* ===========================
   ENV VALIDATION
=========================== */

if (
  !process.env.AWS_ACCESS_KEY ||
  !process.env.AWS_SECRET_KEY ||
  !process.env.AWS_REGION ||
  !process.env.AWS_BUCKET
) {
  console.error("❌ AWS S3 environment variables are missing.");
}

/* ===========================
   S3 CONFIG
=========================== */

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

/* ===========================
   DEBUG (Optional but useful)
=========================== */

console.log("☁️ AWS S3 configured:", {
  region: process.env.AWS_REGION ? "✔" : "❌",
  accessKey: process.env.AWS_ACCESS_KEY ? "✔" : "❌",
  secretKey: process.env.AWS_SECRET_KEY ? "✔" : "❌",
  bucket: process.env.AWS_BUCKET ? "✔" : "❌",
});

module.exports = s3;