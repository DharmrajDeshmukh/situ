const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/* =====================================================
   CLOUDINARY STORAGE CONFIG
   ===================================================== */

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {

    const isImage = file.mimetype.startsWith("image/");
    const isPdf = file.mimetype === "application/pdf";

    if (!isImage && !isPdf) {
      throw new Error("Only IMAGE and PDF allowed");
    }

    return {
      folder: "setu_app/posts", // Better structure
      resource_type: isImage ? "image" : "raw",
      allowed_formats: isImage
        ? ["jpg", "jpeg", "png", "webp"]
        : ["pdf"],
      transformation: isImage
        ? [{ width: 1200, crop: "limit" }]
        : undefined
    };
  }
});

/* =====================================================
   MULTER CONFIG
   ===================================================== */

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

module.exports = upload;
