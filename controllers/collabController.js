const Group = require('../models/Group');
const GroupCollabRequest = require('../models/GroupCollabRequest');

// GET /api/v1/collab/hiring
exports.getHiringGroups = async (req, res) => {
  try {

    const userId = req.user.id;
    const { limit = 20, cursor } = req.query;
    const limitInt = parseInt(limit);

    /* -------------------------------------------------
       1️⃣ Find groups where user already sent request
    ------------------------------------------------- */

    const appliedGroups = await GroupCollabRequest
      .find({ requester_id: userId })
      .distinct("group_id");

    /* -------------------------------------------------
       2️⃣ Build query
    ------------------------------------------------- */

    const query = {
      "hiring.isOpen": true,

      // do not show groups owned by user
      owner_id: { $ne: userId },

      // do not show groups where user already member
      members: { $ne: userId },

      // do not show groups where user already applied
      _id: { $nin: appliedGroups }
    };

    /* -------------------------------------------------
       3️⃣ Cursor pagination
    ------------------------------------------------- */

    if (cursor) {
      query._id = { ...query._id, $lt: cursor };
    }

    /* -------------------------------------------------
       4️⃣ Fetch groups
    ------------------------------------------------- */

    const groups = await Group.find(query)
      .sort({ _id: -1 })
      .limit(limitInt)
      .select("name profile_image hiring");

    /* -------------------------------------------------
       5️⃣ Format response
    ------------------------------------------------- */

    const items = groups.map(g => ({
      groupId: g._id,
      groupName: g.name,
      groupImage: g.profile_image || null,

      hiring: {
        isOpen: g.hiring?.isOpen || false,
        message: g.hiring?.message || "",
        requiredSkills: g.hiring?.requiredSkills || [],
        preferredSkills: g.hiring?.preferredSkills || [],
        hiringMode: g.hiring?.hiringMode || "ONLINE",
        preferredCity: g.hiring?.preferredCity || null,
        updatedAt: g.hiring?.updatedAt || null
      }
    }));

    /* -------------------------------------------------
       6️⃣ Send response
    ------------------------------------------------- */

    res.status(200).json({
      success: true,
      items,
      nextCursor: groups.length > 0
        ? groups[groups.length - 1]._id
        : null
    });

  } catch (err) {

    console.error("getHiringGroups error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to load hiring groups"
    });

  }
};