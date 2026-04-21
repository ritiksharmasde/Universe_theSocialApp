const jwt = require("jsonwebtoken");
const pool = require("./config/db");

let ioInstance = null;

const initializeSocket = (io) => {
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = {
        email: decoded.email.toLowerCase().trim(),
      };

      next();
    } catch (error) {
      next(new Error("Invalid socket token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id, socket.user?.email);

    socket.on("join_conversation", async (conversationId) => {
      try {
        const userEmail = socket.user.email;

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
          return;
        }

        socket.join(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} joined conversation_${conversationId}`);
      } catch (error) {
        console.error("join_conversation socket error:", error);
      }
    });

    socket.on("join_group", async (groupId) => {
      try {
        const userEmail = socket.user.email;

        const memberCheck = await pool.query(
          `
          SELECT 1
          FROM group_members
          WHERE group_id = $1 AND LOWER(user_email) = LOWER($2)
          LIMIT 1
          `,
          [groupId, userEmail]
        );

        if (memberCheck.rows.length === 0) {
          return;
        }

        socket.join(`group_${groupId}`);
        console.log(`Socket ${socket.id} joined group_${groupId}`);
      } catch (error) {
        console.error("join_group socket error:", error);
      }
    });

    socket.on("leave_group", (groupId) => {
      socket.leave(`group_${groupId}`);
      console.log(`Socket ${socket.id} left group_${groupId}`);
    });

    socket.on("send_message", async (payload) => {
      try {
        const { conversationId, messageText } = payload;
        const senderEmail = socket.user.email;

        if (!conversationId || !messageText?.trim()) {
          return;
        }

        const memberCheck = await pool.query(
          `
          SELECT 1
          FROM conversation_members
          WHERE conversation_id = $1 AND LOWER(user_email) = LOWER($2)
          LIMIT 1
          `,
          [conversationId, senderEmail]
        );

        if (memberCheck.rows.length === 0) {
          return;
        }

        const result = await pool.query(
          `
          INSERT INTO messages (conversation_id, sender_email, message_text)
          VALUES ($1, $2, $3)
          RETURNING *
          `,
          [conversationId, senderEmail, messageText.trim()]
        );

        const savedMessage = result.rows[0];

        await pool.query(
          `
          UPDATE deleted_conversations dc
          SET is_hidden = FALSE
          FROM conversation_members cm
          WHERE dc.conversation_id = $1
            AND cm.conversation_id = $1
            AND LOWER(cm.user_email) = LOWER(dc.user_email)
            AND LOWER(dc.user_email) <> LOWER($2)
          `,
          [conversationId, senderEmail]
        );

        io.to(`conversation_${conversationId}`).emit(
          "receive_message",
          savedMessage
        );
      } catch (error) {
        console.error("send_message socket error:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

const getIo = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }

  return ioInstance;
};

module.exports = {
  initializeSocket,
  getIo,
};
