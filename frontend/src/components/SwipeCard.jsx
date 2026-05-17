import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const SwipeCard = ({ user, onSwipe }) => {
  const [showPrompts, setShowPrompts] = useState(false);
  const [admireComment, setAdmireComment] = useState('');
  const [activeAdmireIndex, setActiveAdmireIndex] = useState(null);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      onSwipe('right', user._id);
    } else if (info.offset.x < -100) {
      onSwipe('left', user._id);
    }
  };

  const submitAdmire = (question, index) => {
    if (!admireComment.trim()) return;
    onSwipe('right', user._id, {
      promptQuestion: question,
      comment: admireComment
    });
    setAdmireComment('');
    setActiveAdmireIndex(null);
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={!showPrompts && activeAdmireIndex === null ? "x" : false} // Disable drag when typing comment or scrolling prompts
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full h-[500px] bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border-4 border-white"
    >
      <div className="relative w-full h-full">
        {showPrompts ? (
          /* Profile Details / Prompt Screen */
          <div className="w-full h-full bg-gradient-to-br from-red-50 to-white p-6 overflow-y-auto space-y-4 select-none">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{user.name}, {user.age || '?'}</h2>
                <p className="text-xs text-primary font-bold tracking-wide mt-0.5">
                  {user.department || 'AIUB'} {user.batch ? `• ${user.batch}` : ''}
                </p>
              </div>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowPrompts(false); }}
                className="text-xs bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-full hover:bg-gray-300 transition"
              >
                📷 Photo
              </button>
            </div>

            {/* Spotify Campus Anthem Vinyl Player */}
            {user.musicAnthem && user.musicAnthem.title && (
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 rounded-2xl flex items-center gap-3 shadow-md border border-gray-700">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center border-2 border-gray-600 animate-spin" style={{ animationDuration: '6s' }}>
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Campus Anthem</span>
                  <p className="text-xs font-bold truncate">{user.musicAnthem.title}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user.musicAnthem.artist || 'Unknown Artist'}</p>
                </div>
                <span className="text-xl">🎵</span>
              </div>
            )}

            {/* Shared Interests */}
            {user.interests && user.interests.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interests</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {user.interests.map((tag) => {
                    const isShared = user.sharedInterests?.includes(tag);
                    return (
                      <span key={tag} className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition ${
                        isShared 
                          ? 'bg-gradient-primary text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Favorite Spots */}
            {user.campusSpots && user.campusSpots.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Favorite spots</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {user.campusSpots.map((spot) => {
                    const isShared = user.sharedSpots?.includes(spot);
                    return (
                      <span key={spot} className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition border ${
                        isShared 
                          ? 'bg-red-50 text-red-700 border-red-200 shadow-sm' 
                          : 'bg-gray-100 text-gray-500 border-transparent'
                      }`}>
                        📍 {spot}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mutual Free Slots Schedule */}
            {user.sharedSlots && user.sharedSlots.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mutual free slots 🕒</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {user.sharedSlots.map((slot) => (
                    <span key={slot} className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-green-50 text-green-700 border border-green-200 shadow-sm animate-pulse">
                      ⏰ {slot}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Cards with Direct Likes */}
            {user.prompts && user.prompts.filter(p => p.answer).length > 0 ? (
              <div className="space-y-3 pt-1">
                {user.prompts.filter(p => p.answer).map((prompt, index) => (
                  <div key={index} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">Prompt {index + 1}</span>
                      {activeAdmireIndex !== index && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setActiveAdmireIndex(index); }}
                          className="text-[10px] bg-red-50 text-primary font-bold px-2 py-0.5 rounded-full border border-red-100 hover:bg-red-100 transition"
                        >
                          💌 React
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 italic">"{prompt.question}"</p>
                    <p className="text-sm font-semibold text-gray-800">{prompt.answer}</p>
                    
                    {activeAdmireIndex === index && (
                      <div className="space-y-1.5 pt-2 border-t border-gray-50 flex flex-col">
                        <input
                          type="text"
                          placeholder="Send a comment with your like..."
                          className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-primary"
                          value={admireComment}
                          onChange={(e) => setAdmireComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitAdmire(prompt.question, index);
                          }}
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => { setActiveAdmireIndex(null); setAdmireComment(''); }}
                            className="text-[10px] text-gray-400 font-bold px-2.5 py-1"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => submitAdmire(prompt.question, index)}
                            className="bg-gradient-primary text-white text-[10px] font-bold px-3 py-1 rounded-xl shadow-sm hover:scale-105 transition"
                          >
                            Send & Like
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic pt-2">No prompts answered yet.</p>
            )}
          </div>
        ) : (
          /* Profile Photo Screen */
          <>
            {user.photos && user.photos.length > 0 ? (
              <img src={user.photos[0]} alt={user.name} className="w-full h-full object-cover select-none" />
            ) : (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center select-none">
                <span className="text-white text-6xl font-bold">{user.name.charAt(0)}</span>
              </div>
            )}
            
            {/* Direct Admire Floating Bubble Overlay */}
            {user.admireComment && (
              <div className="absolute top-16 left-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white p-3 rounded-2xl shadow-lg border border-white/20 space-y-1 select-none z-20 animate-bounce">
                <span className="text-[9px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                  💌 Sent you an Admire
                </span>
                <p className="text-[10px] italic opacity-90 truncate mt-0.5">"{user.admirePrompt}"</p>
                <p className="text-xs font-extrabold">"{user.admireComment}"</p>
              </div>
            )}

            {/* Spark Details Button */}
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowPrompts(true); }}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white text-sm font-bold w-10 h-10 rounded-full transition backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10 z-10"
              title="View prompts and interests"
            >
              ✨
            </button>

            {/* Gradient Overlay for Text */}
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-white select-none">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{user.name}, {user.age || '?'}</h2>
                {user.department && (
                  <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full backdrop-blur-sm tracking-wide">
                    {user.department}
                  </span>
                )}
              </div>
              
              {user.batch && (
                <p className="text-[11px] text-white/70 font-semibold tracking-wide mt-0.5">
                  🎓 {user.batch}
                </p>
              )}

              <p className="text-xs opacity-90 mt-2 line-clamp-2">{user.bio || 'No bio provided.'}</p>
            </div>
          </>
        )}

        {/* Like/Pass Indicators */}
        <motion.div
          className="absolute top-8 left-8 border-4 border-green-500 rounded-lg px-4 py-2 text-green-500 font-bold text-4xl uppercase transform -rotate-12 select-none z-10"
          style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
        >
          LIKE
        </motion.div>
        
        <motion.div
          className="absolute top-8 right-8 border-4 border-red-500 rounded-lg px-4 py-2 text-red-500 font-bold text-4xl uppercase transform rotate-12 select-none z-10"
          style={{ opacity: useTransform(x, [0, -100], [0, 1]) }}
        >
          NOPE
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
