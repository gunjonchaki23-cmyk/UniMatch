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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition">
      {/* Header */}
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 sticky top-0 z-10 transition">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-4 text-gray-800 dark:text-gray-200">Your Matches</h1>
      </div>

      {/* Match List */}
      <div className="p-4 flex-1">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-20">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">😢</span>
            </div>
            <p>No matches yet. Keep swiping!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {matches.map((match) => (
              <Link to={`/chat/${match.user._id}`} key={match.matchId} className="bg-white rounded-2xl shadow overflow-hidden flex flex-col items-center p-4 hover:shadow-lg transition">
                <div className="w-20 h-20 bg-gradient-primary rounded-full mb-3 flex items-center justify-center text-white text-2xl font-bold relative">
                  {match.user.photos && match.user.photos.length > 0 ? (
                    <img src={match.user.photos[0]} alt={match.user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    match.user.name.charAt(0)
                  )}
                  {match.user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <h3 className="font-bold text-gray-800 text-center">{match.user.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
