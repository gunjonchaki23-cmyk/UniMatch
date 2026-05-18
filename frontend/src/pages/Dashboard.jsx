import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SwipeCard from '../components/SwipeCard';
import { Heart, X, MessageCircle, User as UserIcon } from 'lucide-react';
import API_URL from '../config';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeDept, setActiveDept] = useState('All');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  });
  const navigate = useNavigate();
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const userInfoObj = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfoObj) {
      navigate('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${userInfoObj.token}` }
        };
        const url = activeDept && activeDept !== 'All'
          ? `${API_URL}/api/users/recommendations?dept=${activeDept}`
          : `${API_URL}/api/users/recommendations`;
        const { data } = await axios.get(url, config);
        setUsers(data);
        setCurrentIndex(0); // Reset index on filter change!
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchUsers();
  }, [navigate, activeDept]);

  const handleSwipe = async (direction, targetId, admirePayload = null) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      
      if (direction === 'right') {
        const body = admirePayload ? admirePayload : {};
        const res = await axios.post(`${API_URL}/api/swipe/like/${targetId}`, body, config);
        if (res.data.message === 'Match!') {
          const matchedTarget = users.find((u) => u._id === targetId);
          setMatchedUser(matchedTarget);
          setShowMatchModal(true);
        }
      } else {
        await axios.post(`${API_URL}/api/swipe/pass/${targetId}`, {}, config);
      }
      
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error swiping:', error);
    }
  };

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-transparent overflow-hidden">
      {/* Top Navbar */}
      <div className="h-16 liquid-glass mx-4 my-2 px-6 flex items-center justify-between z-10 flex-shrink-0 transition rounded-2xl">
        <h1 className="text-2xl font-black text-gradient-primary tracking-tighter flex items-center gap-1.5">
          <span>UniMatch</span> <span className="text-xl">🔥</span>
        </h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleDarkMode} 
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 dark:bg-black/10 border border-white/20 text-gray-500 dark:text-gray-300 hover:scale-105 hover:text-primary transition"
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button 
            onClick={() => navigate('/matches')} 
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 dark:bg-black/10 border border-white/20 text-gray-500 dark:text-gray-300 hover:scale-105 hover:text-primary transition relative"
          >
            <MessageCircle size={20} />
          </button>
          <div 
            className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition" 
            onClick={() => navigate('/profile')}
          >
            {userInfo?.name?.charAt(0) || <UserIcon size={18} />}
          </div>
        </div>
      </div>

      {/* Department Filter Bar */}
      <div className="liquid-glass mx-4 mb-2 py-3 px-4 flex gap-2 overflow-x-auto scrollbar-none z-10 flex-shrink-0 transition rounded-2xl">
        {['All', 'CSE', 'EEE', 'BBA', 'Architecture', 'English', 'LLB'].map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
              activeDept === dept
                ? 'bg-gradient-primary text-white border-transparent shadow-sm'
                : 'bg-white/35 dark:bg-black/20 border-white/25 dark:border-white/5 text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-black/30'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Swipe Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 bg-transparent transition">
        <div className="relative w-full max-w-sm h-[500px]">
          {users.length > 0 && currentIndex < users.length ? (
            users.slice(currentIndex, currentIndex + 3).reverse().map((user, idx) => (
              <SwipeCard 
                key={user._id} 
                user={user} 
                onSwipe={handleSwipe} 
              />
            ))
          ) : (
            <div className="w-full h-full liquid-glass flex flex-col items-center justify-center p-8 text-center transition">
              <div className="w-20 h-20 bg-white/20 dark:bg-black/25 rounded-full flex items-center justify-center mb-4 border border-white/20">
                <Heart className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">No more sparks</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs max-w-[200px]">You've seen everyone in your area. Keep swiping or check back later!</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="h-24 bg-transparent flex items-center justify-center space-x-6 z-10 pb-4 transition">
        <button 
          className="w-16 h-16 rounded-full liquid-glass flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 hover:shadow-red-500/10 transition border border-white/40 dark:border-white/10"
          onClick={() => {
            if(currentIndex < users.length) handleSwipe('left', users[currentIndex]._id);
          }}
        >
          <X size={28} strokeWidth={3} />
        </button>
        <button 
          className="w-16 h-16 rounded-full liquid-glass flex items-center justify-center text-green-500 hover:scale-110 active:scale-95 hover:shadow-green-500/10 transition border border-white/40 dark:border-white/10"
          onClick={() => {
            if(currentIndex < users.length) handleSwipe('right', users[currentIndex]._id);
          }}
        >
          <Heart size={28} strokeWidth={3} />
        </button>
      </div>

      {/* Match Confetti Screen Modal */}
      {showMatchModal && matchedUser && (
        <div className="absolute inset-0 bg-[#070b13]/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 overflow-hidden animate-fade-in select-none">
          {/* Confetti falling container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => {
              const delay = Math.random() * 5;
              const left = Math.random() * 100;
              const duration = 2 + Math.random() * 3;
              const color = ['#ff4b4b', '#ff8585', '#ffd32a', '#05c46b', '#0be881', '#3c40c6'][i % 6];
              return (
                <div 
                  key={i} 
                  className="absolute w-2 h-2 rounded-sm opacity-80 animate-fall"
                  style={{
                    left: `${left}%`,
                    top: `-10px`,
                    backgroundColor: color,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    animationIterationCount: 'infinite'
                  }}
                />
              );
            })}
          </div>

          <div className="text-center space-y-2 z-10 px-6 max-w-xs">
            <span className="text-pink-500 text-6xl animate-pulse block">💖</span>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 tracking-tighter drop-shadow">
              It's a Match!
            </h2>
            <p className="text-gray-300 text-xs">
              You and <span className="font-bold text-white">{matchedUser.name}</span> liked each other.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-[-15px] my-10 z-10 relative">
            <div className="w-24 h-24 rounded-full border-4 border-white/50 shadow-2xl overflow-hidden bg-gray-200 transform -rotate-6 hover:scale-105 transition">
              {userInfo?.photos?.[0] || userInfo?.photoUrl ? (
                <img src={userInfo.photos?.[0] || userInfo.photoUrl} alt="Me" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {userInfo?.name?.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="w-24 h-24 rounded-full border-4 border-white/50 shadow-2xl overflow-hidden bg-gray-200 transform rotate-6 hover:scale-105 transition">
              {matchedUser.photos?.[0] ? (
                <img src={matchedUser.photos[0]} alt={matchedUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {matchedUser.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2.5 w-56 z-10">
            <button
              onClick={() => {
                setShowMatchModal(false);
                navigate(`/chat/${matchedUser._id}`);
              }}
              className="w-full py-3.5 liquid-glass-button text-white font-extrabold rounded-2xl shadow-lg text-center text-xs"
            >
              Send a Message ⚡
            </button>
            <button
              onClick={() => setShowMatchModal(false)}
              className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-extrabold rounded-2xl border border-white/20 transition text-center text-xs"
            >
              Keep Swiping 🔍
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
