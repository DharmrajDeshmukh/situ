const jwt = require("jsonwebtoken");
const ChatMessage = require("../models/ChatMessage");
const ChatRoom = require("../models/ChatRoom");

/**
 * Socket Chat Handler
 * @param {import("socket.io").Server} io
 */

module.exports = (io) => {

  /* =========================
     SOCKET AUTH MIDDLEWARE
  ========================= */

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication error: token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      socket.userId = decoded.user_id || decoded.id || decoded.userId;
      next();

    } catch (err) {
      console.log("❌ Socket auth failed:", err.message);
      next(new Error(err.message));
    }
  });

  /* =========================
     CONNECTION
  ========================= */

  io.on("connection", (socket) => {

    console.log("🟢 Socket connected:", socket.id, "User:", socket.userId);

    /* =========================
       JOIN ROOM
    ========================= */

    socket.on("join_room", async (data) => {
  try {

    console.log("JOIN EVENT DATA:", data);

    const roomId = data.roomId;

    if (!roomId) {
      console.log("❌ join_room failed: roomId missing");
      return;
    }

    const room = await ChatRoom.findById(roomId);

    if (!room) {
      console.log("❌ join_room failed: room not found");
      return;
    }

    socket.join(roomId);

    console.log(`✅ User ${socket.userId} joined room ${roomId}`);
    console.log("Current socket rooms:", socket.rooms);

  } catch (err) {
    console.error("❌ join_room error:", err.message);
  }
});

    /* =========================
       SEND MESSAGE
    ========================= */

   socket.on("send_message", async (data, callback) => {

  console.log("SEND MESSAGE DATA:", data);
  console.log("Socket rooms:", socket.rooms);

      try {

        const { roomId, message, messageType = "TEXT", replyToMessageId = null } = data;

        if (!roomId || !message) {
          console.log("❌ send_message failed: invalid data");
          return;
        }

        const room = await ChatRoom.findById(roomId);

        if (!room) {
          console.log("❌ send_message failed: room not found");
          return;
        }

        /* Save message */

        const msg = await ChatMessage.create({
          roomId,
          senderId: socket.userId,
          cipherText: message,
          messageType,
          replyToMessageId
        });

        const payload = {
          _id: msg._id,
          roomId: msg.roomId,
          senderId: msg.senderId,
          cipherText: msg.cipherText,
          messageType: msg.messageType,
          replyToMessageId: msg.replyToMessageId,
          createdAt: msg.createdAt
        };

        /* Emit message to room */

    console.log("Emitting message to room:", roomId);
console.log("Payload:", payload);

io.to(roomId).emit("receive_message", payload);

        /* Ack sender */

        if (callback) {
          callback({
            success: true,
            messageId: msg._id
          });
        }

        console.log("📩 Message delivered:", msg._id);

      } catch (err) {
        console.error("❌ send_message error:", err.message);
      }

    });

    /* =========================
       TYPING INDICATOR
    ========================= */

    socket.on("typing", ({ roomId }) => {

      socket.to(roomId).emit("user_typing", {
        userId: socket.userId
      });

    });

    /* =========================
       STOP TYPING
    ========================= */

    socket.on("stop_typing", ({ roomId }) => {

      socket.to(roomId).emit("user_stop_typing", {
        userId: socket.userId
      });

    });

    /* =========================
       LEAVE ROOM
    ========================= */

    socket.on("leave_room", ({ roomId }) => {

      if (roomId) {
        socket.leave(roomId);
        console.log(`👋 User ${socket.userId} left room ${roomId}`);
      }

    });

    /* =========================
       DISCONNECT
    ========================= */

    socket.on("disconnect", () => {

      console.log("🔴 Socket disconnected:", socket.userId);

    });

  });

};