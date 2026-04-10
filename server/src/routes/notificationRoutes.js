const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
} = require("../controllers/notificationController");

router.get("/", getNotifications);
router.put("/:id/read", markNotificationRead);
router.put("/read-all", markAllNotificationsRead);
router.post("/", createNotification);

module.exports = router;