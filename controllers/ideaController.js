const Idea = require('../models/Idea');
const IdeaContent = require('../models/IdeaContent');

exports.getIdeaDetails = async (req, res) => {
  try {
    const { idea_id } = req.query;
    if (!idea_id) return res.status(400).json({ success: false, error_code: "INVALID_IDEA_ID", message: "ID Required" });

    const idea = await Idea.findById(idea_id)
      .populate('creator_id', 'name profilePic')
      .populate('group_id', 'name');

    if (!idea) return res.status(404).json({ success: false, error_code: "IDEA_NOT_FOUND", message: "Idea not found" });

    // Fetch linked content
    const content = await IdeaContent.find({ idea_id: idea._id }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      idea_id: idea._id,
      idea_title: idea.title,
      idea_description: idea.description,
      idea_pic: idea.pic,
      visibility: idea.visibility,
      group_id: idea.group_id ? idea.group_id._id : null,
      group_name: idea.group_id ? idea.group_id.name : null,
      created_by: {
        user_id: idea.creator_id._id,
        name: idea.creator_id.name,
        profilePic: idea.creator_id.profilePic
      },
      idea_content: content.map(c => ({
        content_id: c._id,
        content_type: c.content_type,
        content_url: c.content_url,
        description: c.description,
        createdAt: c.createdAt
      })),
      likes: idea.likes,
      views: idea.views,
      tags: idea.tags,
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt
    });

  } catch (error) {
    res.status(500).json({ success: false, error_code: "SERVER_ERROR", message: error.message });
  }
};