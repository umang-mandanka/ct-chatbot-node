const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// POST endpoint for processing chat messages
router.post('/message', chatController.processMessage);

module.exports = router;
