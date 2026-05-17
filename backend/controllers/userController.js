const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary if credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Stream file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'unimatch' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// Fallback: Save file to local disk
const saveFileLocally = async (file) => {
  const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  const filePath = path.join(__dirname, '../uploads', filename);
  await fs.promises.writeFile(filePath, file.buffer);
  return `http://localhost:5000/uploads/${filename}`;
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio || user.bio;
      user.age = req.body.age || user.age;
      user.gender = req.body.gender || user.gender;
      user.interestedIn = req.body.interestedIn || user.interestedIn;
      user.coverPhoto = req.body.coverPhoto || user.coverPhoto;
      
      // New campus fields
      if (req.body.studentId !== undefined) user.studentId = req.body.studentId;
      if (req.body.department !== undefined) user.department = req.body.department;
      if (req.body.campusSpots !== undefined) user.campusSpots = req.body.campusSpots;
      if (req.body.interests !== undefined) user.interests = req.body.interests;
      if (req.body.prompts !== undefined) user.prompts = req.body.prompts;
      if (req.body.freeSlots !== undefined) user.freeSlots = req.body.freeSlots;
      if (req.body.musicAnthem !== undefined) user.musicAnthem = req.body.musicAnthem;
      
      if (req.body.photos) {
        user.photos = req.body.photos;
      }

      const updatedUser = await user.save();

      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users for swiping
// @route   GET /api/users/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    // Don't show users already liked/disliked, or self
    const excludedIds = [currentUser._id, ...currentUser.likes, ...currentUser.dislikes];
    
    const query = {
      _id: { $nin: excludedIds }
    };
    
    // Simple gender filtering based on preference
    if (currentUser.interestedIn && currentUser.interestedIn !== 'Both') {
      query.gender = currentUser.interestedIn;
    }

    // Filter by department if passed in query string (e.g. ?dept=CSE)
    if (req.query.dept) {
      query.department = req.query.dept;
    }

    let users = await User.find(query);

    // Dynamic ranking based on shared campus spots and interests
    users = users.map(user => {
      let score = 0;
      
      // Calculate shared campus spots score
      const sharedSpots = (user.campusSpots || []).filter(spot => 
        (currentUser.campusSpots || []).includes(spot)
      );
      score += sharedSpots.length * 10; // 10 points per mutual spot

      // Calculate shared interests score
      const sharedInterests = (user.interests || []).filter(interest => 
        (currentUser.interests || []).includes(interest)
      );
      score += sharedInterests.length * 5; // 5 points per mutual interest

      // Calculate shared free slots score
      const sharedSlots = (user.freeSlots || []).filter(slot => 
        (currentUser.freeSlots || []).includes(slot)
      );
      score += sharedSlots.length * 15; // 15 points per mutual slot

      const userObj = user.toObject();
      userObj.matchScore = score;
      userObj.sharedSpots = sharedSpots;
      userObj.sharedInterests = sharedInterests;
      userObj.sharedSlots = sharedSlots;

      // Check if recommended user sent a direct admire (comment) to the current user
      const mutualAdmire = currentUser.admires.find(admire => 
        admire.sender.toString() === user._id.toString()
      );
      if (mutualAdmire) {
        userObj.admireComment = mutualAdmire.comment;
        userObj.admirePrompt = mutualAdmire.promptQuestion;
      }
      
      return userObj;
    });

    // Sort by match score in descending order
    users.sort((a, b) => b.matchScore - a.matchScore);

    res.json(users.slice(0, 20)); // Return top 20 recommendations
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/photo
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a photo' });
    }

    let photoUrl;
    const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      photoUrl = await uploadToCloudinary(req.file.buffer);
    } else {
      photoUrl = await saveFileLocally(req.file);
    }

    const user = await User.findById(req.user._id);
    if (user) {
      user.photos = [photoUrl, ...user.photos.slice(1)];
      await user.save();
      res.json({ message: 'Profile picture uploaded successfully', photoUrl, user });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload cover photo
// @route   POST /api/users/profile/cover
// @access  Private
const uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a cover photo' });
    }

    let coverUrl;
    const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      coverUrl = await uploadToCloudinary(req.file.buffer);
    } else {
      coverUrl = await saveFileLocally(req.file);
    }

    const user = await User.findById(req.user._id);
    if (user) {
      user.coverPhoto = coverUrl;
      await user.save();
      res.json({ message: 'Cover photo uploaded successfully', coverUrl, user });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Cover photo upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUserProfile, updateUserProfile, getRecommendations, uploadProfilePicture, uploadCoverPhoto };
