const Request = require('../models/Request');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const GroupMember = require('../models/GroupMember');
const Group = require('../models/Group');
const Community = require('../models/Community');
const ChatRoom = require('../models/ChatRoom');

/* ======================================================
   GET MY REQUESTS (UNIFIED)
====================================================== */

exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ USER REQUESTS
    const userRequests = await Request.find({
      receiverId: userId,
      status: 'PENDING'
    })
      .populate('senderId', 'name profileImage')
      .sort({ createdAt: -1 })
      .lean();

    const mappedUserRequests = userRequests.map(r => ({
      _id: r._id,
      source: 'REQUEST',
      type: r.type,
      sender: r.senderId,
      createdAt: r.createdAt
    }));

    // 2️⃣ GROUP / PROJECT INVITATIONS
    const invitations = await Invitation.find({
      invitedUserId: userId,
      status: 'PENDING'
    })
      .populate('invitedBy', 'name profileImage')
      .populate('groupId', 'name profileImage')
      .sort({ createdAt: -1 })
      .lean();

    const mappedInvitations = invitations.map(i => ({
      _id: i._id,
      source: 'INVITATION',
      type: i.type,
      sender: i.invitedBy,
      group: i.groupId,
      role: i.role,
      createdAt: i.createdAt
    }));

    // 3️⃣ MERGE BOTH
    const requests = [...mappedUserRequests, ...mappedInvitations]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      requests
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


/* ======================================================
   SEND REQUEST (ONLY USER_CONNECTION)
====================================================== */
exports.sendRequest = async (req, res) => {
  try {
    const { type, receiverId } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return res.status(400).json({ success: false, message: "Cannot send to self" });
    }

    const existing = await Request.findOne({
      type,
      senderId,
      receiverId,
      status: 'PENDING'
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "Already sent" });
    }

    const request = await Request.create({
      type,
      senderId,
      receiverId,
      status: 'PENDING'
    });

    return res.status(201).json({ success: true, request });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ACCEPT REQUEST / INVITATION
====================================================== */
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Find invitation
    const invitation = await Invitation.findById(requestId);
    if (!invitation || invitation.status !== "PENDING") {
      return res.status(404).json({
        success: false,
        message: "Invalid invitation"
      });
    }

    // 2️⃣ Security check
    if (invitation.invitedUserId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // ================================
    // GROUP INVITATION ACCEPT
    // ================================
    if (invitation.type === "GROUP") {

      // 3️⃣ Add to group
      const group = await Group.findById(invitation.groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found"
        });
      }

      if (!group.members.includes(userId)) {
        group.members.push(userId);
        await group.save();
      }

      // 4️⃣ Add to community
      const community = await Community.findOne({ groupId: group._id });
      if (community && !community.members.includes(userId)) {
        community.members.push(userId);
        await community.save();
      }

      // 5️⃣ Add to group chat (🔥 FIX HERE)
      const chatRoom = await ChatRoom.findOne({
        groupId: group._id,
        type: "GROUP"
      });

      if (
        chatRoom &&
        !chatRoom.members.some(m => m.userId.toString() === userId)
      ) {
        chatRoom.members.push({
          userId,
          role: "MEMBER" // ✅ ONLY VALID VALUE
        });
        await chatRoom.save();
      }
    }

    // 6️⃣ Finalize invitation
    invitation.status = "ACCEPTED";
    await invitation.save();

    return res.json({
      success: true,
      message: "Group joined successfully"
    });

  } catch (err) {
    console.error("ACCEPT REQUEST ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};




/* ======================================================
   REJECT REQUEST / INVITATION
====================================================== */
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    let request = await Request.findById(requestId);
    let source = 'REQUEST';

    if (!request) {
      request = await Invitation.findById(requestId);
      source = 'INVITATION';
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    /* ================= AUTH CHECK ================= */
    const isAuthorized =
      source === 'REQUEST'
        ? request.receiverId.toString() === userId
        : request.invitedUserId.toString() === userId;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: "Already processed"
      });
    }

    /* ================= REJECT ================= */
    request.status = 'REJECTED';
    await request.save();

    return res.json({
      success: true,
      message: "Request rejected"
    });

  } catch (err) {
    console.error("rejectRequest error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

