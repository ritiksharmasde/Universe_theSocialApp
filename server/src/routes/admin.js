const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.post("/send-admin-notification", async (req, res) => {
  try {
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