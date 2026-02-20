const Group = require("../models/Group");

/**
 * =====================================================
 * GET GROUP HIRING STATUS (READ ONLY)
 * Role: Any logged-in user
 * =====================================================
 * GET /api/v1/groups/:groupId/hiring/status
 */
exports.getGroupHiringStatus = async (req, res) => {
  try {
    const { groupId } = req.params;

    /* -----------------------------
       1️⃣ Find group
    ----------------------------- */
    const group = await Group.findById(groupId).select("hiring");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    /* -----------------------------
       2️⃣ If no hiring exists
    ----------------------------- */
    if (!group.hiring) {
      return res.status(200).json({
        success: true,
        isOpen: false,
        hiring: null
      });
    }

    /* -----------------------------
       3️⃣ Return hiring status
    ----------------------------- */
    return res.status(200).json({
      success: true,
      isOpen: group.hiring.isOpen === true,
      hiring: group.hiring.isOpen ? group.hiring : null
    });

  } catch (err) {
    console.error("getGroupHiringStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
