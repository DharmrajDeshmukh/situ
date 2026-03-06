const multer = require("multer");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

/* =====================================================
   MULTER MEMORY STORAGE
===================================================== */

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {

    const isImage = file.mimetype.startsWith("image/");
    const isPdf = file.mimetype === "application/pdf";

    if (!isImage && !isPdf) {
      return cb(new Error("Only IMAGE and PDF allowed"), false);
    }

    cb(null, true);
  }
});

/* =====================================================
   S3 UPLOAD FUNCTION
===================================================== */

const uploadToS3 = async (file) => {

  // Determine extension safely
  const ext = file.mimetype.split("/")[1] || "jpg";

  // Generate unique filename
  const key = `setu_app/posts/${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}.${ext}`;

  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  await s3.send(new PutObjectCommand(params));

  return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = upload;
module.exports.uploadToS3 = uploadToS3;