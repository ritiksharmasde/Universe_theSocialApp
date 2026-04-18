const express = require("express");
const {
  createGroup,
  getGroups,
  joinGroup,
  leaveGroup,
  deleteGroup,
  getGroupMembers,
  getGroupMessages,
  sendGroupMessage,
} = require("../controllers/groupController");

const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

router.post("/", requireAuth, createGroup);
router.get("/", requireAuth, getGroups);

router.post("/:groupId/join", requireAuth, joinGroup);
router.post("/:groupId/leave", requireAuth, leaveGroup);
router.delete("/:groupId", requireAuth, deleteGroup);

router.get("/:groupId/members", requireAuth, getGroupMembers);
router.get("/:groupId/messages", requireAuth, getGroupMessages);
router.post("/:groupId/messages", requireAuth, sendGroupMessage);

module.exports = router;
