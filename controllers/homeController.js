const Post = require("../models/Post");
const Engagement = require("../models/Engagement");
const Project = require("../models/Project");
const Group = require("../models/Group");

exports.getHomeFeed = async (req, res) => {
  try {

    const { limit = 20, cursor } = req.query;

    const parsedLimit = Math.min(parseInt(limit), 50);

    let query = { is_deleted: false };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // ================= FETCH POSTS =================

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate("user_id", "name profilePic")
      .populate("group_id", "name profile_image")
      .populate("project_id", "title banner_url creator_id group_id")
      .lean();

    // ================= MAP ITEMS =================

    const items = await Promise.all(
      posts.map(async (post) => {

        // ---------------- ENGAGEMENT ----------------

        const [likeCount, commentCount, shareCount, isLikedDoc] =
          await Promise.all([
            Engagement.countDocuments({
              target_id: post._id,
              type: "LIKE"
            }),
            Engagement.countDocuments({
              target_id: post._id,
              type: "COMMENT"
            }),
            Engagement.countDocuments({
              target_id: post._id,
              type: "SHARE"
            }),
            Engagement.findOne({
              user_id: req.user.id,
              target_id: post._id,
              type: "LIKE"
            })
          ]);

        const isLikedByMe = !!isLikedDoc;

        // ---------------- AUTHOR LOGIC ----------------

        let authorType = "USER";

        if (post.group_id) {
          authorType = "GROUP";
        }

        // ---------------- GROUP DATA ----------------

        const groupId = post.group_id?._id || null;
        const groupName = post.group_id?.name || null;
        const groupImage = post.group_id?.profile_image || null;

        // ---------------- PROJECT DATA ----------------

        let projectId = null;
        let projectName = null;
        let projectImage = null;

        if (post.project_id) {
          projectId = post.project_id._id;
          projectName = post.project_id.title;
          projectImage = post.project_id.banner_url || null;
        }

        // ---------------- RESPONSE OBJECT ----------------

        return {
          postId: post._id,

          // AUTHOR
          authorId: post.user_id?._id,
          authorName: post.user_id?.name || "Unknown",
          authorType,
          authorImage: post.user_id?.profilePic || "",

          // GROUP
          groupId,
          groupName,
          groupImage,

          // PROJECT
          projectId,
          projectName,
          projectImage,

          // CONTENT
          text: post.text || "",
          mediaType: post.media?.[0]?.media_type || "IMAGE",
          mediaUrls: post.media?.map(m => m.media_url) || [],

          // META
          createdAt: post.createdAt,
          likeCount,
          commentCount,
          shareCount,
          isLikedByMe,
          isEdited: post.is_edited || false
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