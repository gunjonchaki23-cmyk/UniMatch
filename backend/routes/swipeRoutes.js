const express = require('express');
const { likeUser, passUser } = require('../controllers/swipeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/like/:id', protect, likeUser);
router.post('/pass/:id', protect, passUser);

module.exports = router;
