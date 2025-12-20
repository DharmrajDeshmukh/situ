const express = require('express');
const router = express.Router();
const controller = require('../controllers/socialController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest, schemas } = require('../utils/validators');

router.use(protect);

router.post('/send-request', validateRequest(schemas.connectionRequest), controller.sendRequest);
router.post('/accept-request', validateRequest(schemas.acceptRequest), controller.acceptRequest);

router.get('/followers', controller.getFollowers); // Query params only
router.get('/following', controller.getFollowing);
router.get('/connections', controller.getConnections);
router.delete('/cancel-request', validateRequest(schemas.cancelRequest), controller.cancelRequest);
router.delete('/remove-connection', validateRequest(schemas.removeConnection), controller.removeConnection);

module.exports = router;