const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
} = require("../controllers/notificationController");

router.get("/", requireAuth, getNotifications);
router.put("/:id/read", requireAuth, markNotificationRead);
router.put("/read-all", requireAuth, markAllNotificationsRead);

// keep this protected too unless you intentionally want public/internal access
router.post("/", requireAuth, createNotification);

module.exports = router;
