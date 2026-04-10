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

const router = express.Router();

router.post("/", createGroup);
router.get("/", getGroups);

router.post("/:groupId/join", joinGroup);
router.post("/:groupId/leave", leaveGroup);
router.delete("/:groupId", deleteGroup);

router.get("/:groupId/members", getGroupMembers);
router.get("/:groupId/messages", getGroupMessages);
router.post("/:groupId/messages", sendGroupMessage);

module.exports = router;