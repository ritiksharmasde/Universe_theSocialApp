const express = require("express");
const {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  getOrCreateDirectConversation,
  deleteConversationForMe,
} = require("../controllers/chatController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/conversation", requireAuth, createOrGetConversation);
router.post("/delete-for-me", requireAuth, deleteConversationForMe);
router.post("/direct", requireAuth, getOrCreateDirectConversation);
router.get("/conversations", requireAuth, getUserConversations);
router.get("/messages/:conversationId", requireAuth, getConversationMessages);

module.exports = router;
