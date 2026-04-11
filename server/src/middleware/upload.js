const multer = require("multer");
const moderateImage = require("../utils/moderateImage");

const storage = multer.memoryStorage();

const fileFilter = async (req, file, cb) => {
  try {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed."), false);
    }

    // attach file temporarily so moderation can use it if needed later
    req.pendingFile = file;

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;
