const pool = require("../config/db");

const MAX_GROUP_MEMBERS = 5;

const createGroup = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, description, course, year } = req.body;
const createdByEmail = req.user.email.toLowerCase().trim();

    if (!name || !createdByEmail) {
      return res.status(400).json({
        error: "Group name and creator email are required.",
      });
    }

    await client.query("BEGIN");

    const groupResult = await client.query(
      `
      INSERT INTO groups (name, description, course, year, created_by_email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        name.trim(),
        description?.trim() || "",
        course?.trim() || "",
        year?.trim() || "",
        createdByEmail.toLowerCase().trim(),
      ]
    );

    const group = groupResult.rows[0];

    await client.query(
      `
      INSERT INTO group_members (group_id, user_email)
      VALUES ($1, $2)
      `,
      [group.id, createdByEmail.toLowerCase().trim()]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Group created successfully.",
      group,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("createGroup error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserEmail = req.user.email.toLowerCase().trim();

    const groupResult = await pool.query(
      `
      SELECT *
      FROM groups
      WHERE id = $1
      LIMIT 1
      `,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found." });
    }

    const group = groupResult.rows[0];

    if (group.created_by_email.toLowerCase() !== currentUserEmail) {
      return res.status(403).json({
        error: "Only the group owner can delete this group.",
      });
    }

    await pool.query(
      `
      DELETE FROM groups
      WHERE id = $1
      `,
      [groupId]
    );

    return res.status(200).json({
      message: "Group deleted successfully.",
    });
  } catch (error) {
    console.error("deleteGroup error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getGroups = async (req, res) => {
  try {
    const currentUserEmail = req.user.email.toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT
        g.*,
        COUNT(gm.user_email)::int AS members_count,
        EXISTS (
          SELECT 1
          FROM group_members gm2
          WHERE gm2.group_id = g.id
            AND LOWER(gm2.user_email) = LOWER($1)
        ) AS is_joined
      FROM groups g
      LEFT JOIN group_members gm ON gm.group_id = g.id
      GROUP BY g.id
      ORDER BY g.created_at DESC
      `,
      [currentUserEmail]
    );

    return res.status(200).json({
      groups: result.rows,
    });
  } catch (error) {
    console.error("getGroups error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const joinGroup = async (req, res) => {
  const client = await pool.connect();

  try {
    const { groupId } = req.params;
    const userEmail = req.user.email.toLowerCase().trim();

    if (!userEmail) {
      return res.status(400).json({ error: "userEmail is required." });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();

    await client.query("BEGIN");

    const groupResult = await client.query(
      `
      SELECT id
      FROM groups
      WHERE id = $1
      LIMIT 1
      `,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Group not found." });
    }

    const existingMember = await client.query(
      `
      SELECT 1
      FROM group_members
      WHERE group_id = $1 AND LOWER(user_email) = LOWER($2)
      LIMIT 1
      `,
      [groupId, normalizedEmail]
    );

    if (existingMember.rows.length > 0) {
      await client.query("COMMIT");
      return res.status(200).json({
        message: "Already joined this group.",
      });
    }

    const memberCountResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM group_members
      WHERE group_id = $1
      `,
      [groupId]
    );

    const memberCount = memberCountResult.rows[0].count;

    if (memberCount >= MAX_GROUP_MEMBERS) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Group is full. Maximum 5 members allowed.",
      });
    }

    await client.query(
      `
      INSERT INTO group_members (group_id, user_email)
      VALUES ($1, $2)
      `,
      [groupId, normalizedEmail]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Joined group successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("joinGroup error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userEmail = req.user.email.toLowerCase().trim();

    if (!userEmail) {
      return res.status(400).json({ error: "userEmail is required." });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();

    const groupResult = await pool.query(
      `
      SELECT created_by_email
      FROM groups
      WHERE id = $1
      LIMIT 1
      `,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found." });
    }

    const ownerEmail = groupResult.rows[0].created_by_email.toLowerCase();

    if (ownerEmail === normalizedEmail) {
      return res.status(400).json({
        error: "Group owner cannot leave the group. Delete it instead.",
      });
    }

    await pool.query(
      `
      DELETE FROM group_members
      WHERE group_id = $1
        AND LOWER(user_email) = LOWER($2)
      `,
      [groupId, normalizedEmail]
    );

    return res.status(200).json({
      message: "Left group successfully.",
    });
  } catch (error) {
    console.error("leaveGroup error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
   const userEmail = req.user.email.toLowerCase().trim();

    if (!userEmail) {
      return res.status(400).json({ error: "userEmail is required." });
    }

    const membership = await pool.query(
      `
      SELECT 1
      FROM group_members
      WHERE group_id = $1 AND LOWER(user_email) = LOWER($2)
      LIMIT 1
      `,
      [groupId, userEmail.toLowerCase().trim()]
    );

    if (!membership.rows.length) {
      return res.status(403).json({ error: "Join the group first." });
    }

    const result = await pool.query(
      `
      SELECT
        gm.user_email,
        u.full_name,
        u.username,
        u.profile_image_url
      FROM group_members gm
      LEFT JOIN users u ON LOWER(u.email) = LOWER(gm.user_email)
      WHERE gm.group_id = $1
      ORDER BY gm.joined_at ASC
      `,
      [groupId]
    );

    return res.status(200).json({
      members: result.rows,
    });
  } catch (error) {
    console.error("getGroupMembers error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userEmail = req.user.email.toLowerCase().trim();

    if (!userEmail) {
      return res.status(400).json({ error: "userEmail is required." });
    }

    const membership = await pool.query(
      `
      SELECT 1
      FROM group_members
      WHERE group_id = $1 AND LOWER(user_email) = LOWER($2)
      LIMIT 1
      `,
      [groupId, userEmail.toLowerCase().trim()]
    );

    if (!membership.rows.length) {
      return res.status(403).json({ error: "Join the group first." });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM group_messages
      WHERE group_id = $1
      ORDER BY created_at ASC
      `,
      [groupId]
    );

    return res.status(200).json({
      messages: result.rows,
    });
  } catch (error) {
    console.error("getGroupMessages error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userName, userProfileImageUrl, messageText } = req.body
      const userEmail = req.user.email.toLowerCase().trim();

    if (!userEmail || !messageText?.trim()) {
      return res.status(400).json({
        error: "userEmail and messageText are required.",
      });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();

    const membership = await pool.query(
      `
      SELECT 1
      FROM group_members
      WHERE group_id = $1 AND LOWER(user_email) = LOWER($2)
      LIMIT 1
      `,
      [groupId, normalizedEmail]
    );

    if (!membership.rows.length) {
      return res.status(403).json({ error: "Join the group first." });
    }

    const result = await pool.query(
      `
      INSERT INTO group_messages (
        group_id,
        sender_email,
        sender_name,
        sender_profile_image_url,
        message_text
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        groupId,
        normalizedEmail,
        userName?.trim() || "Student",
        userProfileImageUrl || null,
        messageText.trim(),
      ]
    );

    const savedMessage = result.rows[0];

    const io = req.app.get("io");
    io.to(`group_${groupId}`).emit("group_message", savedMessage);

    return res.status(201).json({
      message: "Message sent successfully.",
      groupMessage: savedMessage,
    });
  } catch (error) {
    console.error("sendGroupMessage error:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createGroup,
  getGroups,
  joinGroup,
  leaveGroup,
  deleteGroup,
  getGroupMembers,
  getGroupMessages,
  sendGroupMessage,
};
