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
      return res.status(400).json({ success: false, message: 'Target ID required' });
    }

    if (senderId === targetId) {
      return res.status(400).json({ success: false, message: 'Cannot connect to self' });
    }

    // Check existing in both directions
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
        message: 'Request already exists',
        status: existing.status
      });
    }

    await ConnectionRequest.create({
      sender_id: senderId,
      receiver_id: targetId,
      target_type: targetType
    });

    return res.status(201).json({
      success: true,
      status: 'REQUEST_SENT'
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   ACCEPT CONNECTION
====================================================== */
exports.acceptConnection = async (req, res) => {
  try {
    const { targetId, targetType = 'USER' } = req.body;
    const receiverId = req.user.id;

    const request = await ConnectionRequest.findOne({
      sender_id: targetId,
      receiver_id: receiverId,
      target_type: targetType,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No pending request found'
      });
    }

    request.status = 'accepted';
    await request.save();

    // Mutual connection
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
      status: 'CONNECTED'
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================================
   REJECT CONNECTION
====================================================== */
exports.rejectConnection = async (req, res) => {
  try {
    const { targetId, targetType = 'USER' } = req.body;
    const receiverId = req.user.id;

    const request = await ConnectionRequest.findOneAndUpdate(
      {
        sender_id: targetId,
        receiver_id: receiverId,
        target_type: targetType,
        status: 'pending'
      },
      { status: 'rejected' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No pending request found'
      });
    }

    return res.status(200).json({
      success: true,
      status: 'REJECTED'
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// controllers/connectionController.js
exports.getPendingConnection = async (req, res) => {
  try {
    const { targetId, targetType = 'USER' } = req.query;
    const userId = req.user.id;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'targetId is required'
      });
    }

    const pending = await ConnectionRequest.findOne({
      sender_id: userId,
      receiver_id: targetId,
      target_type: targetType,
      status: 'pending'
    });

    return res.status(200).json({
      success: true,
      exists: !!pending,
      requestId: pending ? pending._id : null,
      status: pending ? pending.status : 'none'
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getConnectionStatus = async (req, res) => {
  try {
    const { targetId, targetType = 'USER' } = req.query;
    const userId = req.user.id;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'targetId is required'
      });
    }

    const request = await ConnectionRequest.findOne({
      target_type: targetType,
      $or: [
        { sender_id: userId, receiver_id: targetId },
        { sender_id: targetId, receiver_id: userId }
      ]
    });

    // No connection at all
    if (!request) {
      return res.json({
        success: true,
        status: 'NONE'
      });
    }

    // Accepted connection
    if (request.status === 'accepted') {
      return res.json({
        success: true,
        status: 'CONNECTED'
      });
    }

    // Pending connection
    if (request.status === 'pending') {
      const status =
        request.sender_id.toString() === userId
          ? 'REQUEST_SENT'
          : 'REQUEST_RECEIVED';

      return res.json({
        success: true,
        status,
        requestId: request._id
      });
    }

    // Rejected
    if (request.status === 'rejected') {
      return res.json({
        success: true,
        status: 'REJECTED'
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
