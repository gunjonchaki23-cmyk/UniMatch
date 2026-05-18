const supabase = require('../config/db');
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
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      interestedIn: user.interested_in,
      studentId: user.student_id,
      batch: user.batch,
      department: user.department,
      campusSpots: user.campus_spots || [],
      interests: user.interests || [],
      prompts: user.prompts || [],
      bio: user.bio || '',
      photos: user.photos || [],
      coverPhoto: user.cover_photo || '',
      freeSlots: user.free_slots || [],
      musicAnthem: user.music_anthem || { title: '', artist: '' },
      isOnline: user.is_online
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    // Generate AIUB Student Batch dynamically
    let batch = req.body.batch;
    if (req.body.studentId) {
      const parts = req.body.studentId.split('-');
      if (parts[0] && parts[0].length === 2) {
        batch = `20${parts[0]} Batch`;
      }
    }
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({
        name: req.body.name || null,
        bio: req.body.bio || '',
        age: req.body.age ? parseInt(req.body.age) : null,
        gender: req.body.gender || null,
        interested_in: req.body.interestedIn || null,
        cover_photo: req.body.coverPhoto || '',
        student_id: req.body.studentId || null,
        department: req.body.department || null,
        campus_spots: req.body.campusSpots || [],
        interests: req.body.interests || [],
        prompts: req.body.prompts || [],
        free_slots: req.body.freeSlots || [],
        music_anthem: req.body.musicAnthem || { title: '', artist: '' },
        photos: req.body.photos || [],
        batch: batch
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      interestedIn: user.interested_in,
      studentId: user.student_id,
      batch: user.batch,
      department: user.department,
      campusSpots: user.campus_spots || [],
      interests: user.interests || [],
      prompts: user.prompts || [],
      bio: user.bio || '',
      photos: user.photos || [],
      coverPhoto: user.cover_photo || '',
      freeSlots: user.free_slots || [],
      musicAnthem: user.music_anthem || { title: '', artist: '' },
      isOnline: user.is_online
    });
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
    // Exclude self, already liked/disliked
    const { data: likedRows } = await supabase.from('likes').select('liked_id').eq('liker_id', req.user.id);
    const { data: dislikedRows } = await supabase.from('dislikes').select('disliked_id').eq('disliker_id', req.user.id);

    const excludedIds = [
      req.user.id,
      ...(likedRows || []).map(r => r.liked_id),
      ...(dislikedRows || []).map(r => r.disliked_id)
    ];

    let query = supabase.from('users').select('*').not('id', 'in', `(${excludedIds.join(',')})`);
    
    // Simple gender filtering based on preference
    if (req.user.interestedIn && req.user.interestedIn !== 'Both') {
      query = query.eq('gender', req.user.interestedIn);
    }

    // Filter by department if passed in query string (e.g. ?dept=CSE)
    if (req.query.dept) {
      query = query.eq('department', req.query.dept);
    }

    let { data: users, error } = await query;

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    // Fetch comments (admires) sent to the current user
    const { data: userAdmires } = await supabase
      .from('admires')
      .select('*')
      .eq('receiver_id', req.user.id);

    // Dynamic ranking based on shared campus spots and interests
    users = users.map(user => {
      let score = 0;
      
      const userObj = {
        _id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        interestedIn: user.interested_in,
        studentId: user.student_id,
        batch: user.batch,
        department: user.department,
        campusSpots: user.campus_spots || [],
        interests: user.interests || [],
        prompts: user.prompts || [],
        bio: user.bio || '',
        photos: user.photos || [],
        coverPhoto: user.cover_photo || '',
        freeSlots: user.free_slots || [],
        musicAnthem: user.music_anthem || { title: '', artist: '' },
        isOnline: user.is_online
      };

      // Calculate shared campus spots score
      const sharedSpots = (userObj.campusSpots).filter(spot => 
        (req.user.campusSpots || []).includes(spot)
      );
      score += sharedSpots.length * 10; // 10 points per mutual spot

      // Calculate shared interests score
      const sharedInterests = (userObj.interests).filter(interest => 
        (req.user.interests || []).includes(interest)
      );
      score += sharedInterests.length * 5; // 5 points per mutual interest

      // Calculate shared free slots score
      const sharedSlots = (userObj.freeSlots).filter(slot => 
        (req.user.freeSlots || []).includes(slot)
      );
      score += sharedSlots.length * 15; // 15 points per mutual slot

      userObj.matchScore = score;
      userObj.sharedSpots = sharedSpots;
      userObj.sharedInterests = sharedInterests;
      userObj.sharedSlots = sharedSlots;

      // Check if recommended user sent a direct admire (comment) to the current user
      const mutualAdmire = (userAdmires || []).find(admire => 
        admire.sender_id === user.id
      );
      if (mutualAdmire) {
        userObj.admireComment = mutualAdmire.comment;
        userObj.admirePrompt = mutualAdmire.prompt_question;
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

    const { data: user, error: getError } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (getError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldPhotos = user.photos || [];
    const newPhotos = [photoUrl, ...oldPhotos.slice(1)];

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ photos: newPhotos })
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ message: updateError.message });
    }

    const formattedUser = {
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      gender: updatedUser.gender,
      interestedIn: updatedUser.interested_in,
      studentId: updatedUser.student_id,
      batch: updatedUser.batch,
      department: updatedUser.department,
      campusSpots: updatedUser.campus_spots || [],
      interests: updatedUser.interests || [],
      prompts: updatedUser.prompts || [],
      bio: updatedUser.bio || '',
      photos: updatedUser.photos || [],
      coverPhoto: updatedUser.cover_photo || '',
      freeSlots: updatedUser.free_slots || [],
      musicAnthem: updatedUser.music_anthem || { title: '', artist: '' },
      isOnline: updatedUser.is_online
    };

    res.json({ message: 'Profile picture uploaded successfully', photoUrl, user: formattedUser });
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

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ cover_photo: coverUrl })
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const formattedUser = {
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      gender: updatedUser.gender,
      interestedIn: updatedUser.interested_in,
      studentId: updatedUser.student_id,
      batch: updatedUser.batch,
      department: updatedUser.department,
      campusSpots: updatedUser.campus_spots || [],
      interests: updatedUser.interests || [],
      prompts: updatedUser.prompts || [],
      bio: updatedUser.bio || '',
      photos: updatedUser.photos || [],
      coverPhoto: updatedUser.cover_photo || '',
      freeSlots: updatedUser.free_slots || [],
      musicAnthem: updatedUser.music_anthem || { title: '', artist: '' },
      isOnline: updatedUser.is_online
    };

    res.json({ message: 'Cover photo uploaded successfully', coverUrl, user: formattedUser });
  } catch (error) {
    console.error('Cover photo upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUserProfile, updateUserProfile, getRecommendations, uploadProfilePicture, uploadCoverPhoto };
