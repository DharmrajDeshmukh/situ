const User = require('../models/User');

// 1. Edit Profile (Bulk)
exports.editProfile = async (req, res) => {
  try {
    const updates = req.body;
    const userId = req.user.id;

    // Check Username uniqueness if provided
    if (updates.username) {
      const exists = await User.findOne({ username: updates.username, _id: { $ne: userId } });
      if (exists) {
        return res.status(409).json({ success: false, error_code: "USERNAME_ALREADY_EXISTS", message: "Username taken" });
      }
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
    
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updated_fields: Object.keys(updates)
    });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
  }
};

// 2. Get My Profile
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('connections', 'name username profilePic'); // Populate connections preview

    if (!user) return res.status(404).json({ success: false, error_code: "PROFILE_NOT_FOUND", message: "User not found" });

    // Mocking aggregations for Post/Ideas/Groups since those models don't exist in this snippet
    // In a real app, you would do: await Post.countDocuments({ author: user._id })
    const responseData = {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      college: user.college,
      profilePic: user.profilePic,
      skills: user.skills,
      interests: user.interests,
      projectsCount: 0, // Placeholder
      followers: 0, // Placeholder
      following: 0, // Placeholder
      connections: user.connections.length,
      createdAt: user.createdAt
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
  }
};

// 3. Update Name
exports.updateName = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { name: req.body.name });
    res.status(200).json({ success: true, message: "Name updated successfully", updated_name: req.body.name });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
  }
};

// 4. Update Username
exports.updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ success: false, error_code: "USERNAME_ALREADY_EXISTS", message: "Username taken" });

    await User.findByIdAndUpdate(req.user.id, { username });
    res.status(200).json({ success: true, message: "Username updated successfully", updated_username: username });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
  }
};

// 5. Update Bio
exports.updateBio = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { bio: req.body.bio });
    res.status(200).json({ success: true, message: "Bio updated successfully", updated_bio: req.body.bio });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
  }
};

// 6. Update College
exports.updateCollege = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { college: req.body.college });
    res.status(200).json({ success: true, message: "College updated successfully", updated_college: req.body.college });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
  }
};

// 7. Get Skill Suggestions
exports.getSkillSuggestions = (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(200).json({ query: "", suggestions: [] });

  const allSkills = ["Kotlin", "Java", "Python", "JavaScript", "Node.js", "React", "Ktor", "Kubernetes", "AWS"]; // Mock DB
  const suggestions = allSkills.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 10);

  res.status(200).json({ query, suggestions });
};

// 8. Manage Skills (Remove)
exports.removeSkill = async (req, res) => {
  try {
    const { skill } = req.body;
    const user = await User.findById(req.user.id);
    
    // Check if exists (Case insensitive logic requires more complex query, doing simple JS check here)
    const skillIndex = user.skills.findIndex(s => s.toLowerCase() === skill.toLowerCase());
    if (skillIndex === -1) return res.status(404).json({ success: false, error_code: "SKILL_NOT_FOUND", message: "Skill not found" });

    user.skills.splice(skillIndex, 1);
    await user.save();

    res.status(200).json({ success: true, message: "Skill removed", removed_skill: skill, total_skills: user.skills.length });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
  }
};

// 9. Add Interest
exports.addInterest = async (req, res) => {
  try {
    const { interest } = req.body;
    const user = await User.findById(req.user.id);

    if (user.interests.some(i => i.toLowerCase() === interest.toLowerCase())) {
      return res.status(409).json({ success: false, error_code: "INTEREST_ALREADY_EXISTS", message: "Already added" });
    }

    user.interests.push(interest);
    await user.save();

    res.status(200).json({ success: true, message: "Interest added", added_interest: interest, total_interests: user.interests.length });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
  }
};

// 10. Remove Interest
exports.removeInterest = async (req, res) => {
  try {
    const { interest } = req.body;
    const user = await User.findById(req.user.id);

    const index = user.interests.findIndex(i => i.toLowerCase() === interest.toLowerCase());
    if (index === -1) return res.status(404).json({ success: false, error_code: "INTEREST_NOT_FOUND", message: "Not found" });

    user.interests.splice(index, 1);
    await user.save();

    res.status(200).json({ success: true, message: "Interest removed", removed_interest: interest, total_interests: user.interests.length });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
  }
};

// 11. Update Profile Picture
exports.updateProfilePic = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error_code: "INVALID_IMAGE", message: "No image uploaded" });

    // MOCK: In production, upload `req.file.buffer` to S3/Cloudinary here.
    // For now, we assume local storage or generate a fake URL.
    const mockUrl = `https://cdn.setu.com/user/${req.user.id}/profile.jpg`;

    await User.findByIdAndUpdate(req.user.id, { profilePic: mockUrl });

    res.status(200).json({ success: true, message: "Profile picture updated", profilePic_url: mockUrl });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: "Server error" });
  }
};
// 12. Get User Projects
exports.getUserProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find projects where user is creator OR contributor, AND visibility is public
    const query = {
      $or: [{ creator_id: req.user.id }, { contributors: req.user.id }],
      visibility: 'public'
    };

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('group_id', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formatted = projects.map(p => ({
      project_id: p._id,
      project_title: p.title,
      project_pic: p.pic,
      visibility: p.visibility,
      role: p.creator_id.toString() === req.user.id ? 'Creator' : p.role,
      group_id: p.group_id ? p.group_id._id : null,
      group_name: p.group_id ? p.group_id.name : null,
      contributors: p.contributors.length,
      likes: p.likes,
      views: p.views,
      createdAt: p.createdAt
    }));

    res.status(200).json({
      success: true,
      page, limit,
      total_projects: total,
      total_pages: Math.ceil(total / limit),
      projects: formatted
    });
  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
  }
};

// ... (Existing functions: editProfile, getMyProfile, etc.) ...

// 14. Get Any User Profile (Read Only)
exports.getUserProfileView = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Construct Public Profile
    const response = {
      success: true,
      permissions: { is_owner: false, can_edit: false, can_message: true },
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
      stats: { total_projects: 0, ongoing_projects: 0, completed_projects: 0 },
      projects: { count: 0, list: [] },
      posts: { count: 0, list: [] }
    };
    res.status(200).json(response);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// 15. Open Profile (Auto Redirect)
exports.openUserProfile = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const myId = req.user.id;
    
    const profileType = (targetUserId === myId) ? "SELF" : "OTHER";
    
    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check connection status (Mock logic)
    const connectionState = { status: "NOT_CONNECTED" }; 
    if (user.connections && user.connections.includes(myId)) {
        connectionState.status = "CONNECTED";
    }

    res.status(200).json({
      profileType: profileType,
      user: {
        userId: user._id,
        username: user.username,
        profileImage: user.profilePic
      },
      connection: connectionState
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};