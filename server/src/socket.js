const pool = require("./config/db");

let ioInstance = null;

const initializeSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation_${conversationId}`);
    });

    socket.on("join_group", (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`Socket ${socket.id} joined group_${groupId}`);
    });

    socket.on("leave_group", (groupId) => {
      socket.leave(`group_${groupId}`);
      console.log(`Socket ${socket.id} left group_${groupId}`);
    });

    socket.on("send_message", async (payload) => {
      try {
        const { conversationId, senderEmail, messageText } = payload;

        if (!conversationId || !senderEmail || !messageText?.trim()) {
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