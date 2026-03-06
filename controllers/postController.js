const Post = require("../models/Post");
const mongoose = require("mongoose");
const Engagement = require("../models/Engagement");
/* =====================================================
   CREATE POST
   ===================================================== */

exports.createPost = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      text,
      groupId = null,
      projectId = null,
      visibility
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Post text is required"
      });
    }

    let finalVisibility = "PUBLIC";
    if (projectId) finalVisibility = "PROJECT";
    else if (groupId) finalVisibility = "GROUP";

    /* =======================
       HANDLE s3 FILES
       ======================= */

   const files = req.files || [];

if (files.length > 10) {
  return res.status(400).json({
    success: false,
    message: "Maximum 10 files allowed"
  });
}

const upload = require("../middleware/upload");

const media = [];

for (const file of files) {

  const fileUrl = await upload.uploadToS3(file);

  media.push({
    media_url: fileUrl,
    media_type: file.mimetype.startsWith("image/")
      ? "IMAGE"
      : "PDF",
    size_in_bytes: file.size
  });
}

    const post = await Post.create({
      user_id: userId,
      group_id: groupId || null,
      project_id: projectId || null,
      visibility: finalVisibility,
      text: text.trim(),
      media
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post
    });

  } catch (error) {
    console.error("Create post error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create post"
    });
  }
};

/* =====================================================
   GLOBAL FEED (USER + GROUP POSTS)
   Excludes: Project posts
   ===================================================== */



exports.getFeedPosts = async (req, res) => {
  try {
    const { cursor } = req.query;
    const userId = req.user.id;

    let matchStage = {
      project_id: null,
      is_deleted: false
    };

    if (cursor) {
      matchStage.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.aggregate([
      { $match: matchStage },

      { $sort: { createdAt: -1 } },
      { $limit: 20 },

      // Populate user
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      // Populate group
      {
        $lookup: {
          from: "groups",
          localField: "group_id",
          foreignField: "_id",
          as: "group"
        }
      },
      { $unwind: { path: "$group", preserveNullAndEmptyArrays: true } },

      // Engagement lookup
      {
        $lookup: {
          from: "engagements",
          localField: "_id",
          foreignField: "target_id",
          as: "engagements"
        }
      },

      // Compute counts
      {
        $addFields: {
          likeCount: {
            $size: {
              $filter: {
                input: "$engagements",
                as: "e",
                cond: { $eq: ["$$e.type", "LIKE"] }
              }
            }
          },
          commentCount: {
            $size: {
              $filter: {
                input: "$engagements",
                as: "e",
                cond: { $eq: ["$$e.type", "COMMENT"] }
              }
            }
          },
          isLiked: {
            $in: [
              mongoose.Types.ObjectId(userId),
              {
                $map: {
                  input: {
                    $filter: {
                      input: "$engagements",
                      as: "e",
                      cond: { $eq: ["$$e.type", "LIKE"] }
                    }
                  },
                  as: "like",
                  in: "$$like.user_id"
                }
              }
            ]
          }
        }
      },

      {
        $project: {
          postId: "$_id",
          ownerName: "$user.name",
          ownerProfileImage: "$user.profile_image",

          groupId: "$group._id",
          groupName: "$group.name",

          projectId: "$project_id",

          text: 1,
          media: 1,
          createdAt: 1,
          likeCount: 1,
          commentCount: 1,
          isLiked: 1
        }
      }
    ]);

    const nextCursor =
      posts.length > 0
        ? posts[posts.length - 1].createdAt
        : null;

    res.status(200).json({
      success: true,
      posts,
      nextCursor
    });

  } catch (error) {
    console.error("Feed error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed"
    });
  }
};


/* =====================================================
   GET PROJECT POSTS
   ===================================================== */

exports.getProjectPosts = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const posts = await Post.aggregate([
      {
        $match: {
          project_id: new mongoose.Types.ObjectId(projectId),
          is_deleted: false
        }
      },

      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      {
        $lookup: {
          from: "engagements",
          localField: "_id",
          foreignField: "target_id",
          as: "engagements"
        }
      },

      {
        $addFields: {
          likeCount: {
            $size: {
              $filter: {
                input: "$engagements",
                as: "e",
                cond: { $eq: ["$$e.type", "LIKE"] }
              }
            }
          },
          commentCount: {
            $size: {
              $filter: {
                input: "$engagements",
                as: "e",
                cond: { $eq: ["$$e.type", "COMMENT"] }
              }
            }
          }
        }
      },

      {
        $project: {
          postId: "$_id",
          ownerName: "$user.name",
          ownerProfileImage: "$user.profile_image",
          projectId: "$project_id",
          text: 1,
          media: 1,
          createdAt: 1,
          likeCount: 1,
          commentCount: 1
        }
      }
    ]);

    res.json({ success: true, posts });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



/* =====================================================
   UPDATE POST
   ===================================================== */

exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    const post = await Post.findOne({
      _id: postId,
      user_id: userId,
      is_deleted: false
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or unauthorized"
      });
    }

    post.text = text.trim();
    await post.save();

    res.json({ success: true, message: "Post updated" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/* =====================================================
   DELETE POST (Soft Delete)
   ===================================================== */

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findOne({
      _id: postId,
      user_id: userId,
      is_deleted: false
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or unauthorized"
      });
    }

    post.is_deleted = true;
    await post.save();

    res.json({ success: true, message: "Post deleted" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
