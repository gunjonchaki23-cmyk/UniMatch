const express = require('express');
const { generateIcebreaker } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/icebreaker', protect, generateIcebreaker);

module.exports = router;
