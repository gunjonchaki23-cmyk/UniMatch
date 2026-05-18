const supabase = require('../config/db');

// @desc    Get messages between current user and a target user
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${req.user.id},receiver_id.eq.${req.params.userId}),and(sender_id.eq.${req.params.userId},receiver_id.eq.${req.user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    const formattedMessages = (messages || []).map(m => ({
      _id: m.id,
      sender: m.sender_id,
      receiver: m.receiver_id,
      text: m.text,
      read: m.is_read,
      createdAt: m.created_at
    }));

    res.json(formattedMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/messages/:userId
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: req.user.id,
        receiver_id: req.params.userId,
        text
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ message: insertError.message });
    }

    const formattedMessage = {
      _id: message.id,
      sender: message.sender_id,
      receiver: message.receiver_id,
      text: message.text,
      read: message.is_read,
      createdAt: message.created_at
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, sendMessage };
