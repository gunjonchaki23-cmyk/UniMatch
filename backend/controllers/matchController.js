const supabase = require('../config/db');

// @desc    Get all matches for current user
// @route   GET /api/matches
// @access  Private
const getMatches = async (req, res) => {
  try {
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id,
        created_at,
        user_one:user_one ( id, name, photos, is_online ),
        user_two:user_two ( id, name, photos, is_online )
      `)
      .or(`user_one.eq.${req.user.id},user_two.eq.${req.user.id}`);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    // Format response to make it easy for frontend
    const formattedMatches = (matches || []).map(match => {
      const otherUser = match.user_one.id !== req.user.id ? match.user_one : match.user_two;
      return {
        matchId: match.id,
        user: {
          _id: otherUser.id,
          name: otherUser.name,
          photos: otherUser.photos || [],
          isOnline: otherUser.is_online
        },
        createdAt: match.created_at
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMatches };
