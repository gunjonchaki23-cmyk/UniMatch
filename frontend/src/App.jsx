import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import './App.css';

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-gray-900 dark:text-gray-100 font-sans relative overflow-hidden transition">
        {/* Animated Background Blobs for Liquid Glass depth */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] rounded-full bg-gradient-to-tr from-pink-500/15 to-red-500/15 blur-[120px] animate-liquid-blob-1 pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] md:w-[35vw] md:h-[35vw] rounded-full bg-gradient-to-tr from-indigo-500/15 to-purple-500/15 blur-[130px] animate-liquid-blob-2 pointer-events-none z-0"></div>
        <div className="absolute top-[30%] right-[10%] w-[45vw] h-[45vw] md:w-[30vw] md:h-[30vw] rounded-full bg-gradient-to-tr from-blue-500/10 to-emerald-500/10 blur-[100px] animate-liquid-blob-3 pointer-events-none z-0"></div>

        <div className="relative z-10 min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/chat/:id" element={<Chat />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
