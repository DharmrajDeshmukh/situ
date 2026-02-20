// const User = require('../models/User');

// // 1. Edit Profile (Bulk)
// exports.editProfile = async (req, res) => {
//   try {
//     const updates = req.body;
//     const userId = req.user.id;

//     // Check Username uniqueness if provided
//     if (updates.username) {
//       const exists = await User.findOne({ username: updates.username, _id: { $ne: userId } });
//       if (exists) {
//         return res.status(409).json({ success: false, error_code: "USERNAME_ALREADY_EXISTS", message: "Username taken" });
//       }
//     }

//     const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
    
//     res.status(200).json({
//       success: true,
//       message: "Profile updated successfully",
//       updated_fields: Object.keys(updates)
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
//   }
// };

// // 2. Get My Profile
// exports.getMyProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate('connections', 'name username profilePic'); // Populate connections preview

//     if (!user) return res.status(404).json({ success: false, error_code: "PROFILE_NOT_FOUND", message: "User not found" });

//     // Mocking aggregations for Post/Ideas/Groups since those models don't exist in this snippet
//     // In a real app, you would do: await Post.countDocuments({ author: user._id })
//     const responseData = {
//       id: user._id,
//       name: user.name,
//       username: user.username,
//       email: user.email,
//       phone: user.phone,
//       bio: user.bio,
//       college: user.college,
//       profilePic: user.profilePic,
//       skills: user.skills,
//       interests: user.interests,
//       projectsCount: 0, // Placeholder
//       followers: 0, // Placeholder
//       following: 0, // Placeholder
//       connections: user.connections.length,
//       createdAt: user.createdAt
//     };

//     res.status(200).json(responseData);
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
//   }
// };

// // 3. Update Name
// exports.updateName = async (req, res) => {
//   try {
//     await User.findByIdAndUpdate(req.user.id, { name: req.body.name });
//     res.status(200).json({ success: true, message: "Name updated successfully", updated_name: req.body.name });
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
//   }
// };

// // 4. Update Username
// exports.updateUsername = async (req, res) => {
//   try {
//     const { username } = req.body;
//     const exists = await User.findOne({ username });
//     if (exists) return res.status(409).json({ success: false, error_code: "USERNAME_ALREADY_EXISTS", message: "Username taken" });

//     await User.findByIdAndUpdate(req.user.id, { username });
//     res.status(200).json({ success: true, message: "Username updated successfully", updated_username: username });
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
//   }
// };

// // 5. Update Bio
// exports.updateBio = async (req, res) => {
//   try {
//     await User.findByIdAndUpdate(req.user.id, { bio: req.body.bio });
//     res.status(200).json({ success: true, message: "Bio updated successfully", updated_bio: req.body.bio });
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
//   }
// };

// // 6. Update College
// exports.updateCollege = async (req, res) => {
//   try {
//     await User.findByIdAndUpdate(req.user.id, { college: req.body.college });
//     res.status(200).json({ success: true, message: "College updated successfully", updated_college: req.body.college });
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
//   }
// };

// // 7. Get Skill Suggestions
// exports.getSkillSuggestions = (req, res) => {
//   const { query } = req.query;
//   if (!query) return res.status(200).json({ query: "", suggestions: [] });

//   const allSkills = ["Kotlin", "Java", "Python", "JavaScript", "Node.js", "React", "Ktor", "Kubernetes", "AWS"]; // Mock DB
//   const suggestions = allSkills.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 10);

//   res.status(200).json({ query, suggestions });
// };

// // 8. Manage Skills (Remove)
// exports.removeSkill = async (req, res) => {
//   try {
//     const { skill } = req.body;
//     const user = await User.findById(req.user.id);
    
//     // Check if exists (Case insensitive logic requires more complex query, doing simple JS check here)
//     const skillIndex = user.skills.findIndex(s => s.toLowerCase() === skill.toLowerCase());
//     if (skillIndex === -1) return res.status(404).json({ success: false, error_code: "SKILL_NOT_FOUND", message: "Skill not found" });

//     user.skills.splice(skillIndex, 1);
//     await user.save();

//     res.status(200).json({ success: true, message: "Skill removed", removed_skill: skill, total_skills: user.skills.length });
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
//   }
// };

// // 9. Add Interest
// exports.addInterest = async (req, res) => {
//   try {
//     const { interest } = req.body;
//     const user = await User.findById(req.user.id);

//     if (user.interests.some(i => i.toLowerCase() === interest.toLowerCase())) {
//       return res.status(409).json({ success: false, error_code: "INTEREST_ALREADY_EXISTS", message: "Already added" });
//     }

//     user.interests.push(interest);
//     await user.save();

//     res.status(200).json({ success: true, message: "Interest added", added_interest: interest, total_interests: user.interests.length });
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
//   }
// };

// // 10. Remove Interest
// exports.removeInterest = async (req, res) => {
//   try {
//     const { interest } = req.body;
//     const user = await User.findById(req.user.id);

//     const index = user.interests.findIndex(i => i.toLowerCase() === interest.toLowerCase());
//     if (index === -1) return res.status(404).json({ success: false, error_code: "INTEREST_NOT_FOUND", message: "Not found" });

//     user.interests.splice(index, 1);
//     await user.save();

//     res.status(200).json({ success: true, message: "Interest removed", removed_interest: interest, total_interests: user.interests.length });
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
//   }
// };

// // 11. Update Profile Picture
// exports.updateProfilePic = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ success: false, error_code: "INVALID_IMAGE", message: "No image uploaded" });

//     // MOCK: In production, upload `req.file.buffer` to S3/Cloudinary here.
//     // For now, we assume local storage or generate a fake URL.
//     const mockUrl = `https://cdn.setu.com/user/${req.user.id}/profile.jpg`;

//     await User.findByIdAndUpdate(req.user.id, { profilePic: mockUrl });

//     res.status(200).json({ success: true, message: "Profile picture updated", profilePic_url: mockUrl });
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
//   }
// };
// // 12. Get User Projects
// exports.getUserProjects = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     // Find projects where user is creator OR contributor, AND visibility is public
//     const query = {
//       $or: [{ creator_id: req.user.id }, { contributors: req.user.id }],
//       visibility: 'public'
//     };

//     const total = await Project.countDocuments(query);
//     const projects = await Project.find(query)
//       .populate('group_id', 'name')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const formatted = projects.map(p => ({
//       project_id: p._id,
//       project_title: p.title,
//       project_pic: p.pic,
//       visibility: p.visibility,
//       role: p.creator_id.toString() === req.user.id ? 'Creator' : p.role,
//       group_id: p.group_id ? p.group_id._id : null,
//       group_name: p.group_id ? p.group_id.name : null,
//       contributors: p.contributors.length,
//       likes: p.likes,
//       views: p.views,
//       createdAt: p.createdAt
//     }));

//     res.status(200).json({
//       success: true,
//       page, limit,
//       total_projects: total,
//       total_pages: Math.ceil(total / limit),
//       projects: formatted
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
//   }
// };

// // ... (Existing functions: editProfile, getMyProfile, etc.) ...

// // 14. Get Any User Profile (Read Only)
// exports.getUserProfileView = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });

//     // Construct Public Profile
//     const response = {
//       success: true,
//       permissions: { is_owner: false, can_edit: false, can_message: true },
//       profile: {
//         user_id: user._id,
//         name: user.name,
//         username: user.username,
//         profile_image: user.profilePic,
//         bio: user.bio,
//         college: user.college,
//         skills: user.skills || [],
//         interests: user.interests || [],
//         joined_at: user.createdAt
//       },
//       stats: { total_projects: 0, ongoing_projects: 0, completed_projects: 0 },
//       projects: { count: 0, list: [] },
//       posts: { count: 0, list: [] }
//     };
//     res.status(200).json(response);
//   } catch (err) { res.status(500).json({ success: false, message: err.message }); }
// };

// // 15. Open Profile (Auto Redirect)
// exports.openUserProfile = async (req, res) => {
//   try {
//     const targetUserId = req.params.userId;
//     const myId = req.user.id;
    
//     const profileType = (targetUserId === myId) ? "SELF" : "OTHER";
    
//     const user = await User.findById(targetUserId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Check connection status (Mock logic)
//     const connectionState = { status: "NOT_CONNECTED" }; 
//     if (user.connections && user.connections.includes(myId)) {
//         connectionState.status = "CONNECTED";
//     }

//     res.status(200).json({
//       profileType: profileType,
//       user: {
//         userId: user._id,
//         username: user.username,
//         profileImage: user.profilePic
//       },
//       connection: connectionState
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// };

const User = require('../models/User');
const Group = require('../models/Group');
const ConnectionRequest = require('../models/ConnectionRequest');
const ProjectMember = require("../models/ProjectMember");
const Project = require("../models/Project");
const GroupMember = require("../models/GroupMember");
const Post = require("../models/Post"); // if you have




// Helper: Get Mock Counts (Replace with real DB counts in prod)
const getStats = async (userId) => {
  return {
    projectsCount: 5,
    followers: 120,
    following: 75,
    connections: 40,
    no_of_group: 3,
    no_of_My_idea: 2,
    no_of_my_posts: 10
  };
};


// 1. Edit Full Profile (Authoritative)
// Matches: @PUT("/project1/api/v1/profile/edit")
exports.editProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const updates = {};

    if (req.body.name !== undefined)
      updates.name = req.body.name;

    if (req.body.username !== undefined)
      updates.username = req.body.username;

    if (req.body.bio !== undefined)
      updates.bio = req.body.bio;

    if (req.body.college !== undefined)
      updates.college = req.body.college;

    if (req.body.skills !== undefined)
      updates.skills = req.body.skills;

    if (req.body.interests !== undefined)
      updates.interests = req.body.interests;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    );

  const {
  _id,
  name,

  bio,
  profilePic,
  skills,
  interests
} = updatedUser;

return res.json({
  success: true,
  message: "Profile updated successfully",
  user: {
    id: _id,
    name,
   
    bio,
    profilePic: profilePic || null,
    skills,
    interests
  }
});
;

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};





// 2. Get My Profile (Editable Data)
// Matches: @GET("/project1/api/v1/profile/me")
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    /* ================= GROUPS ================= */

    const groupMemberships = await GroupMember.find({
      userId: userId
    }).populate("groupId");

    const groups = groupMemberships
      .filter(m => m.groupId)
      .map(m => ({
        group_id: m.groupId._id,
        name: m.groupId.name,
        profilePic: m.groupId.profileImage || null
      }));

    /* ================= PROJECTS ================= */

    const projectMemberships = await ProjectMember.find({
      user_id: userId,
      status: "ACCEPTED",
      is_removed: false
    }).populate("project_id");

    const allProjects = projectMemberships
      .filter(m => m.project_id && !m.project_id.is_deleted)
      .map(m => ({
        project_id: m.project_id._id,
        title: m.project_id.title,
        bannerUrl: m.project_id.banner_url,
        role: m.role,
        group_id: m.project_id.group_id || null
      }));

    const standaloneProjects = allProjects.filter(p => !p.group_id);

 /* ================= POSTS ================= */

const standalonePosts = await Post.find({
  user_id: userId,
  group_id: null,
  project_id: null,
  is_deleted: false
})
.sort({ createdAt: -1 })
.select("_id text media createdAt")
.lean();

const posts = standalonePosts.map(p => ({
  post_id: p._id,
  text: p.text,
  media: p.media,
  createdAt: p.createdAt
}));


    /* ================= COUNTS ================= */

    const followersCount = user.followers ? user.followers.length : 0;
    const connectionsCount = user.connections ? user.connections.length : 0;
    const projectsCount = allProjects.length;

    /* ================= RESPONSE ================= */

    res.status(200).json({
      success: true,
      id: user._id,
      name: user.name,
      bio: user.bio,
      profilePic: user.profilePic || null,
      skills: user.skills || [],

      stats: {
        no_of_followers: followersCount,
        no_of_connections: connectionsCount,
        no_of_projects: projectsCount
      },

      groups: {
        count: groups.length,
        list: groups
      },

      projects: {
        count: allProjects.length,
        list: allProjects
      },

      standalone_projects: {
        count: standaloneProjects.length,
        list: standaloneProjects
      },

      standalone_posts: {
        count: posts.length,
        list: posts
      }
    });

  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// 3. Update Name
// Matches: @PUT("/project1/api/v1/profile/update-name")
exports.updateName = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { name: req.body.name });
    res.status(200).json({ success: true, message: "Name updated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 4. Update Username
// Matches: @PUT("/project1/api/v1/profile/update-username")
exports.updateUsername = async (req, res) => {
  try {
    // Check uniqueness
    const existing = await User.findOne({ username: req.body.username });
    if (existing && existing._id.toString() !== req.user.id) {
      return res.status(409).json({ success: false, message: "Username taken" });
    }
    
    await User.findByIdAndUpdate(req.user.id, { username: req.body.username });
    res.status(200).json({ success: true, message: "Username updated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 5. Update Bio
// Matches: @PUT("/project1/api/v1/profile/update-bio")
exports.updateBio = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { bio: req.body.bio });
    res.status(200).json({ success: true, message: "Bio updated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 6. Update College
// Matches: @PUT("/project1/api/v1/profile/update-college")
exports.updateCollege = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { college: req.body.college });
    res.status(200).json({ success: true, message: "College updated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 7. Add Skill
// Matches: @POST("/project1/api/v1/profile/add-skill")
exports.addSkill = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { $addToSet: { skills: req.body.skill } }, // Prevent duplicates
      { new: true }
    );
    res.status(200).json({ 
      success: true, 
      message: "Skill added", 
      total_skills: user.skills.length 
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 8. Remove Skill
// Matches: @DELETE("/project1/api/v1/profile/remove-skill")
exports.removeSkill = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { $pull: { skills: req.body.skill } },
      { new: true }
    );
    res.status(200).json({ 
      success: true, 
      message: "Skill removed", 
      total_skills: user.skills.length 
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 9. Add Interest
// Matches: @POST("/project1/api/v1/profile/add-interest")
exports.addInterest = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { $addToSet: { interests: req.body.interest } },
      { new: true }
    );
    res.status(200).json({ 
      success: true, 
      message: "Interest added", 
      total_interests: user.interests.length 
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 10. Remove Interest
// Matches: @DELETE("/project1/api/v1/profile/remove-interest")
exports.removeInterest = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { $pull: { interests: req.body.interest } },
      { new: true }
    );
    res.status(200).json({ 
      success: true, 
      message: "Interest removed", 
      total_interests: user.interests.length 
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// SUGGESTIONS (Mock Data)
// Matches: @GET("/project1/api/v1/skills/suggestions")
exports.getSkillSuggestions = (req, res) => {
  const query = req.query.query || "";
  const allSkills = ["Kotlin", "Java", "Python", "Node.js", "React", "AWS", "Docker"];
  const suggestions = allSkills.filter(s => s.toLowerCase().includes(query.toLowerCase()));
  res.status(200).json({ query, suggestions });
};

// Matches: @GET("/project1/api/v1/colleges/suggestions")
exports.getCollegeSuggestions = (req, res) => {
  const query = req.query.query || "";
  const colleges = ["IIT Bombay", "IIT Delhi", "BITS Pilani", "NIT Trichy", "Anna University"];
  const suggestions = colleges.filter(c => c.toLowerCase().includes(query.toLowerCase()));
  res.status(200).json({ query, suggestions });
};

// Matches: @GET("/project1/api/v1/interests/suggestions")
exports.getInterestSuggestions = (req, res) => {
  const query = req.query.query || "";
  const interests = ["AI", "Blockchain", "Web Dev", "Mobile Dev", "Cloud Computing"];
  const suggestions = interests.filter(i => i.toLowerCase().includes(query.toLowerCase()));
  res.status(200).json({ query, suggestions });
};

// 11. Update Profile Picture
// Matches: @POST("/project1/api/v1/profile/update-profile-picture")
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // ✅ Cloudinary returns full hosted URL here
    const imageUrl = req.file.path;

    // Optional: Get previous image (for future deletion logic)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update profile picture
    user.profilePic = imageUrl;
    await user.save();

    res.status(200).json({
      success: true,
      profilePic_url: imageUrl,
      updatedAt: new Date()
    });

  } catch (err) {
    console.error("PROFILE PIC UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// 12. Get User Projects
// Matches: @GET("/project1/api/v1/profile/user-projects")
exports.getUserProjects = async (req, res) => {
  try {
    // Mock response matching UserProjectsResponse
    res.status(200).json({
      success: true,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      total_projects: 2,
      total_pages: 1,
      projects: [
        {
          project_id: "p1",
          project_name: "Smart AI Bot",
          cover_image: "https://via.placeholder.com/150"
        },
        {
          project_id: "p2",
          project_name: "E-Commerce App",
          cover_image: null
        }
      ]
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};


// 13. Get Any User Profile (Read Only)
// Matches: @GET("/project1/api/v1/profile/view/{userId}")
exports.getUserProfileView = async (req, res) => {
  try {
    const viewerId = req.user.id;          // 👈 logged-in user
    const targetUserId = req.params.userId;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ================= CONNECTION STATUS =================
    let connectionStatus = "NOT_CONNECTED";

    const connection = await ConnectionRequest.findOne({
      target_type: "USER",
      $or: [
        { sender_id: viewerId, receiver_id: targetUserId },
        { sender_id: targetUserId, receiver_id: viewerId }
      ]
    });

    if (connection) {
      if (connection.status === "accepted") {
        connectionStatus = "CONNECTED";
      } else if (connection.status === "pending") {
        if (connection.sender_id.toString() === viewerId) {
          connectionStatus = "REQUEST_SENT";
        } else {
          connectionStatus = "REQUEST_RECEIVED";
        }
      }
    }

    // ================= GROUPS =================
    const publicGroups = await Group.find({
      visibility: "public",
      members: { $in: [user._id] }
    })
      .select("name description profile_image visibility created_at")
      .lean();

    const formattedGroups = publicGroups.map(group => ({
      group_id: group._id,
      name: group.name,
      description: group.description ?? "",
      profile_image: group.profile_image ?? null,
      visibility: group.visibility,
      joined_at: group.created_at
    }));

    // ================= RESPONSE =================
    res.status(200).json({
      success: true,

      connectionStatus, // ✅ THIS WAS MISSING

      permissions: {
        is_owner: false,
        can_edit: false,
        can_message: connectionStatus === "CONNECTED"
      },

      profile: {
        user_id: user._id,
        name: user.name,
        username: user.username,
        profile_image: user.profilePic,
        bio: user.bio,
        college: user.college,
        skills: user.skills || [],
        interests: user.interests || [],
        joined_at: user.createdAt
      },

      stats: {
        total_projects: 5,
        ongoing_projects: 2,
        completed_projects: 3
      },

      groups: {
        count: formattedGroups.length,
        list: formattedGroups
      },

      projects: { count: 0, list: [] },
      posts: { count: 0, list: [] }
    });

  } catch (err) {
    console.error("Profile view error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};




// 14. Open Profile (Auto Redirect)
// Matches: @GET("/project1/api/v1/profile/open/{userId}")
exports.openUserProfile = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user.id;
    const type = (targetId === myId) ? "SELF" : "OTHER";
    
    const user = await User.findById(targetId);
    
    res.status(200).json({
      profileType: type,
      user: {
        userId: user._id,
        username: user.username,
        profileImage: user.profilePic
      },
      connection: { status: "NOT_CONNECTED" } // Mock status
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};


