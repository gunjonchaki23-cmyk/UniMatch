import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { ArrowLeft, Save } from 'lucide-react';

const Profile = () => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [campusSpots, setCampusSpots] = useState([]);
  const [interests, setInterests] = useState([]);
  const [prompts, setPrompts] = useState([
    { question: 'My go-to spot in the AIUB campus is...', answer: '' },
    { question: 'Surviving an 8:30 AM class requires...', answer: '' },
    { question: "Let's skip class and grab tea if...", answer: '' }
  ]);
  const [freeSlots, setFreeSlots] = useState([]);
  const [anthemTitle, setAnthemTitle] = useState('');
  const [anthemArtist, setAnthemArtist] = useState('');
  const [message, setMessage] = useState('');

  const DEPARTMENTS = ['CSE', 'EEE', 'BBA', 'Architecture', 'English', 'LLB', 'Other'];
  const INTEREST_TAGS = ['Gaming', 'Programming', 'Photography', 'Music', 'Anime', 'Sports', 'Reading', 'Travel', 'Food', 'Movies'];
  const CAMPUS_SPOTS = ['Cafeteria', 'Amphitheater', 'Annex 1 Lobby', 'Playground', 'Library', 'Annex 3', 'Tea Stall'];
  const SCHEDULE_SLOTS = [
    'Sun 8:30 AM', 'Sun 11:00 AM', 'Sun 2:00 PM',
    'Mon 8:30 AM', 'Mon 11:00 AM', 'Mon 2:00 PM',
    'Tue 8:30 AM', 'Tue 11:00 AM', 'Tue 2:00 PM',
    'Wed 8:30 AM', 'Wed 11:00 AM', 'Wed 2:00 PM',
    'Thu 8:30 AM', 'Thu 11:00 AM', 'Thu 2:00 PM'
  ];
  
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const userInfoObj = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfoObj) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfoObj.token}` } };
        const { data } = await axios.get(`${API_URL}/api/users/profile`, config);
        setName(data.name || '');
        setBio(data.bio || '');
        setAge(data.age || '');
        setGender(data.gender || '');
        setInterestedIn(data.interestedIn || '');
        setCoverPhoto(data.coverPhoto || '');
        setProfilePhoto(data.photos && data.photos.length > 0 ? data.photos[0] : '');
        setStudentId(data.studentId || '');
        setDepartment(data.department || '');
        setCampusSpots(data.campusSpots || []);
        setInterests(data.interests || []);
        setFreeSlots(data.freeSlots || []);
        setAnthemTitle(data.musicAnthem?.title || '');
        setAnthemArtist(data.musicAnthem?.artist || '');
        if (data.prompts && data.prompts.length > 0) {
          setPrompts(data.prompts);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleIdChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Digits only
    if (val.length > 2) {
      val = val.substring(0, 2) + '-' + val.substring(2);
    }
    if (val.length > 8) {
      val = val.substring(0, 8) + '-' + val.substring(8, 9);
    }
    setStudentId(val.substring(0, 10)); // e.g., 21-45678-3
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const toggleSpot = (spot) => {
    if (campusSpots.includes(spot)) {
      setCampusSpots(campusSpots.filter((s) => s !== spot));
    } else {
      setCampusSpots([...campusSpots, spot]);
    }
  };

  const handlePromptAnswerChange = (index, val) => {
    const newPrompts = [...prompts];
    newPrompts[index].answer = val;
    setPrompts(newPrompts);
  };

  const toggleSlot = (slot) => {
    if (freeSlots.includes(slot)) {
      setFreeSlots(freeSlots.filter((s) => s !== slot));
    } else {
      setFreeSlots([...freeSlots, slot]);
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setMessage('Uploading profile picture...');
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      const { data } = await axios.post(`${API_URL}/api/users/profile/photo`, formData, config);
      setProfilePhoto(data.photoUrl);
      setMessage('Profile picture updated successfully!');
    } catch (error) {
      console.error('Profile photo upload error:', error);
      setMessage(error.response?.data?.message || error.message || 'Error uploading profile picture');
    }
  };

  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('cover', file);

    try {
      setMessage('Uploading cover photo...');
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      const { data } = await axios.post(`${API_URL}/api/users/profile/cover`, formData, config);
      setCoverPhoto(data.coverUrl);
      setMessage('Cover photo updated successfully!');
    } catch (error) {
      console.error('Cover photo upload error:', error);
      setMessage(error.response?.data?.message || error.message || 'Error uploading cover photo');
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`${API_URL}/api/users/profile`, {
        name, bio, age, gender, interestedIn, studentId, department, campusSpots, interests, prompts,
        freeSlots, musicAnthem: { title: anthemTitle, artist: anthemArtist }
      }, config);
      setMessage('Profile updated successfully');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating profile');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col p-4 relative pb-20">
      <div className="max-w-md w-full mx-auto liquid-glass rounded-[32px] overflow-hidden mt-10 border-white/40 dark:border-white/10">
        <div 
          className="h-44 relative bg-cover bg-center bg-gray-200 overflow-hidden"
          style={{ backgroundImage: coverPhoto ? `url(${coverPhoto})` : 'linear-gradient(135deg, #ff4b4b 0%, #ff7b7b 100%)' }}
        >
          <button 
            onClick={() => navigate('/dashboard')}
            className="absolute top-4 left-4 text-white hover:bg-black/30 p-2.5 rounded-xl transition bg-black/20 backdrop-blur-sm"
          >
            <ArrowLeft size={18} />
          </button>
          
          {/* Cover Photo Upload Trigger */}
          <label className="absolute bottom-4 right-4 bg-black/50 text-white hover:bg-black/70 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 backdrop-blur-sm border border-white/10 shadow-lg">
            <span>📷 Cover</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleCoverPhotoUpload} 
            />
          </label>
        </div>
        
        <div className="px-6 py-8 relative">
          <div className="absolute -top-16 left-6 w-24 h-24 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-2xl p-1 shadow-xl group border border-white/40 dark:border-white/10">
            <div className="w-full h-full rounded-xl overflow-hidden relative bg-gray-200 dark:bg-gray-800">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-primary rounded-xl flex items-center justify-center text-white text-3xl font-black">
                  {name.charAt(0)}
                </div>
              )}
              
              {/* Profile Photo Upload Trigger */}
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <span className="text-xs font-bold">Edit</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleProfilePhotoUpload} 
                />
              </label>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-6 mt-10">
            <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight">Edit Spark Profile</h2>
            <button onClick={handleLogout} className="text-red-500 font-extrabold hover:underline text-xs bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20 transition">
              Log Out
            </button>
          </div>

          {message && (
            <div className={`p-4 rounded-2xl mb-6 text-sm font-semibold border ${message.includes('successfully') ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              {message}
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Full Name</label>
              <input type="text" className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Bio</label>
              <textarea className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none" rows="3" value={bio} onChange={(e) => setBio(e.target.value)} maxLength="500"></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Age</label>
                <input type="number" className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Gender</label>
                <select className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="" className="bg-slate-100 dark:bg-[#070b13]">Select...</option>
                  <option value="Male" className="bg-slate-100 dark:bg-[#070b13]">Male</option>
                  <option value="Female" className="bg-slate-100 dark:bg-[#070b13]">Female</option>
                  <option value="Other" className="bg-slate-100 dark:bg-[#070b13]">Other</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Interested In</label>
                <select className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none text-sm" value={interestedIn} onChange={(e) => setInterestedIn(e.target.value)}>
                  <option value="" className="bg-slate-100 dark:bg-[#070b13]">Select...</option>
                  <option value="Male" className="bg-slate-100 dark:bg-[#070b13]">Male</option>
                  <option value="Female" className="bg-slate-100 dark:bg-[#070b13]">Female</option>
                  <option value="Both" className="bg-slate-100 dark:bg-[#070b13]">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Department</label>
                <select className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none text-sm" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="" className="bg-slate-100 dark:bg-[#070b13]">Select...</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="bg-slate-100 dark:bg-[#070b13]">{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Student ID</label>
              <input 
                type="text" 
                placeholder="e.g. 21-45678-3"
                className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none" 
                value={studentId} 
                onChange={handleIdChange} 
              />
            </div>

            {/* Interest Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_TAGS.map((tag) => {
                  const isSelected = interests.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleInterest(tag)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                        isSelected 
                          ? 'bg-gradient-primary text-white border-transparent shadow-sm' 
                          : 'bg-white/30 dark:bg-black/25 border-white/20 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-black/35'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campus Spots */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Favorite AIUB Spots</label>
              <div className="flex flex-wrap gap-2">
                {CAMPUS_SPOTS.map((spot) => {
                  const isSelected = campusSpots.includes(spot);
                  return (
                    <button
                      type="button"
                      key={spot}
                      onClick={() => toggleSpot(spot)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                        isSelected 
                          ? 'bg-red-500/10 text-primary border-red-500/25 shadow-sm' 
                          : 'bg-white/30 dark:bg-black/25 border-white/20 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-black/35'
                      }`}
                    >
                      {isSelected ? '📍 ' : ''}{spot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free Slots Schedule */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">My Free Slots (For mutual study dates! 🕒)</label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto border border-white/20 dark:border-white/5 rounded-2xl p-3 bg-white/10 dark:bg-black/15 scrollbar-thin">
                {SCHEDULE_SLOTS.map((slot) => {
                  const isSelected = freeSlots.includes(slot);
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => toggleSlot(slot)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                        isSelected 
                          ? 'bg-gradient-primary text-white border-transparent shadow-sm' 
                          : 'bg-white/30 dark:bg-black/25 border-white/20 dark:border-white/5 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Music Anthem */}
            <div className="bg-white/20 dark:bg-black/15 p-4 rounded-2xl border border-white/20 dark:border-white/5 space-y-3">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">🎵 Spotify Campus Anthem</label>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-[-4px]">Highlight your favorite track on your profile card!</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Song Title"
                  className="w-full liquid-glass-input rounded-xl border-transparent focus:ring-0 outline-none text-sm"
                  value={anthemTitle}
                  onChange={(e) => setAnthemTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Artist"
                  className="w-full liquid-glass-input rounded-xl border-transparent focus:ring-0 outline-none text-sm"
                  value={anthemArtist}
                  onChange={(e) => setAnthemArtist(e.target.value)}
                />
              </div>
            </div>

            {/* Prompt Cards */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">Profile Prompts (Hinge-Style)</label>
              {prompts.map((prompt, index) => (
                <div key={index} className="bg-white/20 dark:bg-black/15 p-4 rounded-2xl border border-white/20 dark:border-white/5 space-y-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Prompt {index + 1}</span>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{prompt.question}</p>
                  <input
                    type="text"
                    placeholder="Write your answer..."
                    className="w-full liquid-glass-input rounded-xl border-transparent focus:ring-0 outline-none text-sm"
                    value={prompt.answer}
                    onChange={(e) => handlePromptAnswerChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button type="submit" className="w-full liquid-glass-button text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition mt-6 flex items-center justify-center gap-2">
              <Save size={18} />
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
