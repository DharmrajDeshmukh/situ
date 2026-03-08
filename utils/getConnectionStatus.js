const ConnectionRequest = require("../models/ConnectionRequest")

/*
====================================================
GET CONNECTION STATUS BETWEEN TWO USERS
====================================================

viewerId  -> logged in user
targetId  -> profile being viewed

Possible returns:

NOT_CONNECTED
REQUEST_SENT
REQUEST_RECEIVED
CONNECTED
REJECTED
*/

exports.getConnectionStatus = async (viewerId, targetId) => {

  try {

    if (!viewerId || !targetId) {
      return "NOT_CONNECTED"
    }

    // same user
    if (viewerId.toString() === targetId.toString()) {
      return "SELF"
    }

    const request = await ConnectionRequest.findOne({
      target_type: "USER",
      $or: [
        { sender_id: viewerId, receiver_id: targetId },
        { sender_id: targetId, receiver_id: viewerId }
      ]
    }).lean()

    /* ---------------- NO CONNECTION ---------------- */

    if (!request) {
      return "NOT_CONNECTED"
    }

    /* ---------------- CONNECTED ---------------- */

    if (request.status === "ACCEPTED") {
      return "CONNECTED"
    }

    /* ---------------- PENDING ---------------- */

    if (request.status === "PENDING") {

      if (request.sender_id.toString() === viewerId.toString()) {
        return "REQUEST_SENT"
      }

      return "REQUEST_RECEIVED"
    }

    /* ---------------- REJECTED ---------------- */

    if (request.status === "REJECTED") {
      return "REJECTED"
    }

    return "NOT_CONNECTED"

  } catch (error) {

    console.error("getConnectionStatus error:", error)

    return "NOT_CONNECTED"
  }

}