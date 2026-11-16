import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Heart, Award, Shield, User, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = user && ['SUPER_ADMIN', 'FOA_ADMIN', 'COMPETITION_MANAGER'].includes(user.role);
  const isSchool = user && ['SCHOOL_COORDINATOR', 'TEACHER'].includes(user.role);
  const isParticipant = user && user.role === 'PARTICIPANT';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/foa-logo.jpg" alt="Friends of Animals (FOA)" className="h-12 w-auto object-contain rounded" />
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                Friends of Animals
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block">
                Compassion Through Creativity
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <Link to="/about" className="hover:text-foa-blue transition-colors">About</Link>
            <Link to="/competitions" className="hover:text-foa-blue transition-colors">Competitions</Link>
            <Link to="/gallery" className="hover:text-foa-blue transition-colors">Gallery</Link>
            <Link to="/auctions" className="hover:text-foa-blue transition-colors">Auctions</Link>
            <Link to="/animal-welfare" className="hover:text-foa-blue transition-colors">Awareness</Link>
            <Link to="/community" className="hover:text-foa-blue transition-colors">Community</Link>
            <Link to="/donate" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 transition-colors">
              <Heart className="w-4 h-4 fill-current" /> Donate
            </Link>
          </nav>

          {/* User Auth Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link to="/admin" className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition">
                    <Shield className="w-3.5 h-3.5" /> Admin Panel
                  </Link>
                )}
                {isSchool && (
                  <Link to="/school-dashboard" className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-800 transition">
                    <Award className="w-3.5 h-3.5" /> School Portal
                  </Link>
                )}
                {isParticipant && (
                  <Link to="/participant-dashboard" className="px-3 py-1.5 rounded-lg bg-foa-blue text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-700 transition">
                    <User className="w-3.5 h-3.5" /> My Submissions
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 transition"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                  Log in
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-foa-blue rounded-lg shadow-sm hover:bg-blue-700 transition">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">About</Link>
          <Link to="/competitions" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">Competitions</Link>
          <Link to="/gallery" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">Artwork Gallery</Link>
          <Link to="/auctions" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">Auctions</Link>
          <Link to="/animal-welfare" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">Awareness</Link>
          <Link to="/donate" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-rose-600 font-semibold">Donate</Link>
          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-900 font-semibold">Admin Panel</Link>}
                {isSchool && <Link to="/school-dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-emerald-700 font-semibold">School Portal</Link>}
                {isParticipant && <Link to="/participant-dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foa-blue font-semibold">Participant Dashboard</Link>}
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-rose-600 font-medium">Log out</button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 border border-slate-300 rounded font-medium">Log in</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 bg-foa-blue text-white rounded font-medium">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
