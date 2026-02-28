const Engagement = require('../models/Engagement');

// Helper to handle engagements
const handleEngagement = async (req, res, type) => {
  try {
   const { targetId, targetType, commentText } = req.body;

    if (!targetId || !targetType) {
      return res.status(400).json({
        success: false,
        message: "targetId and targetType required"
      });
    }

    if (type === 'LIKE' || type === 'VIEW') {
      const exists = await Engagement.findOne({ 
        user_id: req.user.id,
        target_id: targetId,
        target_type: targetType,
        type: type 
      });

      if (exists) {
        return res.status(200).json({
          success: true,
          message: "Already recorded"
        });
      }
    }

    await Engagement.create({
      user_id: req.user.id,
      target_id: targetId,
      target_type: targetType,
      type: type,
     text: commentText || null
    });

    res.status(200).json({
      success: true,
      message: `${type} added`
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.addView = (req, res) => handleEngagement(req, res, 'VIEW');
exports.like = (req, res) => handleEngagement(req, res, 'LIKE');
exports.comment = (req, res) => handleEngagement(req, res, 'COMMENT');
exports.share = (req, res) => handleEngagement(req, res, 'SHARE');

exports.unlike = async (req, res) => {
  try {
    
   const { targetId, targetType } = req.body;

await Engagement.findOneAndDelete({ 
  user_id: req.user.id,
  target_id: targetId,
  target_type: targetType,
  type: 'LIKE'
});
    res.status(200).json({ success: true, message: "Unliked" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getComments = async (req, res) => {
  try {
    const { targetId, targetType } = req.query;

    const comments = await Engagement.find({
      target_id: targetId,
      target_type: targetType,
      type: 'COMMENT'
    })
      .populate('user_id', 'name profilePic')
      .sort({ created_at: -1 });  // ✅ correct field

    const formatted = comments.map(comment => ({
      id: comment._id,
      userId: comment.user_id?._id || "",
      username: comment.user_id?.name || "Unknown",
      profileImage: comment.user_id?.profilePic || null,
      text: comment.text || "",
      createdAt: comment.created_at
        ? comment.created_at.toISOString()
        : new Date().toISOString(),   // ✅ safe fallback
      likesCount: 0,
      isLiked: false,
      repliesCount: 0
    }));

    res.status(200).json(formatted);

  } catch (err) {
    console.error("GET COMMENTS ERROR:", err);  // 👈 log real error
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};