const Community = require('../models/Community');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const ChatRoom = require('../models/ChatRoom');

const ChatMessage = require('../models/ChatMessage');
const UserEncryptionKey = require('../models/UserEncryptionKey');
const User = require('../models/User');
const ReadReceipt = require('../models/ReadReceipt');





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
        .sort({ sentAt: -1 }) // Newest first
        .limit(parseInt(limit));
        
    res.json({
        messages: messages.reverse(), // Return chronological for UI
        nextCursor: messages.length > 0 ? messages[messages.length - 1]._id : null
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- 6. DIRECT CHAT ---
// --- 6. DIRECT CHAT (FIXED) ---
exports.createDirectChat = async (req, res) => {
  try {
    const { userTwoId } = req.body;
    const currentUserId = req.user.id;

    if (!userTwoId) {
      return res.status(400).json({
        error: "userTwoId is required"
      });
    }

    // Sort user IDs to ensure uniqueness
    const members = [currentUserId, userTwoId].sort();

    // 🔍 Check if DIRECT chat room already exists
    let room = await ChatRoom.findOne({
      type: "DIRECT",
      "members.userId": { $all: members }
    });

    // 🆕 Create room if not exists
    if (!room) {
      room = await ChatRoom.create({
        type: "DIRECT",
        members: members.map(userId => ({
          userId,
          role: "MEMBER"
        })),
        createdBy: currentUserId
      });
    }

    res.json({
      roomId: room._id.toString() // ✅ frontend expects roomId
    });

  } catch (err) {
    console.error("Direct Chat Error:", err);
    res.status(500).json({ error: err.message });
  }
};



exports.getDirectMessages = async (req, res) => { // [cite: 949]
  try {
    const { chatId } = req.params;
    const { cursor, limit = 30 } = req.query;
    
    const query = { directChatId: chatId };
    if (cursor) query._id = { $lt: cursor };

    const messages = await ChatMessage.find(query)
        .sort({ sentAt: -1 })
        .limit(parseInt(limit));

    res.json({
        messages: messages.reverse(),
        nextCursor: messages.length > 0 ? messages[messages.length - 1]._id : null
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- 7. STATE ---
exports.markMessageRead = async (req, res) => { // [cite: 958]
  try {
      const { messageIds } = req.body;
      await ChatMessage.updateMany(
  {
    roomId,
    senderId: { $ne: req.user.id },
    readBy: { $ne: req.user.id }
  },
  { $addToSet: { readBy: req.user.id } }
);
;
      res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// controllers/chatController.js

exports.getChatHome = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const homeFeed = [];

    /* ========= DIRECT CHATS ========= */

    const directRooms = await ChatRoom.find({
      type: "DIRECT",
      "members.userId": currentUserId
    }).populate("members.userId", "name profilePic");

    for (const room of directRooms) {

      const otherMember = room.members.find(
        m => m.userId && m.userId._id.toString() !== currentUserId
      );

      if (!otherMember) continue;

      const otherUser = otherMember.userId;

      const lastMsg = await ChatMessage.findOne({
        roomId: room._id
      }).sort({ sentAt: -1 });

      const unreadCount = await ChatMessage.countDocuments({
        roomId: room._id,
        senderId: { $ne: currentUserId },
        readBy: { $ne: currentUserId }
      });

      homeFeed.push({
        chatId: room._id.toString(),
        roomId: room._id.toString(),
         groupId: group?._id?.toString() ?? null,
        directChatId: null,
        communityId: null,
        chatType: "DIRECT",

        title: otherUser.name,
        avatarUrl: otherUser.profilePic ?? null, // ✅ FIXED

        lastMessageId: lastMsg?._id?.toString() ?? "",
        lastMessage: lastMsg?.cipherText ?? null,
        lastSenderId: lastMsg?.senderId?.toString() ?? "",
        messageType: lastMsg?.messageType ?? "TEXT",

        sentAt: lastMsg?.sentAt
          ? new Date(lastMsg.sentAt).getTime()
          : new Date(room.createdAt).getTime(),

        unreadCount,
        isPinned: false
      });
    }

    /* ========= GROUP CHATS ========= */

    const communities = await Community.find({
      members: currentUserId
    });

    for (const community of communities) {

      const group = await Group.findOne({
        communityId: community._id
      });

   const rooms = await ChatRoom.find({
  communityId: community._id,
  $or: [
    { type: "GROUP" },  // General rooms
    {
      type: "PROJECT",
      "members.userId": currentUserId
    }
  ]
});

      for (const room of rooms) {

        const lastMsg = await ChatMessage.findOne({
          roomId: room._id
        }).sort({ sentAt: -1 });

        const unreadCount = await ChatMessage.countDocuments({
          roomId: room._id,
          senderId: { $ne: currentUserId },
          readBy: { $ne: currentUserId }
        });

        homeFeed.push({
          chatId: room._id.toString(),
          roomId: room._id.toString(),
          communityId: community._id.toString(),
          directChatId: null,
          chatType: "GROUP",

          title: `${group?.name ?? community.name} - ${room.name}`,
          avatarUrl: group?.profile_image ?? null, // ✅ FIXED

          lastMessageId: lastMsg?._id?.toString() ?? "",
          lastMessage: lastMsg?.cipherText ?? null,
          lastSenderId: lastMsg?.senderId?.toString() ?? "",
          messageType: lastMsg?.messageType ?? "TEXT",

          sentAt: lastMsg?.sentAt
            ? new Date(lastMsg.sentAt).getTime()
            : new Date(room.createdAt).getTime(),

          unreadCount,
          isPinned: false
        });
      }
    }

    homeFeed.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));

    res.json(homeFeed);

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

    /* ================= MEMBERSHIP CHECK ================= */

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

    /* ================= FETCH ROOMS ================= */

    const rooms = await ChatRoom.find({
      communityId: community._id,
      $or: [
        { type: "GROUP" }, // General room
        {
          type: "PROJECT",
          "members.userId": userId
        }
      ]
    });

    const chatFeed = [];

    for (const room of rooms) {

      // 🔎 Get last message
      const lastMsg = await ChatMessage.findOne({
        roomId: room._id
      }).sort({ sentAt: -1 });

      // 🔔 Count unread messages
      const unreadCount = await ChatMessage.countDocuments({
        roomId: room._id,
        senderId: { $ne: userId },
        readBy: { $ne: userId }
      });

      chatFeed.push({
        chatId: room._id.toString(),
        roomId: room._id.toString(),
        communityId: community._id.toString(),

        chatType: room.type, // GROUP or PROJECT
        title: room.name,

        lastMessageId: lastMsg?._id?.toString() ?? null,
        lastMessage: lastMsg?.cipherText ?? null,
        lastSenderId: lastMsg?.senderId?.toString() ?? null,
        messageType: lastMsg?.messageType ?? "TEXT",

        sentAt: lastMsg
          ? new Date(lastMsg.sentAt).getTime()
          : new Date(room.createdAt).getTime(),

        unreadCount
      });
    }

    /* ================= SORT BY LATEST ================= */

    chatFeed.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));

    return res.json({
      success: true,
      communityId: community._id.toString(),
      chats: chatFeed
    });

  } catch (err) {
    console.error("Community Chat Home Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};