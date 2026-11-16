import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../api/client';
import { School, User } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [roleType, setRoleType] = useState<'PARTICIPANT' | 'SCHOOL'>('PARTICIPANT');

  // Student form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(true);

  // School form
  const [schoolName, setSchoolName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [principalPhone, setPrincipalPhone] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorEmail, setCoordinatorEmail] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res: any = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          password,
          role: 'PARTICIPANT',
          guardianName,
          guardianConsent
        })
      });

      login(res.token, res.user);
      navigate('/participant-dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await fetchApi('/schools', {
        method: 'POST',
        body: JSON.stringify({
          name: schoolName,
          addressLine1,
          city,
          state,
          postalCode,
          country: 'India',
          principalName,
          principalEmail,
          principalPhone,
          authorizedPersonName: coordinatorName,
          authorizedPersonEmail: coordinatorEmail,
          authorizedPersonPhone: coordinatorPhone,
          expectedParticipants: 100
        })
      });

      setMessage('School application registered successfully! FOA Administrators will review and verify your institution.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900">Join the FOA Platform</h1>
          <p className="text-xs text-slate-500">Choose your registration pathway below</p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setRoleType('PARTICIPANT')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
              roleType === 'PARTICIPANT' ? 'bg-white text-foa-blue shadow' : 'text-slate-600'
            }`}
          >
            <User className="w-4 h-4" /> Individual Student / Artist
          </button>
          <button
            onClick={() => setRoleType('SCHOOL')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
              roleType === 'SCHOOL' ? 'bg-white text-emerald-700 shadow' : 'text-slate-600'
            }`}
          >
            <School className="w-4 h-4" /> School / Institution Registration
          </button>
        </div>

        {error && <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{error}</div>}
        {message && <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">{message}</div>}

        {roleType === 'PARTICIPANT' ? (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Student Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Diya Nambiar"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-foa-blue"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. diya@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-foa-blue"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Set Password (min 8 chars)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-foa-blue"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Parent / Guardian Name (for minors)</label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="e.g. Anita Nambiar"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-foa-blue"
              />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="consent"
                checked={guardianConsent}
                onChange={(e) => setGuardianConsent(e.target.checked)}
                className="mt-1 rounded text-foa-blue"
              />
              <label htmlFor="consent" className="text-xs text-slate-600 leading-normal">
                I confirm that my parent or legal guardian authorizes my participation and entry of artwork into FOA competitions.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-foa-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              {loading ? 'Creating Account...' : 'Complete Student Registration'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSchoolSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">School / Institution Official Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Modern School, Barakhamba Road"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Street Address</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="e.g. Barakhamba Road, Connaught Place"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New Delhi"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Delhi"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pin Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="110001"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">School Leadership Details</h4>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="Principal Name"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
                <input
                  type="email"
                  value={principalEmail}
                  onChange={(e) => setPrincipalEmail(e.target.value)}
                  placeholder="Principal Email"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
                <input
                  type="tel"
                  value={principalPhone}
                  onChange={(e) => setPrincipalPhone(e.target.value)}
                  placeholder="Principal Phone"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Art Coordinator / Authorized Teacher</h4>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={coordinatorName}
                  onChange={(e) => setCoordinatorName(e.target.value)}
                  placeholder="Coordinator Name"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
                <input
                  type="email"
                  value={coordinatorEmail}
                  onChange={(e) => setCoordinatorEmail(e.target.value)}
                  placeholder="Coordinator Email"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
                <input
                  type="tel"
                  value={coordinatorPhone}
                  onChange={(e) => setCoordinatorPhone(e.target.value)}
                  placeholder="Coordinator Phone"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition"
            >
              {loading ? 'Submitting...' : 'Register School for Verification'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already registered? <Link to="/login" className="text-foa-blue font-semibold hover:underline">Log in here</Link>
        </div>
      </div>
    </div>
  );
};
