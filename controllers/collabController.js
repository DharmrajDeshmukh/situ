const Group = require('../models/Group');


// GET /api/v1/collab/hiring
exports.getHiringGroups = async (req, res) => {
  try {

    const userId = req.user.id;
    const { limit = 20, cursor } = req.query;
    const limitInt = parseInt(limit);

    const query = {
      'hiring.isOpen': true,

      // ❌ Do not show if user is owner
      owner: { $ne: userId },

      // ❌ Do not show if user already member
      members: { $ne: userId }
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const groups = await Group.find(query)
      .sort({ _id: -1 })
      .limit(limitInt)
      .select('name profileImage hiring');

    const items = groups.map(g => ({
      groupId: g._id,
      groupName: g.name,
      groupImage: g.profileImage,
      hiring: {
        isOpen: g.hiring?.isOpen || false,
        message: g.hiring?.message || "",
        requiredSkills: g.hiring?.requiredSkills || [],
        preferredSkills: g.hiring?.preferredSkills || [],
        updatedAt: g.hiring?.updatedAt || null
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