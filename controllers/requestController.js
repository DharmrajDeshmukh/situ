const mongoose = require("mongoose")

const Request = require("../models/Request")
const User = require("../models/User")

const Group = require("../models/Group")
const GroupMember = require("../models/GroupMember")

const ChatRoom = require("../models/ChatRoom")
const ProjectMember = require("../models/ProjectMember")

/* =====================================================
   GET MY REQUESTS
===================================================== */

exports.getMyRequests = async (req,res)=>{

  try{

    const userId = req.user.id

    const requests = await Request.find({
      receiverId:userId,
      status:{ $in:["PENDING","APPROVED"] }
    })
    .populate("senderId","name profilePic")
    .populate("groupId","name profilePic")
    .populate("projectId","title banner_url")   // ✅ THIS WAS MISSING
    .sort({ createdAt:-1 })
    .lean()

    return res.json({
      success:true,
      requests
    })

  }
  catch(err){

    console.error("getMyRequests error:",err)

    return res.status(500).json({
      success:false,
      message:"Server error"
    })

  }

}



/* =====================================================
   SEND REQUEST
===================================================== */

exports.sendRequest = async (req,res)=>{

  try{

    const senderId = req.user.id

    const {
      receiverId,
      groupId,
      projectId,
      type,
      role,
      message
    } = req.body


    if (!type) {
      return res.status(400).json({
        success:false,
        message:"type required"
      })
    }

    if (receiverId && senderId === receiverId) {
      return res.status(400).json({
        success:false,
        message:"Cannot send request to yourself"
      })
    }


    /* ================= GROUP VALIDATION ================= */

    if (groupId) {

      const group = await Group.findById(groupId)

      if (!group) {
        return res.status(404).json({
          success:false,
          message:"Group not found"
        })
      }

    }


    /* ================= DUPLICATE CHECK ================= */

    const existing = await Request.findOne({

      senderId,
      receiverId,
      groupId,
      projectId,
      type,
      status:"PENDING"

    })

    if (existing) {

      return res.status(409).json({
        success:false,
        message:"Request already exists"
      })

    }


    /* ================= CREATE REQUEST ================= */

    const request = await Request.create({

      senderId,
      receiverId,
      groupId:groupId || null,
      projectId:projectId || null,
      type,
      role:role || "member",
      message:message || "",
      status:"PENDING"

    })


    return res.status(201).json({

      success:true,
      request

    })


  }
  catch(err){

    console.error("sendRequest error:",err)

    return res.status(500).json({
      success:false,
      message:"Server error"
    })

  }

}



/* =====================================================
   GET GROUP REQUESTS (OWNER / ADMIN VIEW)
===================================================== */

exports.getGroupRequests = async (req,res)=>{

  try{

    const { groupId } = req.params
    const userId = req.user.id


    /* ================= ADMIN CHECK ================= */

    const admin = await GroupMember.findOne({

      groupId,
      userId,
      role:{ $in:["owner","admin","co_owner"] }

    })

    if (!admin) {

      return res.status(403).json({
        success:false,
        message:"Only admins can view requests"
      })

    }


    /* ================= FETCH REQUESTS ================= */

    const requests = await Request.find({

      groupId,
      type:"GROUP_JOIN_REQUEST",
      status:"PENDING"

    })
    .populate("senderId","name profileImage")
    .sort({ createdAt:-1 })
    .lean()


    return res.json({

      success:true,
      requests

    })


  }
  catch(err){

    console.error("getGroupRequests error:",err)

    return res.status(500).json({
      success:false,
      message:"Server error"
    })

  }

}



/* =====================================================
   INVITE USER TO GROUP
===================================================== */

exports.inviteUserToGroup = async (req,res)=>{

  try{

    const { groupId } = req.params
    const { userId } = req.body

    const inviterId = req.user.id

    if (!userId) {
      return res.status(400).json({
        success:false,
        message:"userId required"
      })
    }

    /* ================= ADMIN CHECK ================= */

    const admin = await GroupMember.findOne({

      groupId,
      userId:inviterId,
      role:{ $in:["owner","admin","co_owner"] }

    })

    if (!admin) {

      return res.status(403).json({
        success:false,
        message:"Only admins can invite"
      })

    }

   

    /* ================= ALREADY MEMBER CHECK ================= */

    const member = await GroupMember.findOne({
      groupId,
      userId
    })

    if (member) {
      return res.status(409).json({
        success:false,
        message:"User already member"
      })
    }

    /* ================= DUPLICATE INVITE CHECK ================= */

    const existingInvite = await Request.findOne({

      receiverId:userId,
      groupId,
      type:"GROUP_INVITE",
      status:"PENDING"

    })

    if (existingInvite) {

      return res.status(409).json({
        success:false,
        message:"Invite already sent"
      })

    }

    /* ================= CREATE GROUP INVITE ================= */

    const request = await Request.create({

      senderId:inviterId,
      receiverId:userId,
      groupId,
      type:"GROUP_INVITE",
      role:"member",
      status:"PENDING"

    })

    return res.status(201).json({

      success:true,
      request

    })

  }
  catch(err){

    console.error("inviteUserToGroup error:",err)

    return res.status(500).json({
      success:false,
      message:"Server error"
    })

  }

}



/* =====================================================
   ACCEPT REQUEST
===================================================== */

exports.acceptRequest = async (req,res)=>{

  try{

    const { requestId } = req.params
    const userId = req.user.id

    const request = await Request.findById(requestId)

    if (!request || request.status !== "PENDING") {

      return res.status(400).json({
        success:false,
        message:"Invalid request"
      })

    }

    if (request.receiverId.toString() !== userId) {

      return res.status(403).json({
        success:false,
        message:"Unauthorized"
      })

    }


    /* ================= GROUP INVITE ================= */

  if (request.type === "GROUP_INVITE") {

  const exists = await GroupMember.findOne({
    groupId: request.groupId,
    userId
  })

  if (!exists) {

    await GroupMember.create({
      groupId: request.groupId,
      userId,
      role: request.role || "member"
    })

    const group = await Group.findById(request.groupId)

    if (group) {
      group.members.addToSet(userId)
      await group.save()
    }

    const chatRoom = await ChatRoom.findOne({
      groupId: request.groupId,
      type: "GROUP"
    })

    if (chatRoom) {

      const already = chatRoom.members.some(
        m => m.userId.toString() === userId
      )

      if (!already) {

        chatRoom.members.push({
          userId,
          role: "MEMBER"
        })

        await chatRoom.save()

      }
    }

  }

  request.status = "ACCEPTED"
  await request.save()

  return res.json({
    success: true,
    message: "Joined group successfully"
  })

}

if (request.type === "PROJECT_INVITE") {

  const member = await ProjectMember.findOne({
    project_id: request.projectId,
    user_id: userId
  })

  if (!member) {

    await ProjectMember.create({
      project_id: request.projectId,
      user_id: userId,
      role: request.role || "MEMBER",
      status: "ACCEPTED"
    })

  } else {

    member.status = "ACCEPTED"
    await member.save()

  }

  request.status = "ACCEPTED"
  await request.save()

  return res.json({
    success: true,
    message: "Joined project successfully"
  })

}



    /* ================= GROUP JOIN REQUEST ================= */

    if (request.type === "GROUP_JOIN_REQUEST") {

      request.status = "APPROVED"
      await request.save()

      return res.json({
        success:true,
        message:"User approved to join group"
      })

    }


    /* ================= DEFAULT ================= */

    request.status = "ACCEPTED"
    await request.save()

    return res.json({
      success:true,
      message:"Request accepted"
    })


  }
  catch(err){

    console.error("acceptRequest error:",err)

    return res.status(500).json({
      success:false,
      message:"Server error"
    })

  }

}



/* =====================================================
   REJECT REQUEST
===================================================== */

exports.rejectRequest = async (req,res)=>{

  try{

    const { requestId } = req.params
    const userId = req.user.id

    const request = await Request.findById(requestId)

    if (!request || request.status !== "PENDING") {

      return res.status(400).json({
        success:false,
        message:"Invalid request"
      })

    }

    if (request.receiverId.toString() !== userId) {

      return res.status(403).json({
        success:false,
        message:"Unauthorized"
      })

    }

    request.status = "REJECTED"

    await request.save()

    return res.json({

      success:true,
      message:"Request rejected"

    })


  }
  catch(err){

    console.error("rejectRequest error:",err)

    return res.status(500).json({
      success:false,
      message:"Server error"
    })

  }

}



/* =====================================================
   JOIN GROUP (AFTER APPROVAL)
===================================================== */

exports.joinGroup = async (req,res)=>{

  try{

    const { requestId } = req.params
    const userId = req.user.id

    const request = await Request.findById(requestId)

    if (!request || request.status !== "APPROVED") {

      return res.status(400).json({
        success:false,
        message:"Request not approved"
      })

    }

    if (request.receiverId.toString() !== userId) {

      return res.status(403).json({
        success:false,
        message:"Unauthorized"
      })

    }


    /* ================= ALREADY MEMBER ================= */

    const exists = await GroupMember.findOne({

      groupId:request.groupId,
      userId

    })

    if (exists) {

      return res.json({
        success:true,
        message:"Already a member"
      })

    }


    /* ================= ADD MEMBER ================= */

    await GroupMember.create({

      groupId:request.groupId,
      userId,
      role:request.role || "member"

    })


    /* ================= UPDATE GROUP ================= */

    const group = await Group.findById(request.groupId)

    if (group) {

      group.members.addToSet(userId)
      await group.save()

    }


    /* ================= ADD TO CHAT ================= */

    const chatRoom = await ChatRoom.findOne({

      groupId:request.groupId,
      type:"GROUP"

    })

    if (chatRoom) {

      const exists = chatRoom.members.some(
        m => m.userId.toString() === userId
      )

      if (!exists) {

        chatRoom.members.push({
          userId,
          role:"MEMBER"
        })

        await chatRoom.save()

      }

    }


    request.status = "ACCEPTED"
    await request.save()


    return res.json({

      success:true,
      message:"Joined group successfully"

    })


  }
  catch(err){

    console.error("joinGroup error:",err)

    return res.status(500).json({
      success:false,
      message:"Server error"
    })

  }

}

/* =====================================================
   BULK INVITE USERS TO GROUP
===================================================== */

exports.bulkInviteUsersToGroup = async (req, res) => {

  try {

    const { groupId } = req.params
    const { userIds } = req.body
    const inviterId = req.user.id

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds array required"
      })
    }

    /* ================= ADMIN CHECK ================= */

    const admin = await GroupMember.findOne({
      groupId,
      userId: inviterId,
      role: { $in: ["owner", "admin", "co_owner"] }
    })

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Only admins can invite"
      })
    }

    /* ================= FILTER USERS ================= */

    const requestsToInsert = []

    for (const userId of userIds) {

      // Skip if already a member
      const member = await GroupMember.findOne({
        groupId,
        userId
      })

      if (member) continue

      // Skip if invite already exists
      const existing = await Request.findOne({
        receiverId: userId,
        groupId,
        type: "GROUP_INVITE",
        status: "PENDING"
      })

      if (existing) continue

      requestsToInsert.push({
        senderId: inviterId,
        receiverId: userId,
        groupId,
        type: "GROUP_INVITE",
        role: "member",
        status: "PENDING"
      })

    }

    /* ================= INSERT ================= */

    if (requestsToInsert.length > 0) {
      await Request.insertMany(requestsToInsert)
    }

    return res.json({
      success: true,
      invited: requestsToInsert.length
    })

  } catch (err) {

    console.error("bulkInviteUsersToGroup error:", err)

    return res.status(500).json({
      success: false,
      message: "Server error"
    })

  }

}