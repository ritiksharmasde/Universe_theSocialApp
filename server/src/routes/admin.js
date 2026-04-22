const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const requireAuth = require("../middleware/requireAuth");
router.post("/send-admin-notification", requireAuth, async (req, res) => {
  try {
    const senderEmail = req.user.email.toLowerCase().trim();

    const adminCheck = await pool.query(
      `
      SELECT is_admin
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [senderEmail]
    );

    if (!adminCheck.rows.length || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { userEmail, title, body } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "userEmail is required" });
    }

    await pool.query(
      `
      INSERT INTO notifications (user_email, type, title, body, entity_type)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        userEmail.toLowerCase(),
        "admin_message",
        title || "Platform update",
        body || "Welcome to the new UniVerse update.",
        "admin",
      ]
    );

    return res.status(200).json({
      message: "Admin notification sent successfully",
    });
  } catch (error) {
    console.error("send-admin-notification error:", error);
    return res.status(500).json({ error: error.message });
  }
});
module.exports = router;
