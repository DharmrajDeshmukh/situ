const Request = require("../models/Request");
const Group = require('../models/Group');
const User = require('../models/User');
const GroupMember = require("../models/GroupMember")
const ChatRoom = require("../models/ChatRoom")
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
    const { rejectPending } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Permission check
    if (
      group.owner_id.toString() !== req.user.id &&
      !group.admins.includes(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to close hiring"
      });
    }

    // Close hiring
    group.hiring.isOpen = false;
    group.hiring.updatedAt = new Date();
    await group.save();

    /* DELETE ALL PENDING REQUESTS */

    if (rejectPending === true) {

     await Request.deleteMany({
  groupId: groupId,
  type: "GROUP_COLLAB",
  status: "PENDING"
});
    }

    res.status(200).json({
      success: true,
      message: rejectPending
        ? "Hiring closed and pending requests deleted"
        : "Hiring closed successfully"
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

const existingRequest = await Request.findOne({
  groupId: groupId,
  senderId: req.user.id,
  type: "GROUP_COLLAB",
  status: "PENDING"
});

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending request"
      })
    }


    

    /* =====================================================
       6️⃣ CREATE REQUEST
    ===================================================== */

 const request = await Request.create({
  type: "GROUP_COLLAB",
  senderId: req.user.id,
  groupId: groupId,
  role: "member",
  skills: skills || [],
  message: message || null,
  status: "PENDING"
});

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

 const requests = await Request.find({
  groupId: groupId,
  type: "GROUP_COLLAB",
  status: "PENDING"
})
.populate("senderId", "name profile_image")
.sort({ createdAt: -1 });

  const list = requests.map(r => ({
  requestId: r._id,
  groupId: r.groupId,

  userId: r.senderId?._id || null,
  userName: r.senderId?.name || "Unknown",
  userProfileImage: r.senderId?.profile_image || null,

  skills: r.skills || [],
  message: r.message || null,

  status: r.status,

  createdAt: r.createdAt,
  updatedAt: r.updatedAt || null
}));

    return res.status(200).json({
      success: true,
      requests: list
    });

  } catch (err) {

    console.error("getPendingCollabRequests error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load collaboration requests"
    });

  }
};

/* =====================================================
   5. GET MY COLLAB REQUEST STATUS
   ===================================================== */

exports.getMyCollabRequestStatus = async (req, res) => {
  try {

    const { groupId } = req.params;
    const userId = req.user.id;

    /* ==============================
       FIND LATEST COLLAB REQUEST
    ============================== */

    const request = await Request.findOne({
      groupId: groupId,
      senderId: userId,
      type: "GROUP_COLLAB"
    }).sort({ createdAt: -1 });

    /* ==============================
       IF NO REQUEST
    ============================== */

    if (!request) {
      return res.status(200).json({
        requestId: null,
        status: null
      });
    }

    /* ==============================
       RESPONSE
    ============================== */

    return res.status(200).json({
      requestId: request._id,
      status: request.status
    });

  } catch (err) {

    console.error("getMyCollabRequestStatus error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};

/* =====================================================
   6. APPROVE COLLAB REQUEST (ADMIN)
   ===================================================== */
exports.approveCollabRequest = async (req, res) => {
  try {

    const { requestId } = req.params

    const request = await Request.findById(requestId)

    if (!request) {
      return res.status(404).json({
        success:false,
        message:"Request not found"
      })
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success:false,
        message:"Request already processed"
      })
    }

    const group = await Group.findById(request.groupId)

    if (!group) {
      return res.status(404).json({
        success:false,
        message:"Group not found"
      })
    }

    /* APPROVE REQUEST */

    request.status = "APPROVED"
    await request.save()

    /* SEND GROUP INVITE */

    await Request.create({

      senderId: req.user.id,
      receiverId: request.senderId,

      groupId: request.groupId,

      type: "GROUP_INVITE",
      role: "member",

      message: "Owner accepted your collaboration request. Join the group?",

      status: "PENDING"

    })

    return res.status(200).json({
      success:true,
      message:"User approved. Invitation sent."
    })

  }
  catch(err){

    console.error("approveCollabRequest error:",err)

    return res.status(500).json({
      success:false,
      message:"Server error"
    })

  }
}


/* =====================================================
   7. REJECT COLLAB REQUEST (ADMIN)
   ===================================================== */
exports.rejectCollabRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

  const request = await Request.findById(requestId);
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

  await Request.deleteMany({
  groupId: groupId,
  type: "GROUP_COLLAB",
  status: "PENDING"
});

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
