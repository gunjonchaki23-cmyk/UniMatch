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
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top Navbar */}
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 z-10 flex-shrink-0 transition">
        <h1 className="text-2xl font-extrabold text-primary tracking-tighter">UniMatch.</h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleDarkMode} 
            className="text-gray-400 dark:text-gray-300 hover:text-primary transition text-lg"
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/matches')} className="text-gray-400 dark:text-gray-300 hover:text-primary transition relative">
            <MessageCircle size={28} />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold cursor-pointer" onClick={() => navigate('/profile')}>
            {userInfo?.name?.charAt(0) || <UserIcon />}
          </div>
        </div>
      </div>

      {/* Department Filter Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-3 px-6 flex gap-2 overflow-x-auto scrollbar-none z-10 flex-shrink-0 transition">
        {['All', 'CSE', 'EEE', 'BBA', 'Architecture', 'English', 'LLB'].map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition whitespace-nowrap ${
              activeDept === dept
                ? 'bg-gradient-primary text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Swipe Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950 transition">
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
            <div className="w-full h-full rounded-3xl bg-white dark:bg-gray-900 shadow-lg flex flex-col items-center justify-center p-8 text-center border-4 border-dashed border-gray-200 dark:border-gray-800 transition">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-850 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No more matches</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs">You've seen everyone in your area. Check back later!</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="h-24 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex items-center justify-center space-x-8 z-10 pb-4 transition">
        <button 
          className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-red-500 hover:scale-110 transition transform border border-gray-100 dark:border-gray-700"
          onClick={() => {
            if(currentIndex < users.length) handleSwipe('left', users[currentIndex]._id);
          }}
        >
          <X size={32} strokeWidth={3} />
        </button>
        <button 
          className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-green-500 hover:scale-110 transition transform border border-gray-100 dark:border-gray-700"
          onClick={() => {
            if(currentIndex < users.length) handleSwipe('right', users[currentIndex]._id);
          }}
        >
          <Heart size={32} strokeWidth={3} />
        </button>
      </div>

      {/* Match Confetti Screen Modal */}
      {showMatchModal && matchedUser && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 overflow-hidden animate-fade-in select-none">
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
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200 transform -rotate-6 hover:scale-105 transition">
              {userInfo?.photos?.[0] || userInfo?.photoUrl ? (
                <img src={userInfo.photos?.[0] || userInfo.photoUrl} alt="Me" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {userInfo?.name?.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200 transform rotate-6 hover:scale-105 transition">
              {matchedUser.photos?.[0] ? (
                <img src={matchedUser.photos[0]} alt={matchedUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {matchedUser.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2 w-56 z-10">
            <button
              onClick={() => {
                setShowMatchModal(false);
                navigate(`/chat/${matchedUser._id}`);
              }}
              className="w-full py-3 bg-gradient-primary text-white font-extrabold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition transform active:scale-95 text-center text-xs"
            >
              Send a Message ⚡
            </button>
            <button
              onClick={() => setShowMatchModal(false)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold rounded-full border border-white/20 transition text-center text-xs"
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
