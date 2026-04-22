const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const requireAuth = require("../middleware/requireAuth");
router.post("/", requireAuth, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase().trim();
const { category, message } = req.body;

    if (!email || !category || !message) {
      return res.status(400).json({
        error: "Email, category, and message are required",
      });
    }

    const allowedCategories = ["site-development", "issues"];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        error: "Invalid category",
      });
    }

    await pool.query(
      `
      INSERT INTO feedback (email, category, message)
      VALUES ($1, $2, $3)
      `,
      [email, category, message]
    );

    return res.status(201).json({
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Feedback submit error:", error);
    return res.status(500).json({
      error: "Server error while submitting feedback",
    });
  }
});

module.exports = router;
