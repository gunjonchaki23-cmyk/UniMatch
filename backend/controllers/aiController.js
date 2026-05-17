const User = require('../models/User');

// Helper to generate a fun campus fallback icebreaker
const generateFallbackIcebreaker = (currentUser, targetUser) => {
  const templates = [
    `Hey ${targetUser.name}! I see you're in ${targetUser.department || 'AIUB'} and also hang out at the ${targetUser.campusSpots?.[0] || 'Cafeteria'}. Want to skip our next 8:30 AM class and grab some samosas instead? ☕`,
    `Hey ${targetUser.name}! As a fellow AIUB student, I have to ask: do you actually study in the library, or are you just there for the premium Annex AC like me? 😉`,
    `Hey ${targetUser.name}! Since we both like ${targetUser.interests?.[0] || 'hanging out'} and the ${targetUser.campusSpots?.[0] || 'Amphitheater'}, how about we team up and try to survive getting up to Annex 3 without the lift? 🛗`,
    `Hey ${targetUser.name}! What's harder: surviving a midterm under AIUB strict invigilation, or finding a vacant table in the cafeteria during lunch break? 😭`,
    `Hey ${targetUser.name}! I see you like ${targetUser.interests?.[0] || 'UniMatch'}. Let's make a deal: if we ever match, I'll buy you a tea from the campus tea stall. ☕ Deal?`
  ];

  // Pick a random template
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
};

// @desc    Generate a witty AIUB-themed icebreaker
// @route   POST /api/ai/icebreaker
// @access  Private
const generateIcebreaker = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    
    if (!targetUserId) {
      return res.status(400).json({ message: 'Target user ID is required' });
    }

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return a fun fallback campus icebreaker if no Gemini API Key is set
      const icebreaker = generateFallbackIcebreaker(currentUser, targetUser);
      return res.json({ icebreaker, isAI: false });
    }

    // Prepare custom prompt for Gemini
    const prompt = `You are a funny AI matchmaker for American International University-Bangladesh (AIUB) students on an app called UniMatch. 
Write a short, highly engaging, witty, and personalized icebreaker/conversation opener (exactly 1 or 2 sentences maximum) from ${currentUser.name} to ${targetUser.name}. 

Information about ${targetUser.name}:
- Department: ${targetUser.department || 'General'}
- Favorite campus spots: ${(targetUser.campusSpots || []).join(', ') || 'Cafeteria, Amphitheater'}
- Interests: ${(targetUser.interests || []).join(', ') || 'Music, Movies'}

Information about ${currentUser.name}:
- Department: ${currentUser.department || 'General'}
- Favorite campus spots: ${(currentUser.campusSpots || []).join(', ') || 'Cafeteria'}
- Interests: ${(currentUser.interests || []).join(', ') || 'Gaming'}

Include extremely funny, specific references to AIUB campus life (e.g., getting stuck in the Annex 3 lift, surviving strict 8:30 AM class attendance, gossiping at the Amphitheater, fighting for samosas in the Cafeteria, or the freezing AC in the Annex building). Be playful and flirty but completely clean and respectful. Do not include any meta-text, markdown tags, or brackets in the response. Return ONLY the sentence.`;

    // Make direct API call to Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const icebreaker = data.candidates[0].content.parts[0].text.trim();
      return res.json({ icebreaker, isAI: true });
    } else {
      // Fallback if API returns empty or fails
      const icebreaker = generateFallbackIcebreaker(currentUser, targetUser);
      return res.json({ icebreaker, isAI: false });
    }

  } catch (error) {
    console.error('Gemini Icebreaker generation error:', error);
    // Graceful fallback to static templates on any error
    try {
      const currentUser = await User.findById(req.user._id);
      const targetUser = await User.findById(req.body.targetUserId);
      const icebreaker = generateFallbackIcebreaker(currentUser, targetUser);
      return res.json({ icebreaker, isAI: false });
    } catch (innerError) {
      return res.status(500).json({ message: error.message });
    }
  }
};

module.exports = { generateIcebreaker };
