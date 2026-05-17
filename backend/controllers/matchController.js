const Match = require('../models/Match');
const User = require('../models/User');

// @desc    Get all matches for current user
// @route   GET /api/matches
// @access  Private
const getMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      users: { $in: [req.user._id] }
    }).populate('users', 'name photos isOnline');

    // Format response to make it easy for frontend
    const formattedMatches = matches.map(match => {
      const otherUser = match.users.find(u => u._id.toString() !== req.user._id.toString());
      return {
        matchId: match._id,
        user: otherUser,
        createdAt: match.createdAt
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMatches };
