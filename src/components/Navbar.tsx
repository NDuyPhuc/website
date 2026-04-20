import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { auth } from '../lib/firebase';
import { LogOut, User, LayoutDashboard, Menu, X, Wallet as WalletIcon } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-600 flex items-center justify-center font-display font-bold text-xl italic skew-x-[-15deg]">
              T
            </div>
            <span className="font-display font-bold text-2xl tracking-tighter">TITAN FORGE</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 font-medium text-sm tracking-widest text-gray-400">
            <Link to="/" className="hover:text-red-600 transition uppercase tracking-widest">Dashboard</Link>
            <Link to="/wallet" className="hover:text-red-600 transition uppercase tracking-widest flex items-center gap-2">
               <WalletIcon className="w-4 h-4" />
               Wallet
            </Link>
            <Link to="/profile" className="hover:text-red-600 transition uppercase tracking-widest flex items-center gap-2">
               <User className="w-4 h-4" />
               Profile
            </Link>
            <a href="#" className="hover:text-red-600 transition uppercase tracking-widest">Programs</a>
            <a href="#" className="hover:text-red-600 transition uppercase tracking-widest">Trainers</a>
            <a href="#" className="hover:text-red-600 transition">LOCATION</a>
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-800">
                <button 
                  onClick={() => auth.signOut()}
                  className="flex items-center gap-2 hover:text-red-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                  LOGOUT
                </button>
                <Link 
                  to="/profile"
                  className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold hover:scale-110 transition"
                >
                  {user.displayName?.[0] || 'A'}
                </Link>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 font-bold transition rounded-sm"
              >
                JOIN NOW
              </button>
            )}
          </div>

          <button className="md:hidden text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
