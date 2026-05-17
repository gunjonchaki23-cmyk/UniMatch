const express = require('express');
const { getUserProfile, updateUserProfile, getRecommendations, uploadProfilePicture, uploadCoverPhoto } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.get('/recommendations', protect, getRecommendations);
router.post('/profile/photo', protect, upload.single('photo'), uploadProfilePicture);
router.post('/profile/cover', protect, upload.single('cover'), uploadCoverPhoto);

module.exports = router;
