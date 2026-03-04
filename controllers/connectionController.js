const ConnectionRequest = require('../models/ConnectionRequest');
const User = require('../models/User');

/* ======================================================
   SEND CONNECTION REQUEST
====================================================== */
exports.sendConnection = async (req, res) => {
  try {

    const { targetId, targetType = 'USER' } = req.body;
    const senderId = req.user.id;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target ID required'
      });
    }

    if (senderId === targetId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot connect to self'
      });
    }

    /* ---------------- CHECK ALREADY CONNECTED ---------------- */

    const sender = await User.findById(senderId).select("connections");

    const alreadyConnected =
      sender.connections.some(id => id.toString() === targetId);

    if (alreadyConnected) {
      return res.status(400).json({
        success: false,
        message: "Users already connected"
      });
    }

    /* ---------------- CHECK EXISTING REQUEST ---------------- */

    const existing = await ConnectionRequest.findOne({
      target_type: targetType,
      $or: [
        { sender_id: senderId, receiver_id: targetId },
        { sender_id: targetId, receiver_id: senderId }
      ]
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Request already exists",
        status: existing.status
      });
    }

    /* ---------------- CREATE REQUEST ---------------- */

    await ConnectionRequest.create({
      sender_id: senderId,
      receiver_id: targetId,
      target_type: targetType,
      status: "PENDING"
    });

    return res.status(201).json({
      success: true,
      status: "REQUEST_SENT"
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }
};


/* ======================================================
   ACCEPT CONNECTION
====================================================== */

exports.acceptConnection = async (req, res) => {
  try {

    const { targetId, targetType = "USER" } = req.body;
    const receiverId = req.user.id;

    const request = await ConnectionRequest.findOne({
      sender_id: targetId,
      receiver_id: receiverId,
      target_type: targetType,
      status: "PENDING"
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "No pending request found"
      });
    }

    /* ---------------- UPDATE STATUS ---------------- */

    request.status = "ACCEPTED";
    await request.save();

    /* ---------------- MUTUAL CONNECTION ---------------- */

    await User.findByIdAndUpdate(
      request.sender_id,
      { $addToSet: { connections: request.receiver_id } }
    );

    await User.findByIdAndUpdate(
      request.receiver_id,
      { $addToSet: { connections: request.sender_id } }
    );

    return res.status(200).json({
      success: true,
      status: "CONNECTED"
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }
};


/* ======================================================
   REJECT CONNECTION
====================================================== */

exports.rejectConnection = async (req, res) => {
  try {

    const { targetId, targetType = "USER" } = req.body;
    const receiverId = req.user.id;

    const request = await ConnectionRequest.findOneAndUpdate(
      {
        sender_id: targetId,
        receiver_id: receiverId,
        target_type: targetType,
        status: "PENDING"
      },
      { status: "REJECTED" },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "No pending request found"
      });
    }

    return res.status(200).json({
      success: true,
      status: "REJECTED"
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }
};


/* ======================================================
   CHECK IF PENDING CONNECTION EXISTS
====================================================== */

exports.getPendingConnection = async (req, res) => {
  try {

    const { targetId, targetType = "USER" } = req.query;
    const userId = req.user.id;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: "targetId is required"
      });
    }

    const pending = await ConnectionRequest.findOne({
      sender_id: userId,
      receiver_id: targetId,
      target_type: targetType,
      status: "PENDING"
    });

    return res.status(200).json({
      success: true,
      exists: !!pending,
      requestId: pending ? pending._id : null,
      status: pending ? pending.status : "NONE"
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }
};


/* ======================================================
   GET CONNECTION STATUS BETWEEN TWO USERS
====================================================== */

exports.getConnectionStatus = async (req, res) => {
  try {

    const { targetId, targetType = "USER" } = req.query;
    const userId = req.user.id;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: "targetId is required"
      });
    }

    const request = await ConnectionRequest.findOne({
      target_type: targetType,
      $or: [
        { sender_id: userId, receiver_id: targetId },
        { sender_id: targetId, receiver_id: userId }
      ]
    });

    /* ---------------- NO CONNECTION ---------------- */

    if (!request) {
      return res.json({
        success: true,
        status: "NONE"
      });
    }

    /* ---------------- CONNECTED ---------------- */

    if (request.status === "ACCEPTED") {
      return res.json({
        success: true,
        status: "CONNECTED"
      });
    }

    /* ---------------- PENDING ---------------- */

    if (request.status === "PENDING") {

      const status =
        request.sender_id.toString() === userId
          ? "REQUEST_SENT"
          : "REQUEST_RECEIVED";

      return res.json({
        success: true,
        status,
        requestId: request._id
      });
    }

    /* ---------------- REJECTED ---------------- */

    if (request.status === "REJECTED") {
      return res.json({
        success: true,
        status: "REJECTED"
      });
    }

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }
};