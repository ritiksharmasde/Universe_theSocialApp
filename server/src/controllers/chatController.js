const pool = require("../config/db");

const createOrGetConversation = async (req, res) => {
  try {
    const userEmail1 = req.user.email.toLowerCase().trim();
    const { userEmail2 } = req.body;

    if (!userEmail2) {
      return res.status(400).json({
        error: "userEmail2 is required.",
      });
    }

    const email1 = userEmail1;
    const email2 = userEmail2.toLowerCase().trim();

    if (email1 === email2) {
      return res.status(400).json({
        error: "You cannot create a conversation with yourself.",
      });
    }

    const existingConversation = await pool.query(
      `
      SELECT c.id
      FROM conversations c
      JOIN conversation_members cm ON c.id = cm.conversation_id
      WHERE c.is_group = FALSE
        AND LOWER(cm.user_email) IN (LOWER($1), LOWER($2))
      GROUP BY c.id
      HAVING COUNT(DISTINCT LOWER(cm.user_email)) = 2
         AND COUNT(*) = 2
      LIMIT 1
      `,
      [email1, email2]
    );

    if (existingConversation.rows.length > 0) {
      return res.status(200).json({
        conversationId: existingConversation.rows[0].id,
      });
    }

    const conversationResult = await pool.query(
      `
      INSERT INTO conversations (name, is_group)
      VALUES ($1, FALSE)
      RETURNING id
      `,
      [`${email1}-${email2}`]
    );

    const conversationId = conversationResult.rows[0].id;

    await pool.query(
      `
      INSERT INTO conversation_members (conversation_id, user_email)
      VALUES ($1, $2), ($1, $3)
      `,
      [conversationId, email1, email2]
    );

    res.status(201).json({
      conversationId,
    });
  } catch (error) {
    console.error("createOrGetConversation error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUserConversations = async (req, res) => {
  try {
    const email = req.user.email.toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.is_group,
        c.created_at,

        other_member.user_email AS other_email,

        u.full_name AS other_full_name,
        u.username AS other_username,
        u.profile_image_url AS other_profile_image_url,
        u.course AS other_course,
        u.year AS other_year,


(
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
      AND LOWER(m.sender_email) != LOWER($1)
  ) AS unread_count

      FROM conversations c

      JOIN conversation_members current_member
        ON current_member.conversation_id = c.id
       AND LOWER(current_member.user_email) = LOWER($1)

      LEFT JOIN conversation_members other_member
        ON other_member.conversation_id = c.id
       AND LOWER(other_member.user_email) != LOWER($1)

      LEFT JOIN users u
        ON LOWER(u.email) = LOWER(other_member.user_email)

      LEFT JOIN deleted_conversations dc
        ON dc.conversation_id = c.id
       AND LOWER(dc.user_email) = LOWER($1)
       
    LEFT JOIN LATERAL (
  SELECT m.created_at
  FROM messages m
  WHERE m.conversation_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 1
) last_message ON TRUE

      WHERE (dc.id IS NULL OR dc.is_hidden = FALSE)

      ORDER BY COALESCE(last_message.created_at, c.created_at) DESC
      `,
      [email]
    );

    res.status(200).json({
      conversations: result.rows,
    });
  } catch (error) {
    console.error("getUserConversations error:", error);
    res.status(500).json({ error: error.message });
  }
};
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userEmail = req.user.email.toLowerCase().trim();

    const memberCheck = await pool.query(
      `
      SELECT 1
      FROM conversation_members
      WHERE conversation_id = $1 AND LOWER(user_email) = LOWER($2)
      LIMIT 1
      `,
      [conversationId, userEmail]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "You are not part of this conversation." });
    }

    const result = await pool.query(
      `
      SELECT m.*
      FROM messages m
      LEFT JOIN deleted_conversations dc
        ON dc.conversation_id = m.conversation_id
       AND LOWER(dc.user_email) = LOWER($2)
      WHERE m.conversation_id = $1
        AND (
          dc.deleted_at IS NULL
          OR m.created_at > dc.deleted_at
        )
      ORDER BY m.created_at ASC
      `,
      [conversationId, userEmail]
    );

    res.status(200).json({
      messages: result.rows,
    });
  } catch (error) {
    console.error("getConversationMessages error:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteConversationForMe = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required." });
    }

    const memberCheck = await pool.query(
      `
      SELECT 1
      FROM conversation_members
      WHERE conversation_id = $1 AND LOWER(user_email) = LOWER($2)
      LIMIT 1
      `,
      [conversationId, userEmail]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "You are not part of this conversation." });
    }

    await pool.query(
      `
      INSERT INTO deleted_conversations (conversation_id, user_email, deleted_at, is_hidden)
      VALUES ($1, $2, NOW(), TRUE)
      ON CONFLICT (conversation_id, user_email)
      DO UPDATE SET deleted_at = NOW(), is_hidden = TRUE
      `,
      [conversationId, userEmail]
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("deleteConversationForMe error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getOrCreateDirectConversation = async (req, res) => {
  try {
    const currentUserEmail = req.user.email.toLowerCase().trim();
    const { otherUserEmail } = req.body;

    if (!otherUserEmail) {
      return res.status(400).json({ error: "otherUserEmail is required." });
    }

    const userA = currentUserEmail;
    const userB = otherUserEmail.toLowerCase().trim();

    if (userA === userB) {
      return res.status(400).json({ error: "You cannot create a chat with yourself." });
    }

    const userCheck = await pool.query(
      `SELECT email FROM users WHERE LOWER(email) = LOWER($1)`,
      [userB]
    );

    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const conversationName = [userA, userB].sort().join("-");

    const existingConversation = await pool.query(
      `
      SELECT id, name, is_group
      FROM conversations
      WHERE is_group = false
        AND LOWER(name) = LOWER($1)
      LIMIT 1
      `,
      [conversationName]
    );

    let conversation;

    if (existingConversation.rows.length > 0) {
      conversation = existingConversation.rows[0];
    } else {
      const newConversation = await pool.query(
        `
        INSERT INTO conversations (name, is_group)
        VALUES ($1, false)
        RETURNING id, name, is_group
        `,
        [conversationName]
      );

      conversation = newConversation.rows[0];
    }

    await pool.query(
      `
      INSERT INTO conversation_members (conversation_id, user_email)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [conversation.id, userA]
    );

    await pool.query(
      `
      INSERT INTO conversation_members (conversation_id, user_email)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [conversation.id, userB]
    );

    await pool.query(
      `
      UPDATE deleted_conversations
      SET is_hidden = FALSE
      WHERE conversation_id = $1
        AND LOWER(user_email) = LOWER($2)
      `,
      [conversation.id, userA]
    );

    return res.status(200).json({
      conversation: {
        id: conversation.id,
      },
    });
  } catch (error) {
    console.error("getOrCreateDirectConversation error:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  getOrCreateDirectConversation,
  deleteConversationForMe,
};
