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
      className="absolute w-full h-[500px] liquid-glass overflow-hidden cursor-grab active:cursor-grabbing border-2 border-white/40 dark:border-white/10 rounded-3xl"
    >
      <div className="relative w-full h-full">
        {showPrompts ? (
          /* Profile Details / Prompt Screen */
          <div className="w-full h-full bg-gradient-to-br from-red-500/10 via-transparent to-indigo-500/10 dark:from-red-500/5 dark:via-transparent dark:to-indigo-500/5 p-6 overflow-y-auto space-y-4 select-none">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/30 dark:border-white/5 pb-3">
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight">{user.name}, {user.age || '?'}</h2>
                <p className="text-xs text-primary font-extrabold tracking-wide mt-0.5 uppercase">
                  {user.department || 'AIUB'} {user.batch ? `• ${user.batch}` : ''}
                </p>
              </div>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowPrompts(false); }}
                className="text-xs bg-white/20 hover:bg-white/40 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold px-3.5 py-1.5 rounded-xl border border-white/30 dark:border-white/5 transition"
              >
                📷 Photo
              </button>
            </div>

            {/* Spotify Campus Anthem Vinyl Player */}
            {user.musicAnthem && user.musicAnthem.title && (
              <div className="bg-gradient-to-r from-gray-900/90 to-gray-850/90 backdrop-blur-md text-white p-4 rounded-2xl flex items-center gap-3 shadow-md border border-white/10">
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
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Interests</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {user.interests.map((tag) => {
                    const isShared = user.sharedInterests?.includes(tag);
                    return (
                      <span key={tag} className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wide uppercase transition border ${
                        isShared 
                          ? 'bg-gradient-primary text-white border-transparent shadow-sm' 
                          : 'bg-white/30 dark:bg-white/5 border-white/20 dark:border-white/5 text-gray-500 dark:text-gray-400'
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
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Favorite spots</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {user.campusSpots.map((spot) => {
                    const isShared = user.sharedSpots?.includes(spot);
                    return (
                      <span key={spot} className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wide uppercase transition border ${
                        isShared 
                          ? 'bg-red-500/10 text-primary border-red-500/25 shadow-sm' 
                          : 'bg-white/30 dark:bg-white/5 border-white/20 dark:border-white/5 text-gray-500 dark:text-gray-400'
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
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Mutual free slots 🕒</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {user.sharedSlots.map((slot) => (
                    <span key={slot} className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm animate-pulse">
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
                  <div key={index} className="bg-white/30 dark:bg-black/15 p-4 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">Prompt {index + 1}</span>
                      {activeAdmireIndex !== index && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setActiveAdmireIndex(index); }}
                          className="text-[10px] bg-red-500/10 text-primary font-bold px-2.5 py-0.5 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition"
                        >
                          💌 React
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">"{prompt.question}"</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{prompt.answer}</p>
                    
                    {activeAdmireIndex === index && (
                      <div className="space-y-1.5 pt-2 border-t border-white/20 dark:border-white/5 flex flex-col">
                        <input
                          type="text"
                          placeholder="Send a comment with your like..."
                          className="w-full liquid-glass-input rounded-xl border-transparent focus:ring-0 outline-none text-xs"
                          value={admireComment}
                          onChange={(e) => setModifyAdmireComment(e.target.value) /* Wait! admireComment setter below */}
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
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#070b13] via-black/30 to-transparent p-6 text-white select-none pt-20">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight">{user.name}, {user.age || '?'}</h2>
                {user.department && (
                  <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-xl backdrop-blur-sm tracking-wide border border-white/10">
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
          className="absolute top-8 left-8 border-4 border-green-500 rounded-2xl px-5 py-2.5 text-green-500 font-black text-4xl uppercase transform -rotate-12 select-none z-10 shadow-lg shadow-green-500/20 backdrop-blur-sm"
          style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
        >
          LIKE
        </motion.div>
        
        <motion.div
          className="absolute top-8 right-8 border-4 border-red-500 rounded-2xl px-5 py-2.5 text-red-500 font-black text-4xl uppercase transform rotate-12 select-none z-10 shadow-lg shadow-red-500/20 backdrop-blur-sm"
          style={{ opacity: useTransform(x, [0, -100], [0, 1]) }}
        >
          NOPE
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
