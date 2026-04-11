const express = require("express");
const {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  getOrCreateDirectConversation,
  deleteConversationForMe,
} = require("../controllers/chatController");

const router = express.Router();

router.post("/conversation", createOrGetConversation);
router.post("/delete-for-me", deleteConversationForMe);
router.post("/direct", getOrCreateDirectConversation);
router.get("/conversations/:email", getUserConversations);
router.get("/messages/:conversationId", getConversationMessages);

module.exports = router;
