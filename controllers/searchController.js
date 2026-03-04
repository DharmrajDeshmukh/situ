const User = require('../models/User');
const Group = require('../models/Group');
const ChatRoom = require('../models/ChatRoom');
const DirectChat = require('../models/DirectChat');
const Post = require('../models/Post');
const Project = require('../models/Project');

const Skill = require('../models/Skill');
const Interest = require('../models/Interest');
const College = require('../models/College');
const Request = require('../models/Request');
const GroupMember = require('../models/GroupMember');

exports.search = async (req, res) => {
  try {
    const { query, context, page = 1, limit = 20 } = req.body;
    const userId = req.user.id;
    const response = {
      users: [],
      groups: [],
      projects: [],
      posts: [],
      chats: [],
      skills: [],
      interests: [],
      colleges: []
    };

    if (!query || query.trim() === '') {
      return res.json(response);
    }

    const regex = new RegExp(query.trim(), 'i');
    const skip = (page - 1) * limit;

    switch (context) {

      // =====================================================
      // HOME SEARCH (Global Search)
      // =====================================================
      case 'HOME': {

        const [
          homeUsers,
          homeGroups,
          homePosts,
          homeProjects
        ] = await Promise.all([

          // USERS
          User.find({
  $or: [{ name: regex }, { email: regex }]
})
.select('name email username profileImage')
.limit(5),

          // GROUPS
          Group.find({
            name: regex,
            visibility: 'public'
          })
          .limit(5),

          // POSTS
          Post.find({
            caption: regex
          })
          .populate('author', 'name profileImage')
          .limit(5),

          // PROJECTS
          Project.find({
            title: regex
          })
          .limit(5)
        ]);

        response.users = mapUsers(homeUsers);
        response.groups = mapGroups(homeGroups);
        response.posts = mapPosts(homePosts);
        response.projects = mapProjects(homeProjects);

        break;
      }

      // =====================================================
      // COLLAB
      // =====================================================
      case 'COLLAB': {

        const collabProjects = await Project.find({
          name: regex,
          status: 'ongoing'
        }).limit(limit);

        const collabUsers = await User.find({
          name: regex
        }).limit(5);

        response.projects = mapProjects(collabProjects);
        response.users = mapUsers(collabUsers);

        break;
      }

      // =====================================================
      // CHAT
      // =====================================================
      case 'CHAT': {

        const chatUsers = await User.find({
          name: regex
        }).limit(5);

        const chatRooms = await ChatRoom.find({
          name: regex
        }).populate('groupId');

        response.users = mapUsers(chatUsers);

        response.chats = chatRooms.map(room => ({
          chatId: room._id,
          type: 'GROUP',
          name: room.groupId
            ? `${room.groupId.name} - ${room.name}`
            : room.name,
          lastMessage: null
        }));

        break;
      }

      // =====================================================
      // GROUP MEMBER ADD
      // =====================================================
case 'GROUP_MEMBER_ADD': {

  const { groupId } = req.body;

  const currentUser = await User.findById(userId).select('connections');
  const connectedIds = currentUser?.connections || [];

  const potentialMembers = await User.find({
    name: regex,
    _id: { $ne: userId }
  }).limit(limit);

  /* ================= GROUP NOT CREATED YET ================= */

  if (!groupId || groupId === "") {

    response.users = mapUsersWithConnectionAndInvite(
      potentialMembers,
      connectedIds,
      {}
    );

    break;
  }

  /* ================= GROUP EXISTS ================= */

  const userIds = potentialMembers.map(u => u._id);

  const existingMembers = await GroupMember.find({
    groupId,
    userId: { $in: userIds }
  }).select("userId");

  const memberSet = new Set(
    existingMembers.map(m => m.userId.toString())
  );

  const requests = await Request.find({
    groupId,
    type: "GROUP_INVITE",
    receiverId: { $in: userIds }
  });

  const invitationMap = {};

  requests.forEach(req => {
    invitationMap[req.receiverId.toString()] = req.status;
  });

  const filteredUsers = potentialMembers.filter(
    u => !memberSet.has(u._id.toString())
  );

  response.users = mapUsersWithConnectionAndInvite(
    filteredUsers,
    connectedIds,
    invitationMap
  );

  break;
}

case 'PROJECT_CREATE': {

  const { groupId } = req.body;

  if (!groupId) {
    response.users = [];
    break;
  }

  const members = await GroupMember.find({
    groupId
  }).populate("userId","name profilePic");

  const filteredMembers = members
    .filter(m =>
      m.userId.name.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, limit);

  response.users = filteredMembers.map(m => ({
    userId: m.userId._id,
    fullName: m.userId.name,
    profilePic: m.userId.profilePic
  }));

  break;
}

      // =====================================================
      // SKILL
      // =====================================================
      case 'SKILL': {

        const skills = await Skill.find({
          name: regex
        }).limit(8);

        response.skills = skills.map(s => s.name);
        break;
      }

      // =====================================================
      // INTEREST
      // =====================================================
     case 'INTEREST': {

  const interests = await Interest.find({
    name: regex,
    isActive: true   // only active interests
  })
  .sort({ usageCount: -1 })  // optional: most popular first
  .limit(8)
  .select('name');

  response.interests = interests.map(i => i.name);

  break;
}

      // =====================================================
      // COLLEGE
      // =====================================================
      case 'COLLEGE': {

        const colleges = await College.find({
          name: regex
        }).limit(8);

        response.colleges = colleges.map(c => c.name);
        break;
      }

      default:
        break;
    }

    return res.json(response);

  } catch (err) {
    console.error("Search Error:", err);
    return res.status(500).json({ error: err.message });
  }
};


// =====================================================
// HELPER MAPPERS
// =====================================================

function mapUsersWithConnectionAndInvite(users, connectedIds, invitationMap) {

  return users.map(u => {

    const email = u.email ?? "";

    const username = email.includes("@")
      ? email.split("@")[0]
      : "";

    const isConnected = connectedIds.some(
      id => id.toString() === u._id.toString()
    );

    const inviteStatus =
      invitationMap[u._id.toString()] || "NONE";

    return {
      userId: u._id,
      username,
      fullName: u.name ?? "",
      profilePic: u.profilePic ?? null,

      connectionStatus:
        isConnected ? "CONNECTED" : "NOT_CONNECTED",

      invitationStatus: inviteStatus,

      // 🔥 NEW FIELD
      canInvite: true
    };
  });
}

function mapGroups(groups) {
  return groups.map(g => ({
    groupId: g._id,
    name: g.name,
    description: g.description ?? "",
    profileImage: g.profileImage ?? null,
    memberCount: g.members?.length || 0,
    isMember: false
  }));
}

function mapPosts(posts) {
  return posts.map(p => ({
    postId: p._id,
    caption: p.caption ?? "",
    mediaUrl: p.mediaUrl ?? null,
    authorName: p.author?.name ?? "",
    authorProfilePic: p.author?.profileImage ?? null
  }));
}

function mapProjects(projects) {
  return projects.map(p => ({
    projectId: p._id,
    title: p.title ?? "",
    stage: p.currentStage ?? "Idea",
    projectImageUrl: p.imageUrl ?? null
  }));
}

function mapUsers(users) {
  return users.map(u => {

    const email = u.email ?? "";

    const username = email.includes("@")
      ? email.split("@")[0]
      : "";

    return {
      userId: u._id,
      username,
      fullName: u.name ?? "",
      profilePic: u.profileImage ?? null
    };
  });
}