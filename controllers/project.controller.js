const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const Group = require("../models/Group");
const ChatRoom = require("../models/ChatRoom");
const Post = require("../models/Post");
const Request = require("../models/Request");


/* =====================================================
   CREATE PROJECT
   ===================================================== */

exports.createProject = async (req, res) => {
  try {
    const userId = req.user.id;

   const {
  title,
  description,
  deadline,
  invites,
  group_id,
  stage
} = req.body;



const allowedStages = ["PROTOTYPE", "ONGOING", "COMPLETED"];

let finalStage = "PROTOTYPE";

if (stage && allowedStages.includes(stage)) {
  finalStage = stage;
}


    /* ================= BASIC VALIDATION ================= */

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required"
      });
    }

    let parsedInvites = [];

    if (invites) {
      try {
        parsedInvites = JSON.parse(invites);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid invites format"
        });
      }
    }

    /* ================= GROUP VALIDATION ================= */

    let group = null;

    if (group_id) {
      group = await Group.findById(group_id);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found"
        });
      }

      // Check if user belongs to group
    const isMember =
  group.owner_id.toString() === userId ||
  group.admins.some(id => id.toString() === userId) ||
  group.members.some(id => id.toString() === userId);


      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to create project in this group"
        });
      }

      if (!group.communityId) {
        return res.status(400).json({
          success: false,
          message: "Community not linked to group"
        });
      }
    }

    /* ================= BANNER ================= */

    const bannerUrl = req.file ? req.file.path : null;

    /* ================= CREATE PROJECT ================= */

  const project = await Project.create({
  title: title.trim(),
  description: description.trim(),
  deadline: deadline || null,
  banner_url: bannerUrl,
  creator_id: userId,
  group_id: group_id || null,
  stage: finalStage
});

    /* ================= ADD OWNER ================= */

    await ProjectMember.create({
      project_id: project._id,
      user_id: userId,
      role: "OWNER",
      status: "ACCEPTED",
      can_edit_project: true
    });

    /* ================= ADD INVITES ================= */



const allowedRoles = ["OWNER", "ADMIN", "MEMBER"];

await Promise.all(
  parsedInvites.map(async (invite) => {

    if (!invite.userId) return;

    if (invite.userId.toString() === userId.toString()) return;

    const exists = await ProjectMember.findOne({
      project_id: project._id,
      user_id: invite.userId
    });

    if (exists) return;

    const role = allowedRoles.includes(invite.role)
      ? invite.role
      : "MEMBER";

    await ProjectMember.create({
      project_id: project._id,
      user_id: invite.userId,
      role: role,
      status: "INVITED"
    });

    await Request.create({
      type: "PROJECT_INVITE",
      senderId: userId,
      receiverId: invite.userId,
      projectId: project._id,
      role: role,
      status: "PENDING"
    });

  })
);

    /* ================= CREATE PROJECT CHAT (IF LINKED TO GROUP) ================= */

  if (group) {

  const chatMembers = [
    {
      userId: userId,
      role: "OWNER",
      joinedAt: new Date()
    }
  ];

  const allowedRoles = ["OWNER", "ADMIN", "MEMBER"];

  for (const invite of parsedInvites) {

    // skip invalid
    if (!invite.userId) continue;

    // skip creator
    if (invite.userId.toString() === userId.toString()) continue;

    // prevent duplicate chat members
    const alreadyAdded = chatMembers.some(
      member => member.userId.toString() === invite.userId.toString()
    );

    if (alreadyAdded) continue;

    const role = allowedRoles.includes(invite.role)
      ? invite.role
      : "MEMBER";

    chatMembers.push({
      userId: invite.userId,
      role: role,
      joinedAt: new Date()
    });
  }

  const chatRoom = await ChatRoom.create({
    name: project.title,
    communityId: group.communityId,
    groupId: group._id,
    projectId: project._id,
    type: "PROJECT",
    isPrivate: true,
    members: chatMembers,
    createdBy: userId
  });

  project.chatRoomId = chatRoom._id;

  await project.save();
}
    return res.status(201).json({
      projectId: project._id,
      message: "Project created successfully"
    });

  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create project"
    });
  }
};




/* =====================================================
   GET MY POST PROJECTS
   (For Post Creation Dropdown)
   ===================================================== */

exports.getMyPostProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const memberships = await ProjectMember.find({
      user_id: userId,
      status: "ACCEPTED",
      is_removed: false
    }).populate("project_id");

    const projects = memberships
      .filter(m => m.project_id && !m.project_id.is_deleted)
      .map(m => ({
        id: m.project_id._id,
        name: m.project_id.title,
        bannerUrl: m.project_id.banner_url
      }));

    return res.json({ projects });

  } catch (error) {
    console.error("Get my projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects"
    });
  }
};



/* =====================================================
   GET PROJECT DETAIL
   ===================================================== */

exports.getProjectDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project || project.is_deleted) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // ================= FETCH POSTS =================
    const posts = await Post.find({
      project_id: projectId,
      is_deleted: false
    })
    .sort({ createdAt: -1 })
    .populate("user_id", "name profilePic");

    // Convert to DTO
    const postDtos = posts.map(post => ({
      postId: post._id,
      text: post.text,
      media: post.media,
      user: {
        id: post.user_id?._id,
        name: post.user_id?.name,
        profilePic: post.user_id?.profilePic
      },
      createdAt: post.createdAt
    }));

    // ================= FETCH MEMBERS =================
  const members = await ProjectMember.find({
  project_id: projectId,
  is_removed: false
}).populate("user_id", "_id name profilePic");

   const memberDtos = members.map(m => ({
  user_id: m.user_id._id,
  name: m.user_id.name,
  profilePic: m.user_id.profilePic || null,
  role: m.role,
  status: m.status
}));

    // ================= CHECK PERMISSION =================
    const myMembership = members.find(
      m => m.user_id._id.toString() === userId
    );

    const canEdit =
      myMembership &&
      myMembership.status === "ACCEPTED" &&
      (myMembership.role === "OWNER" ||
       myMembership.role === "ADMIN");

    // ================= RETURN RESPONSE =================
    return res.json({
      id: project._id,
      title: project.title,
      description: project.description,
      deadline: project.deadline,
      bannerUrl: project.banner_url,
      ownerId: project.creator_id,
      groupId: project.group_id,
      stage: project.stage || "PROTOTYPE",
      members: memberDtos,
      posts: postDtos,   // ✅ Now correctly defined
      canEdit,
      createdAt: project.createdAt
    });

  } catch (error) {
    console.error("Get project detail error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project detail"
    });
  }
};



/* =====================================================
   UPDATE PROJECT (Owner/Admin Only)
   ===================================================== */

exports.updateProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

   const { title, description, deadline, visibility, stage } = req.body;

    const membership = await ProjectMember.findOne({
      project_id: projectId,
      user_id: userId,
      status: "ACCEPTED",
      is_removed: false
    });

    if (!membership ||
        (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update project"
      });
    }

    const updateData = {};

    const allowedStages = ["PROTOTYPE", "ONGOING", "COMPLETED"];

if (stage && allowedStages.includes(stage)) {
  updateData.stage = stage;
}

    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (deadline) updateData.deadline = deadline;
    if (visibility) updateData.visibility = visibility;

    if (req.file) {
      updateData.banner_url = req.file.path;
    }

    await Project.findByIdAndUpdate(projectId, updateData);

    return res.json({
      success: true,
      message: "Project updated successfully"
    });

  } catch (error) {
    console.error("Update project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update project"
    });
  }
};



/* =====================================================
   DELETE PROJECT (Owner Only - Soft Delete)
   ===================================================== */

exports.deleteProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const membership = await ProjectMember.findOne({
      project_id: projectId,
      user_id: userId,
      role: "OWNER",
      status: "ACCEPTED"
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Only owner can delete project"
      });
    }

    await Project.findByIdAndUpdate(projectId, {
      is_deleted: true
    });

    return res.json({
      success: true,
      message: "Project deleted successfully"
    });

  } catch (error) {
    console.error("Delete project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete project"
    });
  }
};

exports.getProjectsByGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    const isMember =
      group.owner_id.toString() === userId ||
      group.admins.some(id => id.toString() === userId) ||
      group.members.some(id => id.toString() === userId);

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You have no access to this group"
      });
    }

    const projects = await Project.find({
     
      group_id: groupId,   // ✅ CORRECT FIELD
      is_deleted: false
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      projects
    });

  } catch (error) {
    console.error("Get group projects error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

