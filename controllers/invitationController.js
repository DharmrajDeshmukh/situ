// const Invitation = require("../models/Invitation");
// const Project = require("../models/Project");
// const GroupMember = require("../models/GroupMember");
// const Community = require("../models/Community");
// const ChatRoom = require("../models/ChatRoom");

// /* =====================================================
//    SEND INVITATION
//    ===================================================== */

// exports.sendInvitation = async (req, res) => {
//   try {
//     const userId = req.user?._id || req.user?.id;
//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const {
//       targetId,
//       targetType,
//       invitedUserId,
//       role,
//       source,
//       groupId
//     } = req.body;

//     /* =====================================================
//        BASIC VALIDATIONS
//        ===================================================== */

//     const allowedTargets = ["GROUP", "PROJECT"];
//     const allowedSources = ["COLLAB_APPROVAL", "DIRECT_INVITE"];
//     const allowedRoles = ["member", "admin", "co_owner"];

//     if (!allowedTargets.includes(targetType)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid targetType"
//       });
//     }

//     if (!allowedSources.includes(source)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid source"
//       });
//     }

//     if (role && !allowedRoles.includes(role)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid role"
//       });
//     }

//     /* =====================================================
//        DIRECT INVITE VALIDATION
//        ===================================================== */
//     if (source === "DIRECT_INVITE") {
//       if (!invitedUserId) {
//         return res.status(400).json({
//           success: false,
//           message: "invitedUserId is required"
//         });
//       }

//       if (invitedUserId.toString() === userId.toString()) {
//         return res.status(400).json({
//           success: false,
//           message: "Cannot invite yourself"
//         });
//       }
//     }

//     /* =====================================================
//        GROUP JOIN REQUEST (OUTSIDE USER)
//        ===================================================== */
//     if (targetType === "GROUP" && source === "COLLAB_APPROVAL") {

//       const existing = await Invitation.findOne({
//         type: "GROUP",
//         targetId,
//         requestedBy: userId,
//         status: { $in: ["PENDING", "APPROVED"] }
//       });

//       if (existing) {
//         return res.status(400).json({
//           success: false,
//           message: "Join request already sent"
//         });
//       }

//       await Invitation.create({
//         type: "GROUP",
//         targetId,
//         groupId: targetId,
//         requestedBy: userId,
//         role: role || "member",
//         source,
//         status: "PENDING"
//       });

//       return res.json({
//         success: true,
//         message: "Join request sent"
//       });
//     }

//     /* =====================================================
//        PROJECT / DIRECT INVITE PERMISSION
//        ===================================================== */
//     if (targetType === "PROJECT") {
//       if (!groupId) {
//         return res.status(400).json({
//           success: false,
//           message: "groupId required"
//         });
//       }

//       const member = await GroupMember.findOne({
//         groupId,
//         userId,
//         role: { $in: ["owner", "admin", "co_owner"] }
//       });

//       if (!member) {
//         return res.status(403).json({
//           success: false,
//           message: "No permission to invite"
//         });
//       }
//     }

//     /* =====================================================
//        DUPLICATE DIRECT / PROJECT INVITE CHECK
//        ===================================================== */
//     const duplicateInvite = await Invitation.findOne({
//       targetId,
//       invitedUserId,
//       status: { $in: ["PENDING", "APPROVED"] }
//     });

//     if (duplicateInvite) {
//       return res.status(400).json({
//         success: false,
//         message: "Invitation already sent"
//       });
//     }

//     /* =====================================================
//        CREATE INVITATION
//        ===================================================== */
//     const invitation = await Invitation.create({
//       type: targetType,
//       targetId,
//       groupId: targetType === "GROUP" ? targetId : groupId,
//       invitedUserId,
//       invitedBy: userId,
//       role: role || "member",
//       source,
//       status: "PENDING"
//     });

//     return res.json({
//       success: true,
//       invitationId: invitation._id
//     });

//   } catch (err) {
//     console.error("sendInvitation error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };


// /* =====================================================
//    ACCEPT INVITATION
//    ===================================================== */

// exports.acceptInvitation = async (req, res) => {
//   try {
//     const { invitationId } = req.body;
//     const userId = req.user?._id || req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const invitation = await Invitation.findById(invitationId);
//     if (!invitation || invitation.status !== "PENDING") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid invitation"
//       });
//     }

//     /* =====================================================
//        GROUP JOIN REQUEST (ADMIN APPROVAL)
//        ===================================================== */
//     if (invitation.type === "GROUP") {

//       // ❌ requester cannot approve own request
//       if (invitation.requestedBy?.toString() === userId.toString()) {
//         return res.status(403).json({
//           success: false,
//           message: "Cannot approve your own request"
//         });
//       }

//       const admin = await GroupMember.findOne({
//         groupId: invitation.groupId,
//         userId,
//         role: { $in: ["owner", "admin", "co_owner"] }
//       });

//       if (!admin) {
//         return res.status(403).json({
//           success: false,
//           message: "No permission to approve request"
//         });
//       }

//       invitation.status = "APPROVED";
//       await invitation.save();

//       return res.json({
//         success: true,
//         message: "Request approved"
//       });
//     }

//     /* =====================================================
//        DIRECT / PROJECT INVITE
//        ===================================================== */
//     if (
//       invitation.invitedUserId &&
//       invitation.invitedUserId.toString() !== userId.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     /* ---------- PROJECT JOIN ---------- */
//     if (invitation.type === "PROJECT") {

//       const isGroupMember = await GroupMember.findOne({
//         groupId: invitation.groupId,
//         userId
//       });

//       if (!isGroupMember) {
//         return res.status(403).json({
//           success: false,
//           message: "Not a group member"
//         });
//       }

//       await Project.findByIdAndUpdate(invitation.targetId, {
//         $addToSet: {
//           members: { userId, role: invitation.role }
//         }
//       });

//       invitation.status = "ACCEPTED";
//       await invitation.save();

//       return res.json({
//         success: true,
//         message: "Joined project successfully"
//       });
//     }

//     /* ---------- DIRECT INVITE ---------- */
//     invitation.status = "ACCEPTED";
//     await invitation.save();

//     return res.json({
//       success: true,
//       message: "Invitation accepted"
//     });

//   } catch (err) {
//     console.error("acceptInvitation error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };


// /* =====================================================
//    REJECT INVITATION
//    ===================================================== */

// exports.rejectInvitation = async (req, res) => {
//   try {
//     const { invitationId } = req.body;
//     const userId = req.user?._id || req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const invitation = await Invitation.findById(invitationId);
//     if (!invitation || invitation.status !== "PENDING") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid invitation"
//       });
//     }

//     /* =====================================================
//        GROUP JOIN REQUEST
//        ===================================================== */
//     if (invitation.type === "GROUP") {

//       // ✅ Admin / Owner / Co-owner can reject
//       const admin = await GroupMember.findOne({
//         groupId: invitation.groupId,
//         userId,
//         role: { $in: ["owner", "admin", "co_owner"] }
//       });

//       // ✅ OR requester can cancel own request
//       if (!admin && invitation.requestedBy?.toString() !== userId.toString()) {
//         return res.status(403).json({
//           success: false,
//           message: "No permission to reject request"
//         });
//       }

//       invitation.status = "REJECTED";
//       await invitation.save();

//       return res.json({
//         success: true,
//         message: "Group request rejected"
//       });
//     }

//     /* =====================================================
//        DIRECT / PROJECT INVITE
//        ===================================================== */
//     if (
//       invitation.invitedUserId &&
//       invitation.invitedUserId.toString() !== userId.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     invitation.status = "REJECTED";
//     await invitation.save();

//     return res.json({
//       success: true,
//       message: "Invitation rejected"
//     });

//   } catch (error) {
//     console.error("rejectInvitation error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };



// /* =====================================================
//    GET MY INVITATIONS
//    ===================================================== */

// exports.getMyInvitations = async (req, res) => {
//   try {
//     const userId = req.user?._id || req.user?.id;
//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const invitations = await Invitation.find({
//       status: { $in: ["PENDING", "APPROVED", "ACCEPTED"] },
//       $or: [
//         { invitedUserId: userId },   // direct / project invites
//         { requestedBy: userId }      // group join requests
//       ]
//     }).sort({ createdAt: -1 });

//     return res.json({
//       success: true,
//       invitations: invitations.map(inv => ({
//         invitationId: inv._id,
//         type: inv.type,
//         targetId: inv.targetId,
//         groupId: inv.groupId,
//         role: inv.role,
//         source: inv.source,
//         status: inv.status,
//         createdAt: inv.createdAt
//       }))
//     });

//   } catch (error) {
//     console.error("getMyInvitations error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };


// /* =====================================================
//    JOIN GROUP
//    ===================================================== */

// exports.joinGroup = async (req, res) => {
//   try {
//     const { invitationId } = req.body;
//     const userId = req.user._id;

//     const invitation = await Invitation.findById(invitationId);
//     if (!invitation || invitation.status !== "APPROVED") {
//       return res.status(400).json({
//         success: false,
//         message: "Invitation not approved"
//       });
//     }

//     // ✅ Only requester can join the group
//     if (invitation.type === "GROUP") {
//       if (invitation.requestedBy.toString() !== userId.toString()) {
//         return res.status(403).json({
//           success: false,
//           message: "Unauthorized"
//         });
//       }
//     }

//     // ✅ FIX: correct field name (user_id)
//     const exists = await GroupMember.findOne({
//       groupId: invitation.groupId,
//       user_id: userId
//     });

//     if (exists) {
//       return res.status(400).json({
//         success: false,
//         message: "Already a member"
//       });
//     }

//     // ✅ FIX: save using user_id
//     await GroupMember.create({
//       groupId: invitation.groupId,
//       user_id: userId,
//       role: invitation.role || "member"
//     });

//     invitation.status = "ACCEPTED";
//     await invitation.save();

//     return res.json({
//       success: true,
//       message: "Joined group successfully"
//     });

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };


// /* =====================================================
//    GET GROUP INVITATIONS
//    ===================================================== */

// exports.getGroupInvitations = async (req, res) => {
//   try {
//     const { groupId } = req.params;
//     const userId = req.user?._id || req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     // ✅ FIXED: user_id field + lowercase roles
//     const admin = await GroupMember.findOne({
//       groupId,
//       user_id: userId,
//       role: { $in: ["owner", "admin", "co_owner"] }
//     });

//     if (!admin) {
//       return res.status(403).json({
//         success: false,
//         message: "No permission to view requests"
//       });
//     }

//     const invitations = await Invitation.find({
//       groupId,
//       type: "GROUP",
//       status: "PENDING"
//     })
//       .populate("requestedBy", "name username profileImage")
//       .sort({ createdAt: -1 });

//     return res.json({
//       success: true,
//       invitations: invitations.map(inv => ({
//         invitationId: inv._id,
//         requestedBy: inv.requestedBy,
//         role: inv.role,
//         source: inv.source,
//         status: inv.status,
//         createdAt: inv.createdAt
//       }))
//     });

//   } catch (err) {
//     console.error("getGroupInvitations error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };

const mongoose = require("mongoose");
const Invitation = require("../models/Invitation");
const Project = require("../models/Project");
const Group = require("../models/Group");
const GroupMember = require("../models/GroupMember");
const ProjectMember = require("../models/ProjectMember");
const ChatRoom = require("../models/ChatRoom");
const GroupCollabRequest = require("../models/GroupCollabRequest");

/* =====================================================
   SEND INVITATION
   ===================================================== */

exports.sendInvitation = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { targetId, targetType, invitedUserId, role, groupId } = req.body;

    if (!["GROUP", "PROJECT"].includes(targetType)) {
      return res.status(400).json({ success: false, message: "Invalid targetType" });
    }

    if (!invitedUserId) {
      return res.status(400).json({ success: false, message: "invitedUserId required" });
    }

    if (invitedUserId.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot invite yourself" });
    }

    // Prevent duplicate invite
    const duplicate = await Invitation.findOne({
      targetId,
      invitedUserId,
      status: { $in: ["PENDING", "ACCEPTED"] }
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: "Invitation already exists" });
    }

    const invitation = await Invitation.create({
      type: targetType,
      targetId,
      groupId: targetType === "GROUP" ? targetId : groupId,
      invitedUserId,
      invitedBy: userId,
      role: role || "MEMBER",
      status: "PENDING"
    });

    return res.json({
      success: true,
      invitationId: invitation._id
    });

  } catch (err) {
    console.error("sendInvitation error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



/* =====================================================
   ACCEPT INVITATION
   ===================================================== */

exports.acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const userId = req.user?._id || req.user?.id;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation || invitation.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Invalid invitation" });
    }

    if (invitation.invitedUserId?.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    /* ================= PROJECT INVITE ================= */

    if (invitation.type === "PROJECT") {

      // Ensure user is group member
      const groupMember = await GroupMember.findOne({
        groupId: invitation.groupId,
        user_id: userId
      });

      if (!groupMember) {
        return res.status(403).json({
          success: false,
          message: "Not a group member"
        });
      }

      // Prevent duplicate ProjectMember
      const existingProjectMember = await ProjectMember.findOne({
        project_id: invitation.targetId,
        user_id: userId
      });

      if (!existingProjectMember) {
        await ProjectMember.create({
          project_id: invitation.targetId,
          user_id: userId,
          role: invitation.role?.toUpperCase() || "MEMBER",
          status: "ACCEPTED"
        });
      }

      // Add to project chat
      await ChatRoom.updateOne(
        { projectId: invitation.targetId },
        {
          $addToSet: {
            members: {
              userId: userId,
              role: invitation.role?.toUpperCase() || "MEMBER",
              joinedAt: new Date()
            }
          }
        }
      );

      invitation.status = "ACCEPTED";
      await invitation.save();

      return res.json({
        success: true,
        message: "Joined project successfully"
      });
    }

    /* ================= GROUP INVITE ================= */

    if (invitation.type === "GROUP") {

      const exists = await GroupMember.findOne({
        groupId: invitation.groupId,
        user_id: userId
      });

      if (!exists) {
        await GroupMember.create({
          groupId: invitation.groupId,
          user_id: userId,
          role: invitation.role || "member"
        });
      }

      invitation.status = "ACCEPTED";
      await invitation.save();

      return res.json({
        success: true,
        message: "Joined group successfully"
      });
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("acceptInvitation error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



/* =====================================================
   REJECT INVITATION
   ===================================================== */

exports.rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const userId = req.user?._id || req.user?.id;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation || invitation.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Invalid invitation" });
    }

    if (invitation.invitedUserId?.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    invitation.status = "REJECTED";
    await invitation.save();

    return res.json({
      success: true,
      message: "Invitation rejected"
    });

  } catch (err) {
    console.error("rejectInvitation error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



/* =====================================================
   APPLY TO GROUP
   ===================================================== */

exports.applyToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = new mongoose.Types.ObjectId(
      req.user._id || req.user.id
    );

    const { message, skill } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = await GroupMember.exists({
      groupId: new mongoose.Types.ObjectId(groupId),
      user_id: userId
    });

    if (isMember) {
      return res.status(400).json({
        message: "Already a member"
      });
    }

    const existingRequest = await GroupCollabRequest.exists({
      group_id: new mongoose.Types.ObjectId(groupId),
      requester_id: userId,
      status: "PENDING"
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "Request already pending"
      });
    }

    const collaboration = await GroupCollabRequest.create({
      group_id: new mongoose.Types.ObjectId(groupId),
      requester_id: userId,
      skill_id: skill || null,
      message,
      status: "PENDING"
    });

    return res.status(201).json({
      message: "Collaboration request sent",
      collaboration
    });

  } catch (err) {
    console.error("applyToGroup error:", err);
    return res.status(500).json({ error: err.message });
  }
};
