const User = require('../models/User');
const Match = require('../models/Match');

// @desc    Swipe Right (Like)
// @route   POST /api/swipe/like/:id
// @access  Private
const likeUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const targetUserId = req.params.id;

    if (!currentUser.likes.includes(targetUserId)) {
      currentUser.likes.push(targetUserId);
      await currentUser.save();
    }

    // Check if it's a match
    const targetUser = await User.findById(targetUserId);

    // Save direct admire comments if present
    if (req.body.comment) {
      targetUser.admires.push({
        sender: currentUser._id,
        promptQuestion: req.body.promptQuestion || '',
        comment: req.body.comment
      });
      await targetUser.save();
    }

    if (targetUser.likes.includes(currentUser._id)) {
      // It's a match!
      const matchExists = await Match.findOne({
        users: { $all: [currentUser._id, targetUser._id] }
      });

      if (!matchExists) {
        const match = await Match.create({
          users: [currentUser._id, targetUser._id]
        });

        // Add match reference to both users
        currentUser.matches.push(targetUser._id);
        targetUser.matches.push(currentUser._id);
        await currentUser.save();
        await targetUser.save();

        return res.json({ message: 'Match!', match });
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
    const currentUser = await User.findById(req.user._id);
    const targetUserId = req.params.id;

    if (!currentUser.dislikes.includes(targetUserId)) {
      currentUser.dislikes.push(targetUserId);
      await currentUser.save();
    }

    res.json({ message: 'Passed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { likeUser, passUser };
