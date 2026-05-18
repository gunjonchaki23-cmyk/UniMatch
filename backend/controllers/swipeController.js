const supabase = require('../config/db');

// @desc    Swipe Right (Like)
// @route   POST /api/swipe/like/:id
// @access  Private
const likeUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    // Check if like already exists
    const { data: likeExists, error: checkLikeError } = await supabase
      .from('likes')
      .select('id')
      .eq('liker_id', currentUserId)
      .eq('liked_id', targetUserId)
      .maybeSingle();

    if (!likeExists) {
      const { error: insertLikeError } = await supabase
        .from('likes')
        .insert({
          liker_id: currentUserId,
          liked_id: targetUserId
        });
      
      if (insertLikeError) {
        return res.status(500).json({ message: insertLikeError.message });
      }
    }

    // Save direct admire comments if present
    if (req.body.comment) {
      const { error: insertAdmireError } = await supabase
        .from('admires')
        .insert({
          sender_id: currentUserId,
          receiver_id: targetUserId,
          prompt_question: req.body.promptQuestion || '',
          comment: req.body.comment
        });

      if (insertAdmireError) {
        console.error('Insert admire error:', insertAdmireError);
      }
    }

    // Check if target user has liked current user (Mutual Match!)
    const { data: targetLikesCurrent, error: checkMatchError } = await supabase
      .from('likes')
      .select('id')
      .eq('liker_id', targetUserId)
      .eq('liked_id', currentUserId)
      .maybeSingle();

    if (targetLikesCurrent) {
      // It's a match! Sort IDs to prevent duplicate matching
      const userOne = currentUserId < targetUserId ? currentUserId : targetUserId;
      const userTwo = currentUserId > targetUserId ? currentUserId : targetUserId;

      const { data: matchExists, error: checkExistError } = await supabase
        .from('matches')
        .select('*')
        .eq('user_one', userOne)
        .eq('user_two', userTwo)
        .maybeSingle();

      if (!matchExists) {
        const { data: match, error: createMatchError } = await supabase
          .from('matches')
          .insert({
            user_one: userOne,
            user_two: userTwo
          })
          .select()
          .single();

        if (createMatchError) {
          return res.status(500).json({ message: createMatchError.message });
        }

        return res.json({
          message: 'Match!',
          match: {
            _id: match.id,
            users: [match.user_one, match.user_two],
            createdAt: match.created_at
          }
        });
      } else {
        return res.json({
          message: 'Match!',
          match: {
            _id: matchExists.id,
            users: [matchExists.user_one, matchExists.user_two],
            createdAt: matchExists.created_at
          }
        });
      }
    }

    res.json({ message: 'Liked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Swipe Left (Pass)
// @route   POST /api/swipe/pass/:id
// @access  Private
const passUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    // Check if pass already exists
    const { data: passExists, error: checkPassError } = await supabase
      .from('dislikes')
      .select('id')
      .eq('disliker_id', currentUserId)
      .eq('disliked_id', targetUserId)
      .maybeSingle();

    if (!passExists) {
      const { error: insertPassError } = await supabase
        .from('dislikes')
        .insert({
          disliker_id: currentUserId,
          disliked_id: targetUserId
        });

      if (insertPassError) {
        return res.status(500).json({ message: insertPassError.message });
      }
    }

    res.json({ message: 'Passed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { likeUser, passUser };
