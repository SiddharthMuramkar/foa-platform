import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/foa-logo.jpg" alt="FOA" className="h-10 w-auto rounded" />
              <span className="text-xl font-bold text-white tracking-tight">Friends of Animals</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              To build a world where compassion for animals is a universal human value, inspiring people to treat all animals with respect, kindness, and care.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> Verified Non-Profit Social Initiative
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/competitions" className="hover:text-white transition">Competitions & Guidelines</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition">Approved Artwork Gallery</Link></li>
              <li><Link to="/auctions" className="hover:text-white transition">Charity Art Auctions</Link></li>
              <li><Link to="/donate" className="hover:text-white transition">Support & Donations</Link></li>
              <li><Link to="/impact" className="hover:text-white transition">Impact & Transparency</Link></li>
            </ul>
          </div>

          {/* Community & Engagement */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Ecosystem</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/organizations" className="hover:text-white transition">Animal Welfare NGOs</Link></li>
              <li><Link to="/volunteer" className="hover:text-white transition">Volunteer Network</Link></li>
              <li><Link to="/animal-welfare" className="hover:text-white transition">Educational Resources</Link></li>
              <li><Link to="/stories" className="hover:text-white transition">Rescue Stories & News</Link></li>
              <li><Link to="/events" className="hover:text-white transition">Upcoming Campaigns</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Contact FOA</h4>
            <div className="space-y-3 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" /> contact@foaglobal.org
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" /> New Delhi, India
              </p>
              <div className="pt-2">
                <Link
                  to="/donate"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" /> Donate for Animal Care
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Review Notice */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Friends of Animals (FOA). All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/privacy" className="hover:text-slate-400">Privacy Policy (Subject to Review)</Link>
            <Link to="/terms" className="hover:text-slate-400">Terms of Service</Link>
            <Link to="/contact" className="hover:text-slate-400">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
