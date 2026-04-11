const pool = require("../config/db");

const createOrGetConversation = async (req, res) => {
  try {
    const { userEmail1, userEmail2 } = req.body;

    if (!userEmail1 || !userEmail2) {
      return res.status(400).json({
        error: "Both user emails are required.",
      });
    }

    const email1 = userEmail1.toLowerCase();
    const email2 = userEmail2.toLowerCase();

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
    const { email } = req.params;

    const result = await pool.query(
  `
  SELECT c.id, c.name, c.is_group, c.created_at
  FROM conversations c
  JOIN conversation_members cm
    ON c.id = cm.conversation_id
  LEFT JOIN deleted_conversations dc
    ON dc.conversation_id = c.id
   AND LOWER(dc.user_email) = LOWER($1)
  WHERE LOWER(cm.user_email) = LOWER($1)
    AND dc.id IS NULL
  ORDER BY c.created_at DESC
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
const { userEmail } = req.query;

if (!userEmail) {
  return res.status(400).json({ error: "userEmail is required." });
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
    const { conversationId, userEmail } = req.body;

    if (!conversationId || !userEmail) {
      return res.status(400).json({ error: "conversationId and userEmail are required." });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();

    const memberCheck = await pool.query(
      `
      SELECT 1
      FROM conversation_members
      WHERE conversation_id = $1 AND LOWER(user_email) = LOWER($2)
      LIMIT 1
      `,
      [conversationId, normalizedEmail]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "You are not part of this conversation." });
    }

    await pool.query(
      `
      INSERT INTO deleted_conversations (conversation_id, user_email, deleted_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (conversation_id, user_email)
      DO UPDATE SET deleted_at = NOW()
      `,
      [conversationId, normalizedEmail]
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("deleteConversationForMe error:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getOrCreateDirectConversation = async (req, res) => {
  try {
    const { currentUserEmail, otherUserEmail } = req.body;

    if (!currentUserEmail || !otherUserEmail) {
      return res.status(400).json({ error: "currentUserEmail and otherUserEmail are required." });
    }

    const userA = currentUserEmail.toLowerCase().trim();
    const userB = otherUserEmail.toLowerCase().trim();

    if (userA === userB) {
      return res.status(400).json({ error: "You cannot create a chat with yourself." });
    }
    const userCheck = await pool.query(
      `SELECT email FROM users WHERE LOWER(email) = LOWER($1)`,
      [otherUserEmail]
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
