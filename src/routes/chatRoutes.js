const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController-fixed');

// POST endpoint for processing chat messages
router.post('/message', chatController.processMessage);

module.exports = router;
