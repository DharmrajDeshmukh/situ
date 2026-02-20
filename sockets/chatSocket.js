const ChatMessage = require('../models/ChatMessage');
const ChatRoom = require('../models/ChatRoom');

/**
 * Socket Chat Handler
 * @param {import("socket.io").Server} io
 */
module.exports = (io) => {

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    /**
     * =========================
     * JOIN ROOM
     * =========================
     */
    socket.on("join_room", async ({ roomId }) => {
      try {
        if (!roomId) {
          console.log("❌ join_room failed: roomId missing");
          return;
        }

        // Optional safety check (recommended)
        const roomExists = await ChatRoom.findById(roomId);
        if (!roomExists) {
          console.log("❌ join_room failed: room not found", roomId);
          return;
        }

        socket.join(roomId);
        console.log(`✅ Socket ${socket.id} joined room ${roomId}`);

      } catch (err) {
        console.error("❌ join_room error:", err.message);
      }
    });

    /**
     * =========================
     * SEND MESSAGE
     * =========================
     */
    socket.on("send_message", async (data) => {
      try {
        const { roomId, senderId, message, messageType = "TEXT", replyToMessageId = null } = data;

        // 🔴 Validation
        if (!roomId || !senderId || !message) {
          console.log("❌ send_message failed: missing fields", data);
          return;
        }

        // 🔐 Optional: verify room exists
        const room = await ChatRoom.findById(roomId);
        if (!room) {
          console.log("❌ send_message failed: room not found", roomId);
          return;
        }

        // 💾 Save message to DB
        const msg = await ChatMessage.create({
          roomId,
          senderId,
          cipherText: message,
          messageType,
          replyToMessageId
        });

        // 📤 Emit to all users in room (including sender)
        io.to(roomId).emit("receive_message", {
          _id: msg._id,
          roomId: msg.roomId,
          senderId: msg.senderId,
          cipherText: msg.cipherText,
          messageType: msg.messageType,
          replyToMessageId: msg.replyToMessageId,
          createdAt: msg.createdAt
        });

        console.log("📩 Message sent to room:", roomId);

      } catch (err) {
        console.error("❌ send_message error:", err.message);
      }
    });

    /**
     * =========================
     * LEAVE ROOM (optional)
     * =========================
     */
    socket.on("leave_room", ({ roomId }) => {
      if (roomId) {
        socket.leave(roomId);
        console.log(`👋 Socket ${socket.id} left room ${roomId}`);
      }
    });

    /**
     * =========================
     * DISCONNECT
     * =========================
     */
    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });

  });
};
