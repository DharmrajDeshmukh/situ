const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// --- CHAT HOME ---
router.get('/chat/home', protect, chatController.getChatHome);

// --- COMMUNITY CHAT HOME (🔥 NEW – OPTION 2)
router.get(
  '/communities/:communityId/chat-home',
  protect,
  chatController.getCommunityChatHome
);

// --- COMMUNITY ---
router.post('/communities', protect, chatController.createCommunity);
router.get('/communities/:communityId', protect, chatController.getCommunity);
router.get(
  '/communities/:communityId/rooms',
  protect,
  chatController.getCommunityRooms
);

// --- GROUPS ---
router.post('/communities/:communityId/groups', protect, chatController.createGroupInCommunity);
router.get('/groups/:groupId', protect, chatController.getGroup);
router.get('/groups/:groupId/members', protect, chatController.getGroupMembers);

// --- ROOMS ---
router.post('/communities/:communityId/rooms', protect, chatController.createChatRoom);
router.get('/communities/:communityId/rooms', protect, chatController.getChatRooms);

// --- ROOM MESSAGES ---
router.get('/rooms/:roomId/messages', protect, chatController.getRoomMessages);
router.post('/rooms/:roomId/messages', protect, chatController.sendRoomMessage);

// --- DIRECT CHAT ---
router.post('/chat/direct', protect, chatController.createDirectChat);
router.get('/chat/direct/:chatId/messages', protect, chatController.getDirectMessages);

// --- STATE ---
router.post('/chat/messages/read', protect, chatController.markMessageRead);
router.get('/rooms/:roomId/read-state', protect, chatController.getRoomReadState);

module.exports = router;
