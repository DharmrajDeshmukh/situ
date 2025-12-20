const Engagement = require('../models/Engagement');

// Helper to handle engagements
const handleEngagement = async (req, res, type) => {
  try {
    const { targetId, targetType, commentText } = req.body;
    
    // Check duplicates for Likes/Views to prevent spam
    if (type === 'LIKE' || type === 'VIEW') {
      const exists = await Engagement.findOne({ 
        user_id: req.user.id, target_id: targetId, type: type 
      });
      if (exists) return res.status(200).json({ success: true, message: "Already recorded" });
    }

    await Engagement.create({
      user_id: req.user.id,
      target_id: targetId,
      target_type: targetType,
      type: type,
      text: commentText || null
    });

    res.status(200).json({ success: true, message: `${type} added` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addView = (req, res) => handleEngagement(req, res, 'VIEW');
exports.like = (req, res) => handleEngagement(req, res, 'LIKE');
exports.comment = (req, res) => handleEngagement(req, res, 'COMMENT');
exports.share = (req, res) => handleEngagement(req, res, 'SHARE');

exports.unlike = async (req, res) => {
  try {
    const { targetId } = req.body;
    await Engagement.findOneAndDelete({ user_id: req.user.id, target_id: targetId, type: 'LIKE' });
    res.status(200).json({ success: true, message: "Unliked" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};