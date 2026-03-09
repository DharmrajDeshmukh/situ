const Follow = require("../models/Follow")

exports.followTarget = async (req, res) => {

  try {

    const userId = req.user.id
    const { targetId, targetType } = req.body

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: "Target ID required"
      })
    }

    const existing = await Follow.findOne({
      follower_id: userId,
      target_id: targetId,
      target_type: targetType
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already following"
      })
    }

    await Follow.create({
      follower_id: userId,
      target_id: targetId,
      target_type: targetType
    })

    return res.json({
      success: true,
      status: "FOLLOWING"
    })

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    })

  }
}

exports.unfollowTarget = async (req, res) => {

  try {

    const userId = req.user.id
    const { targetId } = req.params

    await Follow.deleteOne({
      follower_id: userId,
      target_id: targetId
    })

    res.json({
      success: true,
      status: "UNFOLLOWED"
    })

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    })

  }

}

exports.getMyFollowingGroups = async (req, res) => {

  try {

    const userId = req.user.id

    const groups = await Follow.find({
      follower_id: userId,
      target_type: "GROUP"
    }).populate("target_id")

    res.json({
      success: true,
      groups
    })

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    })

  }

}

exports.getFollowStatus = async (req, res) => {

  try {

    const userId = req.user.id
    const { targetId, targetType } = req.query

    const follow = await Follow.findOne({
      follower_id: userId,
      target_id: targetId,
      target_type: targetType
    })

    if (follow) {
      return res.json({
        success: true,
        status: "FOLLOWING"
      })
    }

    res.json({
      success: true,
      status: "NOT_FOLLOWING"
    })

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    })

  }

}

exports.getMyFollowingUsers = async (req, res) => {

  try {

    const userId = req.user.id

    const users = await Follow.find({
      follower_id: userId,
      target_type: "USER"
    }).populate("target_id")

    res.json({
      success: true,
      users
    })

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    })

  }

}