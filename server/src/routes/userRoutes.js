const express = require("express");
// const { saveProfile } = require("../controllers/userController");
const {
  saveProfile,
  uploadProfileImage,
  getUserByEmail,
  getPublicUserByEmail,
  sendFriendRequest,
  getFriendStatus,
  acceptFriendRequest,
  rejectFriendRequest,
  blockUser,
    unblockUser,
  getBlockStatus,
  getAllUsers,
  getRandomSuggestions,
} = require("../controllers/userController");
const upload = require("../middleware/upload");
// const { uploadProfileImage } = require("../controllers/userController");
const router = express.Router();
const { createPost } = require("../controllers/postController");
router.post("/save-profile", saveProfile);
router.post("/upload-profile-image", upload.single("image"), uploadProfileImage);
router.post("/create-post", upload.single("image"), createPost);
router.post("/friend-request", sendFriendRequest);
router.post("/friend-request/accept", acceptFriendRequest);
router.post("/friend-request/reject", rejectFriendRequest);
router.get("/friend-status", getFriendStatus);
router.post("/block", blockUser);
router.post("/unblock", unblockUser);
router.get("/block-status", getBlockStatus);
router.get("/", getAllUsers);
router.get("/random-suggestions", getRandomSuggestions);
router.get("/public/:email", getPublicUserByEmail);
router.get("/:email", getUserByEmail);
module.exports = router;