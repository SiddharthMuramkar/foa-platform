import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../api/client';
import { Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res: any = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      login(res.token, res.user);

      if (['SUPER_ADMIN', 'FOA_ADMIN', 'COMPETITION_MANAGER'].includes(res.user.role)) {
        navigate('/admin');
      } else if (['SCHOOL_COORDINATOR', 'TEACHER'].includes(res.user.role)) {
        navigate('/school-dashboard');
      } else {
        navigate('/participant-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <img src="/foa-logo.jpg" alt="FOA" className="h-12 w-auto mx-auto rounded" />
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome Back</h2>
          <p className="text-xs text-slate-500">Sign in to manage competitions, schools, or artwork entries</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@foaglobal.org"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-foa-blue"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-foa-blue"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-foa-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
          <p>
            Don't have an account? <Link to="/register" className="text-foa-blue font-semibold hover:underline">Register here</Link>
          </p>
          <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg text-left">
            <strong>Demo Logins:</strong>
            <br />• Admin: <code className="text-slate-600">admin@foaglobal.org</code> / <code className="text-slate-600">Admin@12345</code>
            <br />• Coordinator: <code className="text-slate-600">coordinator@delhipublic.edu</code> / <code className="text-slate-600">School@12345</code>
            <br />• Student: <code className="text-slate-600">aarav.sharma@example.com</code> / <code className="text-slate-600">Student@12345</code>
          </div>
        </div>
      </div>
    </div>
  );
};
