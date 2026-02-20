const Post = require("../models/Post");
const Engagement = require("../models/Engagement");

exports.getHomeFeed = async (req, res) => {
  try {

    const { limit = 20, cursor } = req.query;

    let query = { is_deleted: false };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("user_id", "name profile_image")
      .lean();

    const items = await Promise.all(
      posts.map(async (post) => {

        // Engagement counts
        const likeCount = await Engagement.countDocuments({
          target_id: post._id,
          type: "LIKE"
        });

        const commentCount = await Engagement.countDocuments({
          target_id: post._id,
          type: "COMMENT"
        });

        const isLikedByMe = await Engagement.findOne({
          user_id: req.user.id,
          target_id: post._id,
          type: "LIKE"
        });

        return {
          postId: post._id,

          authorId: post.user_id._id,
          authorName: post.user_id.name,
          authorType: "USER",
          authorImage: post.user_id.profile_image,

          text: post.text,
          mediaType: post.media?.[0]?.media_type || "IMAGE",
          mediaUrls: post.media?.map(m => m.media_url) || [],

          createdAt: post.createdAt,
          likeCount,
          commentCount,
          isLikedByMe: !!isLikedByMe
        };
      })
    );

    const nextCursor =
      posts.length > 0
        ? posts[posts.length - 1].createdAt
        : null;

    return res.status(200).json({
      success: true,
      items,
      nextCursor
    });

  } catch (error) {
    console.error("Home feed error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch home feed"
    });
  }
};
