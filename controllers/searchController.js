const User = require('../models/User');
const Group = require('../models/Group');
const ChatRoom = require('../models/ChatRoom');
const DirectChat = require('../models/DirectChat');
// const Project = require('../models/Project'); // Uncomment if you have a Project model
// const Post = require('../models/Post');       // Uncomment if you have a Post model

exports.search = async (req, res) => {
  try {
    const { query, context, page = 1, limit = 20, groupId } = req.body;
    
    // Default Empty Response Structure 
    const response = {
      users: [],
      groups: [],
      projects: [],
      posts: [],
      chats: []
    };

    if (!query || query.trim() === '') {
      return res.json(response);
    }

    const regex = new RegExp(query, 'i'); // Case-insensitive search
    const skip = (page - 1) * limit;

    // --- CONTEXT SWITCHING LOGIC [cite: 1245] ---
    
    switch (context) {
      case 'HOME':
        // Search EVERYTHING (Users, Groups, Posts)
        const [homeUsers, homeGroups] = await Promise.all([
            User.find({ $or: [{ name: regex }, { email: regex }] }).limit(5),
            Group.find({ name: regex, visibility: 'public' }).limit(5)
        ]);
        
        response.users = mapUsers(homeUsers);
        response.groups = mapGroups(homeGroups);
        // Add projects/posts logic here if models exist
        break;

      case 'COLLAB':
        // Search PROJECTS & USERS (Potential collaborators)
        // Assuming Groups with active projects count as "Projects" for now
        const collabGroups = await Group.find({ 
            name: regex, 
            'projectDetails.status': 'ongoing' 
        }).limit(limit);

        const collabUsers = await User.find({ name: regex }).limit(5);

        response.projects = collabGroups.map(g => ({
            projectId: g._id,
            title: g.name, // Using Group Name as Project Title
            stage: g.projectDetails.currentStage || 'Idea',
            openForCollab: true // Mock value
        }));
        response.users = mapUsers(collabUsers);
        break;

      case 'CHAT':
        // Search EXISTING CHATS & USERS (to start new chat)
        
        // 1. Search Users (to start DM)
        const chatUsers = await User.find({ name: regex }).limit(5);
        
        // 2. Search Existing Rooms (Group Chats)
        const chatRooms = await ChatRoom.find({ name: regex }).populate('groupId');
        
        response.users = mapUsers(chatUsers);
        response.chats = chatRooms.map(room => ({
            chatId: room._id,
            type: 'GROUP', // [cite: 1257]
            name: `${room.groupId ? room.groupId.name : 'Unknown'} - ${room.name}`,
            lastMessage: null // You'd need a separate query to fetch real last message
        }));
        break;

      case 'GROUP_MEMBER_ADD':
        // Search USERS only (to add to a group)
        // Ideally filter out users who are already members if groupId is provided
        const potentialMembers = await User.find({ name: regex }).limit(limit);
        response.users = mapUsers(potentialMembers);
        break;

      default:
        break;
    }

    res.json(response);

  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// --- HELPER MAPPERS [cite: 1287, 1267] ---

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
            profilePic: u.profileImage ?? null,
            isConnected: false
        };
    });
}


function mapGroups(groups) {
    return groups.map(g => ({
        groupId: g._id,
        name: g.name,
        memberCount: 0, // Implement count logic if needed
        isMember: false
    }));
}