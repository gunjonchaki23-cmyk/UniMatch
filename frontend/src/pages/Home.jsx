import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-primary text-white p-4">
      <div className="glass p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tighter">UniMatch.</h1>
        <p className="text-lg mb-8 opacity-90">Find your perfect match at AIUB.</p>
        
        <div className="flex flex-col space-y-4">
          <Link 
            to="/register" 
            className="bg-white text-primary-dark font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            Create Account
          </Link>
          <Link 
            to="/login" 
            className="bg-transparent border-2 border-white text-white font-bold py-3 px-6 rounded-full hover:bg-white hover:text-primary-dark transition"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
