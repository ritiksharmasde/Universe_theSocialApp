const express = require("express");

const {
  saveProfile,
  uploadProfileImage,
  getUserByEmail,
  getMyProfile,
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

const { createPost } = require("../controllers/postController");
const upload = require("../middleware/upload");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/me", requireAuth, getMyProfile);
router.post("/save-profile", requireAuth, saveProfile);
router.post("/upload-profile-image", requireAuth, upload.single("image"), uploadProfileImage);

router.post("/create-post", requireAuth, upload.single("image"), createPost);

router.post("/friend-request", requireAuth, sendFriendRequest);
router.post("/friend-request/accept", requireAuth, acceptFriendRequest);
router.post("/friend-request/reject", requireAuth, rejectFriendRequest);
router.get("/friend-status", requireAuth, getFriendStatus);

router.post("/block", requireAuth, blockUser);
router.post("/unblock", requireAuth, unblockUser);
router.get("/block-status", requireAuth, getBlockStatus);

router.get("/random-suggestions", requireAuth, getRandomSuggestions);
router.get("/public/:email", requireAuth, getPublicUserByEmail);
router.get("/", requireAuth, getAllUsers);
router.get("/:email", requireAuth, getUserByEmail);

module.exports = router;
