const User = require('../models/User');
const ConnectionRequest = require('../models/ConnectionRequest');



// 1. Send Request
exports.sendRequest = async (req, res) => {
  try {
    const { to_user_id } = req.body;
    const from_user_id = req.user.id;

    if (to_user_id === from_user_id) {
      return res.status(403).json({ success: false, error_code: "CANNOT_SEND_REQUEST_TO_SELF", message: "Cannot send to self" });
    }

    const targetUser = await User.findById(to_user_id);
    if (!targetUser) return res.status(404).json({ success: false, error_code: "USER_NOT_FOUND", message: "User does not exist" });

    // Check if already connected
    const sender = await User.findById(from_user_id);
    if (sender.connections.includes(to_user_id)) {
      return res.status(409).json({ success: false, error_code: "ALREADY_CONNECTED", message: "Already connected" });
    }

    // Check if request pending
    const existingReq = await ConnectionRequest.findOne({
      $or: [
        { sender_id: from_user_id, receiver_id: to_user_id }, // You sent
        { sender_id: to_user_id, receiver_id: from_user_id }  // They sent
      ]
    });

    if (existingReq) {
      return res.status(409).json({ success: false, error_code: "REQUEST_ALREADY_SENT", message: "Request pending" });
    }

    // Create Request
    await ConnectionRequest.create({ sender_id: from_user_id, receiver_id: to_user_id });

    res.status(200).json({ success: true, message: "Connection request sent", request_status: "pending" });

  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
  }
};

// 2. Accept Request
exports.acceptRequest = async (req, res) => {
  try {
    const { from_user_id } = req.body;
    const current_user_id = req.user.id;

    const request = await ConnectionRequest.findOne({
      sender_id: from_user_id,
      receiver_id: current_user_id,
      status: 'pending'
    });

    if (!request) return res.status(404).json({ success: false, error_code: "REQUEST_NOT_FOUND", message: "No pending request" });

    // Transaction logic (Atomic update preferred in Prod)
    await User.findByIdAndUpdate(current_user_id, { $addToSet: { connections: from_user_id } });
    await User.findByIdAndUpdate(from_user_id, { $addToSet: { connections: current_user_id } });
    
    // Delete the request
    await ConnectionRequest.findByIdAndDelete(request._id);

    res.status(200).json({ success: true, message: "Request accepted", connection_status: "connected" });

  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
  }
};
exports.getFollowers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { receiver_id: req.user.id, status: 'pending' };

    const total = await ConnectionRequest.countDocuments(query);
    const requests = await ConnectionRequest.find(query)
      .populate('sender_id', 'name username profilePic')
      .skip(skip)
      .limit(limit);

    const followers = requests.map(req => ({
      user_id: req.sender_id._id,
      name: req.sender_id.name,
      username: req.sender_id.username,
      profilePic: req.sender_id.profilePic,
      is_pending: true,
      is_connected: false,
      can_accept_request: true
    }));

    res.status(200).json({
      success: true,
      page, limit,
      total_followers: total,
      total_pages: Math.ceil(total / limit),
      followers
    });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
  }
};

// 4. Get Following (Requests Sent)
exports.getFollowing = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { sender_id: req.user.id, status: 'pending' };

    const total = await ConnectionRequest.countDocuments(query);
    const requests = await ConnectionRequest.find(query)
      .populate('receiver_id', 'name username profilePic')
      .skip(skip)
      .limit(limit);

    const following = requests.map(req => ({
      user_id: req.receiver_id._id,
      name: req.receiver_id.name,
      username: req.receiver_id.username,
      profilePic: req.receiver_id.profilePic,
      is_pending: true,
      is_connected: false,
      request_sentAt: req.createdAt
    }));

    res.status(200).json({
      success: true,
      page, limit,
      total_following: total,
      total_pages: Math.ceil(total / limit),
      following
    });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
  }
};

// 5. Get Connections
exports.getConnections = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // We fetch the current user and populate their connections array
    const user = await User.findById(req.user.id)
      .populate({
        path: 'connections',
        select: 'name username profilePic',
        options: { skip, limit }
      });
    
    // We need a separate count query since populate doesn't give total count of array
    const currentUser = await User.findById(req.user.id);
    const total = currentUser.connections.length;

    // Mocking 'connectedAt' as it's not stored in the simple Array model
    // In a real generic relational DB, this would come from a pivot table. 
    // Here we just return the user data.
    const connections = user.connections.map(conn => ({
      user_id: conn._id,
      name: conn.name,
      username: conn.username,
      profilePic: conn.profilePic,
      connectedAt: new Date() // Placeholder
    }));

    res.status(200).json({
      success: true,
      page, limit,
      total_connections: total,
      total_pages: Math.ceil(total / limit),
      connections
    });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
  }
};

// 6. Cancel Sent Request
exports.cancelRequest = async (req, res) => {
  try {
    const { to_user_id } = req.body;
    const result = await ConnectionRequest.findOneAndDelete({
      sender_id: req.user.id,
      receiver_id: to_user_id,
      status: 'pending'
    });

    if (!result) return res.status(404).json({ success: false, error_code: "REQUEST_NOT_FOUND", message: "Request not found" });

    res.status(200).json({ success: true, message: "Request cancelled successfully", to_user_id, request_status: "cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
  }
};

// 7. Remove Connection
exports.removeConnection = async (req, res) => {
  try {
    const { user_id } = req.body;
    const myId = req.user.id;

    // Remove from both users' arrays
    const me = await User.findByIdAndUpdate(myId, { $pull: { connections: user_id } });
    const them = await User.findByIdAndUpdate(user_id, { $pull: { connections: myId } });

    if (!me || !them) return res.status(404).json({ success: false, error_code: "CONNECTION_NOT_FOUND", message: "User not found" });

    res.status(200).json({ success: true, message: "Connection removed successfully", user_id, connection_status: "removed" });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
  }
};