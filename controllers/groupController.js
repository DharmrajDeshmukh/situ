// const Group = require('../models/Group');

// // Helper to determine User Role
// const getUserRole = (group, userId) => {
//   if (group.owner_id.toString() === userId) return "owner";
//   if (group.admins.includes(userId)) return "admin";
//   if (group.members.includes(userId)) return "member";
//   return "visitor";
// };

// // 1. CREATE GROUP (Manual)
// exports.createGroup = async (req, res) => {
//   try {
//     const { name, description, visibility } = req.body;
//     const newGroup = await Group.create({
//       name, description, visibility,
//       owner_id: req.user.id,
//       members: [req.user.id],
//       admins: [req.user.id]
//     });
//     res.status(200).json({ success: true, group_id: newGroup._id, role: "owner" });
//   } catch (err) { res.status(500).json({ success: false, message: err.message }); }
// };

// // 2. CREATE GROUP FROM IDEA (Mock Logic)
// exports.createGroupFromIdea = async (req, res) => {
//   try {
//     const { idea_id, name } = req.body;
//     // In a real app, fetch Idea details here and copy them to Group
//     const newGroup = await Group.create({
//       name: name || "New Idea Group",
//       description: "Created from idea " + idea_id,
//       owner_id: req.user.id,
//       members: [req.user.id]
//     });
//     res.status(200).json({ success: true, group_id: newGroup._id, role: "owner" });
//   } catch (err) { res.status(500).json({ success: false, message: err.message }); }
// };

// // 3. GET GROUP DETAILS (ZIP - Huge Response)
// exports.getGroupDetailsZip = async (req, res) => {
//   try {
//     const { group_id } = req.params;
//     const group = await Group.findById(group_id).populate('members', 'name');
//     if (!group) return res.status(404).json({ success: false, message: "Group not found" });

//     const userId = req.user.id;
//     const role = getUserRole(group, userId);

//     const response = {
//       success: true,
//       user_context: {
//         role: role,
//         permissions: {
//           can_like: true,
//           can_comment: true,
//           can_share: true,
//           can_create_post: role !== 'visitor',
//           can_manage_project: role === 'owner' || role === 'admin'
//         }
//       },
//       group_details: {
//         group_id: group._id,
//         name: group.name,
//         description: group.description,
//         visibility: group.visibility,
//         owner_id: group.owner_id,
//         profile_image: group.profile_image,
//         banner_image: group.banner_image,
//         created_at: group.created_at
//       },
//       group_project_details: {
//         project_status: group.project_status,
//         current_stage: group.current_stage,
//         started_at: group.started_at,
//         expected_completion: group.expected_completion,
//         technology_stack: group.technology_stack || [],
//         last_activity_at: group.last_activity_at
//       },
//       group_posts: { total_posts: 0, posts: [] }, // Populate with real posts if needed
//       group_members: {
//         total_members: group.members.length,
//         members: group.members.map(m => ({
//           user_id: m._id,
//           name: m.name,
//           role: m._id.toString() === group.owner_id.toString() ? "owner" : "member",
//           joined_at: new Date()
//         }))
//       },
//       group_followers_overview: { followers_count: group.followers_count }
//     };
//     res.status(200).json(response);
//   } catch (err) { res.status(500).json({ success: false, message: err.message }); }
// };

// // 4. GET GROUP OVERVIEW
// exports.getGroupOverview = async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.group_id);
//     if (!group) return res.status(404).json({ success: false, message: "Not Found" });
    
//     res.status(200).json({
//       members_count: group.members.length,
//       followers_count: group.followers_count,
//       project_count: 1 // Mock
//     });
//   } catch (err) { res.status(500).json({ success: false, message: err.message }); }
// };

// // 5. GET MY GROUP ACCESS
// exports.getMyGroupAccess = async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.group_id);
//     const userId = req.user.id;
//     const isMember = group.members.includes(userId);
//     const role = getUserRole(group, userId);

//     res.status(200).json({
//       "is member": isMember, // NOTE: Frontend @SerializedName("is member") has a space!
//       role: role,
//       permissions: {
//         can_post: isMember,
//         can_manage_members: role === 'owner',
//         can_edit_group: role === 'owner' || role === 'admin',
//         can_delete_group: role === 'owner'
//       }
//     });
//   } catch (err) { res.status(500).json({ success: false, message: err.message }); }
// };

// // 6. UPDATE GROUP NAME
// exports.updateGroupName = async (req, res) => {
//   try {
//     const { name } = req.body;
//     await Group.findByIdAndUpdate(req.params.group_id, { name });
//     res.status(200).json({}); // Returns Unit (empty 200 OK)
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };

// // 7. UPDATE GROUP DESCRIPTION
// exports.updateGroupDescription = async (req, res) => {
//   try {
//     const { description } = req.body;
//     await Group.findByIdAndUpdate(req.params.group_id, { description });
//     res.status(200).json({});
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };

// // 8. UPDATE PROFILE IMAGE
// exports.updateGroupProfileImage = async (req, res) => {
//   if (!req.file) return res.status(400).json({ message: "No file" });
//   // Mock URL - In production, use AWS S3 URL
//   const url = `https://mock-cdn.com/${req.file.filename}`;
//   await Group.findByIdAndUpdate(req.params.group_id, { profile_image: url });
//   res.status(200).json({ url: url });
// };

// // 9. UPDATE BANNER
// exports.updateGroupBanner = async (req, res) => {
//   if (!req.file) return res.status(400).json({ message: "No file" });
//   const url = `https://mock-cdn.com/${req.file.filename}`;
//   await Group.findByIdAndUpdate(req.params.group_id, { banner_image: url });
//   res.status(200).json({ url: url });
// };

// // 10. GET MY GROUPS (ZIP for Home Screen)
// exports.getMyGroupsZip = async (req, res) => {
//   try {
//     // Find all groups where user is a member
//     const groups = await Group.find({ members: req.user.id });

//     const list = groups.map(g => ({
//       group_id: g._id,
//       name: g.name,
//       role: getUserRole(g, req.user.id),
//       members_count: g.members.length,
//       last_activity_at: g.last_activity_at
//     }));

//     res.status(200).json({ success: true, groups: list });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };


// const Group = require('../models/Group');
// const User = require('../models/User'); 

// // ... (Keep existing createGroup, createGroupFromIdea, getGroupDetailsZip from previous answer) ...

// // --- NEW FUNCTIONS TO ADD ---

// // 5. GET MY GROUP ACCESS (Updated for new frontend fields)
// // Matches: @GET("/api/v1/groups/{group_id}/my-access") [cite: 311]
// exports.getMyGroupAccess = async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.group_id);
//     const userId = req.user.id;
//     const isMember = group.members.includes(userId);
    
//     // Logic to determine role [cite: 557]
//     let role = "visitor";
//     if (group.owner_id.toString() === userId) role = "owner";
//     else if (group.admins.includes(userId)) role = "admin";
//     else if (isMember) role = "member";

//     res.status(200).json({
//       isMember: isMember,     // Matches val isMember 
//       isFollower: false,      // New field [cite: 555]
//       isConnected: false,     // New field [cite: 556]
//       role: role,             // Matches val role [cite: 557]
//       permissions: {          // Matches val permissions [cite: 558]
//         can_post: isMember,
//         can_manage_members: role === 'owner' || role === 'admin',
//         can_edit_group: role === 'owner' || role === 'admin',
//         can_delete_group: role === 'owner',
//         canEditPermissions: role === 'owner' // New field [cite: 659]
//       }
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };

// // 11. GET GROUP MEMBERS
// // Matches: @GET("/api/v1/groups/{group_id}/members") [cite: 334]
// exports.getGroupMembers = async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.group_id).populate('members', 'name');
    
//     const membersList = group.members.map(m => ({
//       user_id: m._id,
//       name: m.name,
//       role: m._id.toString() === group.owner_id.toString() ? "owner" : "member", // Simple logic
//       joined_at: new Date() // Placeholder
//     }));

//     // Matches GroupMembersResponse [cite: 634]
//     res.status(200).json({
//       success: true,
//       members: membersList
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };

// // 12. UPDATE MEMBER ROLE
// // Matches: @PUT("/api/v1/groups/{group_id}/members/{user_id}/role") [cite: 337]
// exports.updateMemberRole = async (req, res) => {
//   try {
//     const { role } = req.body; // Map<String, String> [cite: 340]
//     // In real app: Update the user's role in the group (e.g. add to admins array)
//     // For now, we just return success
//     res.status(200).json({}); 
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };

// // 13. REMOVE MEMBER
// // Matches: @DELETE("/api/v1/groups/{group_id}/members/{user_id}") [cite: 342]
// exports.removeMember = async (req, res) => {
//   try {
//     await Group.findByIdAndUpdate(req.params.group_id, {
//       $pull: { members: req.params.user_id, admins: req.params.user_id }
//     });
//     res.status(200).json({});
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };

// // 14. GET MEMBER PERMISSIONS
// // Matches: @GET("/api/v1/groups/{group_id}/members/{user_id}/permissions") [cite: 347]
// exports.getMemberPermissions = async (req, res) => {
//   try {
//     // Matches GroupMemberPermissions [cite: 651]
//     res.status(200).json({
//       can_post: true,
//       can_manage_members: false,
//       can_edit_group: false,
//       can_delete_group: false,
//       canEditPermissions: false
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };

// // 15. UPDATE MEMBER PERMISSIONS
// // Matches: @PUT("/api/v1/groups/{group_id}/members/{user_id}/permissions") [cite: 351]
// exports.updateMemberPermissions = async (req, res) => {
//   try {
//     // req.body contains the permissions object [cite: 354]
//     res.status(200).json({});
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };

// // 16. GET GROUP PROJECTS
// // Matches: @GET("/api/v1/groups/{group_id}/projects") [cite: 357]
// exports.getGroupProjects = async (req, res) => {
//   try {
//     // Matches GroupProjectsResponse [cite: 663]
//     res.status(200).json({
//       success: true,
//       projects: [
//         {
//           project_id: "p1",
//           title: "AI App",
//           description: "An AI project",
//           status: "ongoing",
//           created_at: new Date()
//         }
//       ]
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };
const Group = require('../models/Group');
const User = require('../models/User');
const Community = require('../models/Community');
const ChatRoom = require('../models/ChatRoom');
const GroupMember = require('../models/GroupMember');
const mongoose = require("mongoose");
const Project = require("../models/project");


// Helper to determine User Role
const getUserRole = (group, userId) => {
  if (group.owner_id.toString() === userId) return "owner";
  if (group.admins.includes(userId)) return "admin";
  if (group.members.some(id => id.toString() === userId)) return "member";
  return "visitor";
};

// 1. CREATE GROUP (Manual)
exports.createGroup = async (req, res) => {
  try {
    const { name, description, visibility, members = [] } = req.body;

    const uniqueMembers = [
      req.user.id,
      ...members.filter(id => id !== req.user.id)
    ];

          // 1️⃣ CREATE GROUP
      const group = await Group.create({
        name,
        description,
        visibility,
        owner_id: req.user.id,
        members: uniqueMembers,
        admins: [req.user.id]
      });

      await GroupMember.create({
  groupId: group._id,
  userId: req.user.id,
  role: "owner",
  permissions: {
    canCreateProject: true,
    canCreatePost: true,
    canDeletePost: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canHireMembers: true
  }
});

      // 2️⃣ CREATE COMMUNITY
      const community = await Community.create({
        name,
        createdBy: req.user.id,
        members: uniqueMembers,
        groupId: group._id
      });

      // 3️⃣ LINK COMMUNITY TO GROUP
      group.communityId = community._id;
      await group.save();

      // 4️⃣ ✅ CREATE DEFAULT "GENERAL" CHAT ROOM  (🔥 IMPORTANT)
            await ChatRoom.create({
        name: "General",
        communityId: community._id,
        groupId: group._id,      // 🔥 THIS WAS MISSING
        type: "GROUP",
        createdBy: req.user.id
      });


      // 5️⃣ SEND RESPONSE (LAST STEP)
      res.status(201).json({
        success: true,
        group_id: group._id,
        community_id: community._id,
        role: "owner"
      });



  } catch (err) {
    console.error("CREATE GROUP ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};




// 2. CREATE GROUP FROM IDEA
exports.createGroupFromIdea = async (req, res) => {
  try {
    const { idea_id, name } = req.body;
    const newGroup = await Group.create({
      name: name || "New Idea Group",
      description: "Created from idea " + idea_id,
      owner_id: req.user.id,
      members: [req.user.id]
    });
    res.status(200).json({ success: true, group_id: newGroup._id, role: "owner" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 3. GET GROUP DETAILS (ZIP)
exports.getGroupDetailsZip = async (req, res) => {
  try {
    const { group_id } = req.params;
    const group = await Group.findById(group_id).populate('members', 'name');
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const userId = req.user.id;
    const role = getUserRole(group, userId);

       

    const response = {
      success: true,
      user_context: {
        role: role,
        permissions: {
          can_like: true,
          can_comment: true,
          can_share: true,
          can_create_post: role !== 'visitor',
          can_manage_project: role === 'owner' || role === 'admin'
        }
      },
      group_details: {
          group_id: group._id,
            community_id: group.communityId,
          name: group.name,
          description: group.description,
          visibility: group.visibility,
          owner_id: group.owner_id,
          profile_image: group.profile_image,
          banner_image: group.banner_image,
          created_at: group.created_at
        }
,
      group_project_details: {
        project_status: group.project_status,
        current_stage: group.current_stage,
        started_at: group.started_at,
        expected_completion: group.expected_completion,
        technology_stack: group.technology_stack || [],
        last_activity_at: group.last_activity_at
      },
      group_posts: { total_posts: 0, posts: [] },
      group_members: {
        total_members: group.members.length,
        members: group.members.map(m => ({
          user_id: m._id,
          name: m.name,
          role: m._id.toString() === group.owner_id.toString() ? "owner" : "member",
          joined_at: new Date()
        }))
      },
      group_followers_overview: { followers_count: group.followers_count }
    };
    res.status(200).json(response);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 4. GET GROUP OVERVIEW
exports.getGroupOverview = async (req, res) => {
  try {
    const group = await Group.findById(req.params.group_id);
    if (!group) return res.status(404).json({ success: false, message: "Not Found" });
    
    res.status(200).json({
      members_count: group.members.length,
      followers_count: group.followers_count,
      project_count: 1
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 5. GET MY GROUP ACCESS (Updated)
exports.getMyGroupAccess = async (req, res) => {
  try {
    const group = await Group.findById(req.params.group_id);

    // ✅ ADD IT HERE
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const userId = req.user.id;

    const isMember = group.members.some(
      id => id.toString() === userId
    );

    let role = "visitor";
    if (group.owner_id.toString() === userId) {
      role = "owner";
    } else if (group.admins.some(id => id.toString() === userId)) {
      role = "admin";
    } else if (isMember) {
      role = "member";
    }

    res.status(200).json({
      isMember,
      isFollower: false,
      isConnected: false,
      role,
      permissions: {
        can_post: isMember,
        can_manage_members: role === "owner" || role === "admin",
        can_edit_group: role === "owner" || role === "admin",
        can_delete_group: role === "owner",
        canEditPermissions: role === "owner"
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6. UPDATE GROUP NAME
exports.updateGroupName = async (req, res) => {
  try {
    const { name } = req.body;
    await Group.findByIdAndUpdate(req.params.group_id, { name });
    res.status(200).json({});
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 7. UPDATE GROUP DESCRIPTION
exports.updateGroupDescription = async (req, res) => {
  try {
    const { description } = req.body;
    await Group.findByIdAndUpdate(req.params.group_id, { description });
    res.status(200).json({});
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 8. UPDATE PROFILE IMAGE
exports.updateGroupProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = req.file.path; // ✅ Cloudinary URL

    await Group.findByIdAndUpdate(req.params.group_id, {
      profile_image: imageUrl
    });

    res.status(200).json({ url: imageUrl });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 9. UPDATE BANNER
exports.updateGroupBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = req.file.path; // ✅ Cloudinary URL

    await Group.findByIdAndUpdate(req.params.group_id, {
      banner_image: imageUrl
    });

    res.status(200).json({ url: imageUrl });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 10. GET MY GROUPS (ZIP for Home Screen)
exports.getMyGroupsZip = async (req, res) => {
  try {

    const groups = await Group.find({
      members: req.user.id
    })
    .select("_id name profile_image members admins owner_id last_activity_at")
    .lean(); // 🔥 performance optimization

    const list = groups.map(g => ({
      group_id: g._id,
      name: g.name,
      profileImage: g.profile_image || null,  // ✅ NOW INCLUDED
      role: getUserRole(g, req.user.id),
      members_count: g.members.length,
      last_activity_at: g.last_activity_at
    }));

    res.status(200).json({
      success: true,
      groups: list
    });

  } catch (err) {
    console.error("getMyGroupsZip error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 11. GET GROUP MEMBERS
exports.getGroupMembers = async (req, res) => {
  try {
    const group = await Group
      .findById(req.params.group_id)
      .populate({
        path: 'members',
        select: 'name profilePic' // ✅ INCLUDE profilePic
      });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const membersList = group.members.map(user => ({
      user_id: user._id,
      name: user.name,
      profileImage: user.profilePic || null, // ✅ SEND IMAGE
      role: user._id.toString() === group.owner_id.toString()
        ? "owner"
        : "member",
      joined_at: new Date()
    }));

    res.status(200).json({
      success: true,
      members: membersList
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 12. UPDATE MEMBER ROLE
exports.updateMemberRole = async (req, res) => {
  try {
    res.status(200).json({}); 
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 13. REMOVE MEMBER
exports.removeMember = async (req, res) => {
  try {
    await Group.findByIdAndUpdate(req.params.group_id, {
      $pull: { members: req.params.user_id, admins: req.params.user_id }
    });
    res.status(200).json({});
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 14. GET MEMBER PERMISSIONS
exports.getMemberPermissions = async (req, res) => {
  try {
    res.status(200).json({
      can_post: true,
      can_manage_members: false,
      can_edit_group: false,
      can_delete_group: false,
      canEditPermissions: false
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 15. UPDATE MEMBER PERMISSIONS
exports.updateMemberPermissions = async (req, res) => {
  try {
    res.status(200).json({});
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 16. GET GROUP PROJECTS

exports.addMembersToGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "No members provided" });
    }

    const group = await Group.findById(group_id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    for (const userId of members) {

      // Add to Group.members safely
      if (!group.members.some(id => id.toString() === userId)) {
        group.members.push(userId);
      }

      // Prevent duplicate GroupMember entry
      const existing = await GroupMember.findOne({
        groupId: group._id,
        userId: userId
      });

      if (!existing) {
        await GroupMember.create({
          groupId: group._id,
          userId: userId,
          role: "member",
          permissions: {
            canCreateProject: false,
            canCreatePost: true,
            canDeletePost: false,
            canInviteMembers: false,
            canRemoveMembers: false,
            canHireMembers: false
          }
        });
      }
    }

    await group.save();

    res.status(200).json({
      success: true,
      added_members: members.length
    });

  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};









exports.getMyPostGroups = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const memberships = await GroupMember.find({
      userId: userId
    });

    console.log("Memberships:", memberships);

    const groupIds = memberships.map(m => m.groupId);

    const groups = await Group.find({
  _id: { $in: groupIds }
}).select("_id name profile_image");

const formattedGroups = groups.map(g => ({
  group_id: g._id,
  name: g.name,
  profileImage: g.profile_image || null
}));

res.status(200).json({
  success: true,
  groups: formattedGroups
});

  } catch (error) {
    console.error("getMyPostGroups error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch groups"
    });
  }
};


exports.getGroupProjects = async (req, res) => {
  try {
    const { group_id } = req.params;

    const projects = await Project.find({
      group_id: group_id,
      is_deleted: false
    }).sort({ createdAt: -1 });

    const formatted = projects.map(p => ({
      project_id: p._id.toString(),
      title: p.title,
      description: p.description,
      banner_url: p.banner_url,
      visibility: p.visibility,
      created_at: p.createdAt
    }));

    res.status(200).json({
      success: true,
      projects: formatted
    });

  } catch (err) {
    console.error("getGroupProjects error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group projects"
    });
  }
};