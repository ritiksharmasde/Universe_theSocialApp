const pool = require("../config/db");

const getNotifications = async (req, res) => {
  const { userEmail } = req.query;

  if (!userEmail) {
    return res.status(400).json({ error: "userEmail is required" });
  }

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE user_email = $1
      ORDER BY created_at DESC
      `,
      [userEmail.toLowerCase()]
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error("get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

const markNotificationRead = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error("mark notification read error:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

const markAllNotificationsRead = async (req, res) => {
  const { userEmail } = req.body;

  if (!userEmail) {
    return res.status(400).json({ error: "userEmail is required" });
  }

  try {
    await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_email = $1
      `,
      [userEmail.toLowerCase()]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("mark all notifications read error:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
};

const createNotification = async (req, res) => {
  const {
    userEmail,
    type,
    title,
    body = "",
    actorEmail = null,
    entityType = null,
    entityId = null,
  } = req.body;

  if (!userEmail || !type || !title) {
    return res.status(400).json({ error: "userEmail, type, title are required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO notifications
      (user_email, type, title, body, actor_email, entity_type, entity_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        userEmail.toLowerCase(),
        type,
        title,
        body,
        actorEmail ? actorEmail.toLowerCase() : null,
        entityType,
        entityId,
      ]
    );

    res.status(201).json({ notification: result.rows[0] });
  } catch (error) {
    console.error("create notification error:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
};