const Group = require('../models/Group');

// GET /api/v1/collab/hiring
exports.getHiringGroups = async (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;
    const limitInt = parseInt(limit);

    // Filter: Hiring must be OPEN
    const query = { 'hiring.isOpen': true };

    if (cursor) {
        query._id = { $lt: cursor }; // Pagination
    }

    const groups = await Group.find(query)
        .sort({ _id: -1 })
        .limit(limitInt)
        .select('name profileImage hiring'); // Fetch specific fields

    const items = groups.map(g => ({
        groupId: g._id,
        groupName: g.name,
        groupImage: g.profileImage,
        hiring: { 
            isOpen: g.hiring ? g.hiring.isOpen : false,
            message: g.hiring ? g.hiring.message : "",
            requiredSkills: g.hiring ? g.hiring.requiredSkills : [],
            preferredSkills: g.hiring ? g.hiring.preferredSkills : [],
            updatedAt: g.hiring ? g.hiring.updatedAt : null
        }
    }));

    res.json({
        items,
        nextCursor: groups.length > 0 ? groups[groups.length - 1]._id : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};