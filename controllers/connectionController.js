const ConnectionRequest = require('../models/ConnectionRequest');
const User = require('../models/User');

// 1. Send Connection Request
exports.sendConnectionRequest = async (req, res) => {
  try {
    const { targetId, targetType } = req.body;
    const senderId = req.user.id;

    if (targetId === senderId) return res.status(400).json({ success: false, message: "Cannot connect to self" });

    // Check if exists
    const existing = await ConnectionRequest.findOne({ 
      sender_id: senderId, 
      receiver_id: targetId,
      target_type: targetType 
    });

    if (existing) return res.status(409).json({ success: false, message: "Request already sent" });

    await ConnectionRequest.create({
      sender_id: senderId,
      receiver_id: targetId,
      target_type: targetType
    });

    res.status(200).json({ success: true, message: "Request sent" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 2. Accept Connection
exports.acceptConnection = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await ConnectionRequest.findById(requestId);

    if (!request || request.status !== 'pending') {
      return res.status(404).json({ success: false, message: "Request not found or invalid" });
    }

    // Update Request Status
    request.status = 'accepted';
    await request.save();

    // Add to Users' connections list (Mutual)
    if (request.target_type === 'USER') {
      await User.findByIdAndUpdate(request.sender_id, { $addToSet: { connections: request.receiver_id } });
      await User.findByIdAndUpdate(request.receiver_id, { $addToSet: { connections: request.sender_id } });
    }

    res.status(200).json({ success: true, message: "Connected" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 3. Reject Connection
exports.rejectConnection = async (req, res) => {
  try {
    const { requestId } = req.body;
    await ConnectionRequest.findByIdAndUpdate(requestId, { status: 'rejected' });
    res.status(200).json({ success: true, message: "Rejected" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};