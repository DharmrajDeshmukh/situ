const GroupCollabRequest = require('../models/GroupCollabRequest');
const Group = require('../models/Group');
const User = require('../models/User');
// const Invitation = require('../models/Invitation'); // uncomment when ready

/* =====================================================
   1. CREATE / UPDATE HIRING REQUIREMENT (OWNER / ADMIN)
   ===================================================== */
exports.createOrUpdateHiringRequirement = async (req, res) => {
  try {
    const { groupId } = req.params;
    const {
      requiredSkills,
      preferredSkills,
      message,
      hiringMode,
      preferredCity
    } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // 🔐 OPTIONAL: permission check (recommended)
    if (
      group.owner_id.toString() !== req.user.id &&
      !group.admins.includes(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage hiring"
      });
    }

    group.hiring = {
      isOpen: true,
      requiredSkills: requiredSkills || [],
      preferredSkills: preferredSkills || [],
      message: message || null,
      hiringMode: hiringMode || "ONLINE",
      preferredCity: preferredCity || null,
      updatedAt: new Date()
    };

    await group.save();

    res.status(200).json({
      success: true,
      message: "Hiring requirement saved",
      hiring: group.hiring
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* =====================================================
   2. CLOSE GROUP HIRING
   ===================================================== */
exports.closeGroupHiring = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { rejectPending } = req.body; // 🔥 NEW FLAG

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // 🔐 Permission check
    if (
      group.owner_id.toString() !== req.user.id &&
      !group.admins.includes(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to close hiring"
      });
    }

    // 🔒 Close hiring
    group.hiring.isOpen = false;
    group.hiring.updatedAt = new Date();
    await group.save();

    // 🔥 OPTIONAL: Reject pending requests
    if (rejectPending === true) {
      await GroupCollabRequest.updateMany(
        { group_id: groupId, status: "PENDING" },
        { status: "REJECTED" }
      );
    }

    res.status(200).json({
      success: true,
      message: rejectPending
        ? "Hiring closed and all pending requests rejected"
        : "Hiring closed successfully",
      rejectedPending: rejectPending === true
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



/* =====================================================
   3. SEND COLLAB REQUEST (USER → GROUP)
   ===================================================== */
exports.sendCollabRequest = async (req, res) => {
  try {

    const { groupId } = req.params
    const { skills, message } = req.body

    /* =====================================================
       1️⃣ CHECK GROUP
    ===================================================== */

    const group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      })
    }

    /* =====================================================
       2️⃣ CHECK HIRING STATUS
    ===================================================== */

    if (!group.hiring || group.hiring.isOpen !== true) {
      return res.status(400).json({
        success: false,
        message: "Hiring is closed"
      })
    }

    /* =====================================================
       3️⃣ CHECK IF USER ALREADY MEMBER
    ===================================================== */

    const isMember =
      group.members?.includes(req.user.id) ||
      group.owner_id.toString() === req.user.id ||
      group.admins?.includes(req.user.id)

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group"
      })
    }

    /* =====================================================
       4️⃣ PREVENT DUPLICATE REQUEST
    ===================================================== */

    const existingRequest = await GroupCollabRequest.findOne({
      group_id: groupId,
      requester_id: req.user.id,
      status: "PENDING"
    })

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending request"
      })
    }

    /* =====================================================
       5️⃣ SKILL HANDLING
    ===================================================== */

    let skill_id = null

    if (Array.isArray(skills) && skills.length > 0) {
      skill_id = skills[0]   // choose first skill
    }

    /* =====================================================
       6️⃣ CREATE REQUEST
    ===================================================== */

    const request = await GroupCollabRequest.create({
      group_id: groupId,
      requester_id: req.user.id,
      skill_id,
      message: message || null,
      status: "PENDING"
    })

    /* =====================================================
       7️⃣ RESPONSE
    ===================================================== */

    return res.status(200).json({
      success: true,
      message: "Collaboration request sent",
      requestId: request._id
    })

  } catch (err) {

    console.error("sendCollabRequest error:", err)

    return res.status(500).json({
      success: false,
      message: "Server error"
    })

  }
}



/* =====================================================
   4. GET PENDING COLLAB REQUESTS (ADMIN)
   ===================================================== */
exports.getPendingCollabRequests = async (req, res) => {
  try {
    const { groupId } = req.params;

    const requests = await GroupCollabRequest
      .find({ group_id: groupId, status: "PENDING" })
      .populate("requester_id", "name username profile_image");

    const list = requests.map(r => ({
      requestId: r._id,
      groupId: r.group_id,
      requesterUserId: r.requester_id._id,
      requesterName: r.requester_id.name,
      requesterUsername: r.requester_id.username,
      requesterProfileImage: r.requester_id.profile_image,
      skillId: r.skill_id,
      message: r.message,
      status: r.status,
      createdAt: r.created_at
    }));

    res.status(200).json({ requests: list });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   5. GET MY COLLAB REQUEST STATUS
   ===================================================== */
exports.getMyCollabRequestStatus = async (req, res) => {
  try {
    const { groupId } = req.params;

    const request = await GroupCollabRequest.findOne({
      group_id: groupId,
      requester_id: req.user.id
    }).sort({ created_at: -1 });

    if (!request) {
      return res.status(200).json({
        requestId: null,
        status: null
      });
    }

    res.status(200).json({
      requestId: request._id,
      status: request.status
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   6. APPROVE COLLAB REQUEST (ADMIN)
   ===================================================== */
exports.approveCollabRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await GroupCollabRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Request already processed"
      });
    }

    const group = await Group.findById(request.group_id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // 1️⃣ Add to GroupMember collection
    const existingMember = await GroupMember.findOne({
      groupId: group._id,
      user_id: request.requester_id
    });

    if (!existingMember) {
      await GroupMember.create({
        groupId: group._id,
        user_id: request.requester_id,
        role: "member"
      });
    }

    // 2️⃣ Add to Group.members array (if you still use this)
    await Group.updateOne(
      { _id: group._id },
      { $addToSet: { members: request.requester_id } }
    );

    // 3️⃣ Optional: Add to group chat
    await ChatRoom.updateOne(
      { groupId: group._id, type: "GROUP" },
      {
        $addToSet: {
          members: {
            userId: request.requester_id,
            role: "MEMBER",
            joinedAt: new Date()
          }
        }
      }
    );

    // 4️⃣ Mark request accepted
    request.status = "ACCEPTED";
    await request.save();

    return res.status(200).json({
      success: true,
      message: "User added to group successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


/* =====================================================
   7. REJECT COLLAB REQUEST (ADMIN)
   ===================================================== */
exports.rejectCollabRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await GroupCollabRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    request.status = "REJECTED";
    await request.save();

    res.status(200).json({
      success: true,
      message: "Request rejected"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* =====================================================
   8. REJECT ALL PENDING REQUESTS (ADMIN)
   ===================================================== */
exports.rejectAllPendingCollabRequests = async (req, res) => {
  try {
    const { groupId } = req.params;

    await GroupCollabRequest.updateMany(
      { group_id: groupId, status: "PENDING" },
      { status: "REJECTED" }
    );

    res.status(200).json({
      success: true,
      message: "All pending requests rejected"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
