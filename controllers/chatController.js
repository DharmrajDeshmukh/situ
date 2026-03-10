const Community = require('../models/Community');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const ChatRoom = require('../models/ChatRoom');

const ChatMessage = require('../models/ChatMessage');
const UserEncryptionKey = require('../models/UserEncryptionKey');
const User = require('../models/User');
const ReadReceipt = require('../models/ReadReceipt');


function getUnreadQuery(roomId, userId) {
  return {
    roomId,
    senderId: { $ne: userId },
    readBy: {
      $not: {
        $elemMatch: { userId: userId }
      }
    }
  };
}


// --- 2. KEYS ---
exports.uploadPublicKey = async (req, res) => { // [cite: 895]
  try {
    const { deviceId, publicKey } = req.body;
    await UserEncryptionKey.findOneAndUpdate(
      { userId: req.user.id, deviceId },
      { publicKey, createdAt: Date.now() },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getUserPublicKey = async (req, res) => { // [cite: 898]
  try {
    // Return the most recent key (or specific device logic)
    const key = await UserEncryptionKey.findOne({ userId: req.params.userId }).sort({ createdAt: -1 });
    if (!key) return res.status(404).json({ error: 'Key not found' });
    res.json(key);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- 3. COMMUNITIES & GROUPS ---
exports.createCommunity = async (req, res) => {
  try {
    const { name } = req.body;

    // 1️⃣ Create community
    const community = await Community.create({
      name,
      ownerId: req.user.id,
      members: [req.user.id] // 🔴 VERY IMPORTANT
    });

    // 2️⃣ Create DEFAULT "General" chat room
    await ChatRoom.create({
      name: "General",
      communityId: community._id,
      type: "GROUP",
      createdBy: req.user.id
    });

    res.json({
      success: true,
      community
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getCommunity = async (req, res) => { // [cite: 908]
  try {
    const comm = await Community.findById(req.params.communityId);
    res.json(comm);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET ROOMS FOR COMMUNITY
exports.getCommunityRooms = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Check membership
    const community = await Community.findOne({
      _id: communityId,
      members: userId
    });

    if (!community) {
      return res.status(403).json({ message: "Not a community member" });
    }

    // 2️⃣ Fetch rooms
    const rooms = await ChatRoom.find({ communityId });

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.createGroupInCommunity = async (req, res) => { // [cite: 918]
  try {
    const { communityId } = req.params;
    const { name } = req.body;
    
    const newGroup = await Group.create({
      name,
      communityId,
      ownerId: req.user.id, // Keeping compatibility with your previous Group model
      createdBy: req.user.id,
      visibility: 'private'
    });
    
    // Auto-add creator
    await GroupMember.create({ groupId: newGroup._id, userId: req.user.id, role: 'owner' });

    res.json(newGroup);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getGroup = async (req, res) => { // [cite: 922]
  try {
    const group = await Group.findById(req.params.groupId);
    res.json(group);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getGroupMembers = async (req, res) => { // [cite: 925]
  try {
     // Format strictly to List<GroupMember>
    const members = await GroupMember.find({ groupId: req.params.groupId }).populate('userId', 'name');
    res.json(members.map(m => ({
        user_id: m.userId._id,
        name: m.userId.name,
        role: m.role,
        joined_at: m.joinedAt
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- 4. ROOMS ---
exports.createChatRoom = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { name, type } = req.body;
    const userId = req.user.id;

    const community = await Community.findOne({
      _id: communityId,
      members: userId
    });

    if (!community) {
      return res.status(403).json({ message: "Not a community member" });
    }

    const room = await ChatRoom.create({
      communityId,
      name,
      type,
      createdBy: userId
    });

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




exports.getChatRooms = async (req, res) => {
  try {
    const { communityId } = req.params;
    const rooms = await ChatRoom.find({ communityId });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- 5. MESSAGING (Rooms) ---
exports.sendRoomMessage = async (req, res) => { // [cite: 941]
  try {
    const { roomId } = req.params;
    const { cipherText, messageType, replyToMessageId } = req.body;
    
    const msg = await ChatMessage.create({
        roomId,
        senderId: req.user.id,
        cipherText,
        messageType,
        replyToMessageId
    });
    res.json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getRoomMessages = async (req, res) => { // [cite: 937]
  try {
    const { roomId } = req.params;
    const { cursor, limit = 30 } = req.query;
    
    const query = { roomId };
    if (cursor) {
        // Assuming cursor is a timestamp or ID. Simple implementation:
        query._id = { $lt: cursor }; 
    }

    const messages = await ChatMessage.find(query)
        .sort({ createdAt: -1 })// Newest first
        .limit(parseInt(limit));
        
    res.json({
        messages: messages.reverse(), // Return chronological for UI
        nextCursor: messages.length > 0 ? messages[messages.length - 1]._id : null
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- 6. DIRECT CHAT ---
exports.createDirectChat = async (req, res) => {
  try {

    const { userTwoId } = req.body;
    const userOne = req.user.id;

    /* ===============================
       VALIDATION
    =============================== */

    if (!userTwoId) {
      return res.status(400).json({
        error: "userTwoId is required"
      });
    }

    if (userTwoId === userOne) {
      return res.status(400).json({
        error: "Cannot start chat with yourself"
      });
    }

    /* ===============================
       GENERATE UNIQUE PAIR KEY
    =============================== */

    const members = [userOne, userTwoId].sort();

    const chatPairKey = members.join("_");

    /* ===============================
       CHECK EXISTING ROOM
    =============================== */

    let room = await ChatRoom.findOne({
      type: "DIRECT",
      chatPairKey
    });

    /* ===============================
       CREATE ROOM IF NOT EXISTS
    =============================== */

    if (!room) {

      try {

        room = await ChatRoom.create({
          type: "DIRECT",
          chatPairKey,
          members: members.map(id => ({
            userId: id,
            role: "MEMBER"
          })),
          createdBy: userOne
        });

      } catch (err) {

        // Handle race condition (two users create chat at same time)
        if (err.code === 11000) {

          room = await ChatRoom.findOne({
            type: "DIRECT",
            chatPairKey
          });

        } else {
          throw err;
        }

      }

    }

    /* ===============================
       RESPONSE
    =============================== */

    res.json({
      success: true,
      roomId: room._id.toString()
    });

  } catch (err) {

    console.error("Direct Chat Error:", err);

    res.status(500).json({
      error: err.message
    });

  }
};



exports.getDirectMessages = async (req, res) => { // [cite: 949]
  try {
    const { chatId } = req.params;
    const { cursor, limit = 30 } = req.query;
    
    const query = { roomId: chatId };
    if (cursor) query._id = { $lt: cursor };

    const messages = await ChatMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    res.json({
        messages: messages.reverse(),
        nextCursor: messages.length > 0 ? messages[messages.length - 1]._id : null
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- 7. STATE ---
exports.markMessageRead = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;

    await ChatMessage.updateMany(
      {
        roomId,
        senderId: { $ne: userId },
        readBy: {
          $not: { $elemMatch: { userId } }
        }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// controllers/chatController.js

exports.getChatHome = async (req, res) => {
  try {

    const userId = req.user.id;
    const homeFeed = [];

    const directRooms = await ChatRoom.find({
      type: "DIRECT",
      "members.userId": userId
    }).populate("members.userId", "name profilePic");

    for (const room of directRooms) {

      const otherMember = room.members.find(
        m => m.userId && m.userId._id.toString() !== userId
      );

      if (!otherMember) continue;

      const otherUser = otherMember.userId;

      const lastMsg = await ChatMessage.findOne({ roomId: room._id })
        .sort({ createdAt: -1 });

      const unreadCount = await ChatMessage.countDocuments(
        getUnreadQuery(room._id, userId)
      );

      homeFeed.push({
        chatId: room._id.toString(),
        roomId: room._id.toString(),
        chatType: "DIRECT",

        title: otherUser?.name || "User",
        avatarUrl: otherUser?.profilePic || null,

        lastMessageId: lastMsg?._id?.toString() || "",
        lastMessage: lastMsg?.cipherText || null,
        lastSenderId: lastMsg?.senderId?.toString() || "",
        messageType: lastMsg?.messageType || "TEXT",

        sentAt: lastMsg
          ? new Date(lastMsg.createdAt).getTime()
          : new Date(room.createdAt).getTime(),

        unreadCount,
        isPinned: false
      });
    }

    res.json(homeFeed.sort((a, b) => b.sentAt - a.sentAt));

  } catch (err) {

    console.error("Chat Home Error:", err);
    res.status(500).json({ error: err.message });

  }
};


// ... existing imports ...

// GET /api/v1/rooms/:roomId/read-state
exports.getRoomReadState = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;

    // 1. Get user's last read message
    const receipt = await ReadReceipt.findOne({ roomId, userId: currentUserId });
    const lastReadMsgId = receipt ? receipt.lastReadMessageId : null;

    // 2. Count unread messages (sent after lastReadMsgId)
    let query = { roomId };
    if (lastReadMsgId) {
        query._id = { $gt: lastReadMsgId }; // Assuming Mongo ObjectIDs are monotonic
    }
    
    // exclude own messages from unread count? Usually yes, but PDF logic implies total sync.
    // simpler to count all messages AFTER the last read one.
    const unreadCount = await ChatMessage.countDocuments(query);

    res.json({
        roomId,
        lastReadMessageId: lastReadMsgId,
        unreadCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};

exports.getCommunityChatHome = async (req, res) => {

  try {

    const { communityId } = req.params;
    const userId = req.user.id;

    const community = await Community.findOne({
      _id: communityId,
      members: userId
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: "User is not a community member"
      });
    }

    const rooms = await ChatRoom.find({
      communityId,
      $or: [
        { type: "GROUP" },
        {
          type: "PROJECT",
          "members.userId": userId
        }
      ]
    });

    const chatFeed = [];

    for (const room of rooms) {

      const lastMsg = await ChatMessage.findOne({
        roomId: room._id
      }).sort({ createdAt: -1 });

      const unreadCount = await ChatMessage.countDocuments(
        getUnreadQuery(room._id, userId)
      );

      chatFeed.push({
        chatId: room._id.toString(),
        roomId: room._id.toString(),
        communityId,

        chatType: room.type,
        title: room.name,

        lastMessageId: lastMsg?._id?.toString() || null,
        lastMessage: lastMsg?.cipherText || null,
        lastSenderId: lastMsg?.senderId?.toString() || null,
        messageType: lastMsg?.messageType || "TEXT",

        sentAt: lastMsg
          ? new Date(lastMsg.createdAt).getTime()
          : new Date(room.createdAt).getTime(),

        unreadCount
      });
    }

    chatFeed.sort((a, b) => b.sentAt - a.sentAt);

    res.json({
      success: true,
      communityId,
      chats: chatFeed
    });

  } catch (err) {

    console.error("Community Chat Home Error:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

};