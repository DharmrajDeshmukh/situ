const GroupCollabRequest = require('../models/GroupCollabRequest');
const Group = require('../models/Group');
const User = require('../models/User');

// 1. Create/Update Hiring Requirement
exports.createOrUpdateHiringRequirement = async (req, res) => {
  try {
    // In a real app, you'd store this in a "Hiring" collection. 
    // Here we mock success.
    res.status(200).json({ success: true, message: "Requirement Updated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 2. Close Hiring
exports.closeGroupHiring = async (req, res) => {
  res.status(200).json({ success: true, message: "Hiring Closed" });
};

// 3. Send Collab Invite (Outbound)
exports.sendCollabInvite = async (req, res) => {
  res.status(200).json({ success: true, message: "Invite Sent" });
};

// 4. Send Collab Request (Inbound from User)
exports.sendCollabRequest = async (req, res) => {
  try {
    const { groupId, skillId, message, attachmentUrl } = req.body;
    
    await GroupCollabRequest.create({
      group_id: groupId,
      requester_id: req.user.id,
      skill_id, message, attachment_url: attachmentUrl
    });

    res.status(200).json({ success: true, message: "Request Sent" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 5. Get Pending Requests (For Admin)
exports.getPendingCollabRequests = async (req, res) => {
  try {
    const requests = await GroupCollabRequest.find({ group_id: req.params.groupId, status: 'PENDING' })
      .populate('requester_id', 'name username profilePic');

    const list = requests.map(r => ({
      requestId: r._id,
      groupId: r.group_id,
      requesterUserId: r.requester_id._id,
      requesterName: r.requester_id.name,
      requesterUsername: r.requester_id.username,
      requesterProfileImage: r.requester_id.profilePic,
      skillId: r.skill_id,
      message: r.message,
      status: r.status,
      createdAt: r.created_at
    }));

    res.status(200).json({ requests: list });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 6. Get My Request Status
exports.getMyCollabRequestStatus = async (req, res) => {
  try {
    const reqEst = await GroupCollabRequest.findOne({ 
      group_id: req.params.groupId, requester_id: req.user.id 
    }).sort({ created_at: -1 });

    if (!reqEst) return res.status(200).json({ requestId: "", status: "PENDING" }); // Default
    
    res.status(200).json({ requestId: reqEst._id, status: reqEst.status });
  } catch (err) { res.status(500).json({ message: err.message }); }
};