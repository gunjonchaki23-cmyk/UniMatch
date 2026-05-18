const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from Supabase PostgreSQL
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Map database fields to standard Mongoose properties for controller/frontend compatibility
      req.user = {
        _id: user.id,
        id: user.id,
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

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
