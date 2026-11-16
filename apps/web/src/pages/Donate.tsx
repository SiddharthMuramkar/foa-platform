import React, { useState } from 'react';
import { fetchApi } from '../api/client';
import { Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const DonatePage: React.FC = () => {
  const [amount, setAmount] = useState<number>(2000);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [purpose, setPurpose] = useState('Animal Medical Rescue & Treatment');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await fetchApi('/donations', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount),
          donorName,
          donorEmail,
          purpose
        })
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded-full">
          <Heart className="w-3.5 h-3.5 fill-current" /> 100% Direct Impact for Animals
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Support Compassion in Action</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Your donations support emergency medical treatments, street dog feeding drives, mobile animal ambulances, and free empathy education in schools.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm max-w-2xl mx-auto">
        {submitted ? (
          <div className="text-center py-10 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h3 className="text-2xl font-bold text-slate-900">Thank you for your generous support!</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Your contribution of ₹{amount.toLocaleString()} has been securely recorded. An official receipt has been issued to {donorEmail}.
            </p>
            <button
              onClick={() => { setSubmitted(false); setDonorName(''); setDonorEmail(''); }}
              className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Make Another Donation
            </button>
          </div>
        ) : (
          <form onSubmit={handleDonate} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Select Donation Amount</label>
              <div className="grid grid-cols-4 gap-3">
                {[500, 1000, 2000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-3 rounded-xl font-bold text-sm border transition ${
                      amount === val ? 'bg-rose-50 border-rose-500 text-rose-600' : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Custom Amount (₹)</label>
              <input
                type="number"
                min="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Priyanshu Sharma"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="e.g. donor@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Allocate Impact Initiative</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-rose-500"
              >
                <option>Animal Medical Rescue & Treatment</option>
                <option>Street Animal Feeding & Nutrition</option>
                <option>School Compassion Outreach & Creative Awards</option>
                <option>Emergency Animal Shelter Operations</option>
              </select>
            </div>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/20 transition"
            >
              {loading ? 'Processing...' : `Donate ₹${amount.toLocaleString()} for Animal Welfare`}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tested with development payment adapter. No actual card charged.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
