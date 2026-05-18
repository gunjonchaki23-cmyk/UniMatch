import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden bg-transparent">
      {/* Glossy Liquid Glass Container */}
      <div className="liquid-glass p-8 md:p-10 rounded-[32px] max-w-md w-full z-10 transition">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-red-500/30 transform rotate-12">
            🔥
          </div>
        </div>
        <h2 className="text-4xl font-black text-center mb-1 text-gradient-primary tracking-tight">Join UniMatch</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8 font-medium text-sm">Sign up to find your perfect match at AIUB.</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 p-4 mb-6 rounded-2xl backdrop-blur-md text-sm font-medium animate-pulse">
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-primary dark:text-primary mb-1.5 ml-1">Full Name</label>
            <input 
              type="text" 
              className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none transition px-4 py-3.5 text-sm"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-primary dark:text-primary mb-1.5 ml-1">AIUB Email Address</label>
            <input 
              type="email" 
              className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none transition px-4 py-3.5 text-sm"
              placeholder="xx-xxxxx-x@student.aiub.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-primary dark:text-primary mb-1.5 ml-1">Create Password</label>
            <input 
              type="password" 
              className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none transition px-4 py-3.5 text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-primary dark:text-primary mb-1.5 ml-1">Confirm Password</label>
            <input 
              type="password" 
              className="w-full liquid-glass-input rounded-2xl border-transparent focus:ring-0 outline-none transition px-4 py-3.5 text-sm"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full liquid-glass-button text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Spark'
            )}
          </button>
        </form>
        
        <p className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
          Already have an account? <Link to="/login" className="text-primary hover:text-primary-dark hover:underline font-bold transition">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
