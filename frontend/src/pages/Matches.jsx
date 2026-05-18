import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import API_URL from '../config';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const userInfoObj = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfoObj) {
      navigate('/login');
      return;
    }

    const fetchMatches = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfoObj.token}` } };
        const { data } = await axios.get(`${API_URL}/api/matches`, config);
        setMatches(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchMatches();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col transition">
      {/* Floating Header Panel */}
      <div className="h-16 liquid-glass mx-4 my-2 px-4 flex items-center sticky top-0 z-10 transition rounded-2xl border-white/40 dark:border-white/10">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-primary hover:scale-115 transition">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-black ml-2 text-gray-800 dark:text-gray-100 tracking-tight">Your Sparks</h1>
      </div>

      {/* Match List */}
      <div className="p-4 flex-1">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-20">
            <div className="w-20 h-20 liquid-glass rounded-full flex items-center justify-center mb-4 border border-white/30 dark:border-white/10">
              <span className="text-3xl">😢</span>
            </div>
            <p className="text-xs font-bold text-gray-400">No sparks ignited yet. Keep swiping!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {matches.map((match) => (
              <Link 
                to={`/chat/${match.user._id}`} 
                key={match.matchId} 
                className="liquid-glass rounded-3xl overflow-hidden flex flex-col items-center p-5 hover:scale-103 active:scale-98 border-white/30 dark:border-white/5 hover:border-primary/30 transition duration-300"
              >
                <div className="w-20 h-20 bg-gradient-primary rounded-2xl mb-3.5 flex items-center justify-center text-white text-2xl font-black relative shadow-lg shadow-red-500/20 border-2 border-white/40">
                  {match.user.photos && match.user.photos.length > 0 ? (
                    <img src={match.user.photos[0]} alt={match.user.name} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    match.user.name.charAt(0)
                  )}
                  {match.user.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-md"></div>
                  )}
                </div>
                <h3 className="font-extrabold text-sm text-gray-850 dark:text-gray-100 text-center">{match.user.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
