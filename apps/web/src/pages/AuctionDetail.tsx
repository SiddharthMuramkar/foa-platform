import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Flame, ShieldCheck, History } from 'lucide-react';

export const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [auction, setAuction] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const data = await fetchApi<any>(`/auctions/${id}`);
      setAuction(data);
      setBidAmount(data.currentPrice + 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await fetchApi(`/auctions/${id}/bid`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(bidAmount) })
      });
      setMessage(`Success! Your bid of ₹${bidAmount.toLocaleString()} is now the highest.`);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto py-20 text-center text-slate-500">Loading auction details...</div>;
  if (!auction) return <div className="max-w-4xl mx-auto py-20 text-center text-slate-500">Auction not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <Link to="/auctions" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to All Auctions
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={auction.submission?.assets[0]?.fileUrl || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80'}
              alt={auction.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Original physical artwork verified in FOA custody. Ready for insured courier delivery.</span>
          </div>
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-md">
              <Flame className="w-3.5 h-3.5" /> Active Charity Bidding
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{auction.title}</h1>
            <p className="text-xs text-slate-500">Original Artist: {auction.submission?.participant?.fullName}</p>
            <p className="text-sm text-slate-600 leading-relaxed">{auction.story}</p>
          </div>

          <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-slate-400 block uppercase">Current High Bid</span>
                <span className="text-3xl font-extrabold text-emerald-400">₹{auction.currentPrice.toLocaleString()}</span>
              </div>
              <span className="text-xs text-slate-400">Ends: {new Date(auction.endsAt).toLocaleDateString()}</span>
            </div>

            {user ? (
              <form onSubmit={handleBid} className="space-y-3">
                <label className="text-xs text-slate-300 block">Enter your bid amount (₹):</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={auction.currentPrice + 100}
                    step="100"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white font-semibold text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition"
                  >
                    Place Bid
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-2">
                <Link to="/login" className="text-xs font-bold text-emerald-400 hover:underline">
                  Log in to your account to place a bid →
                </Link>
              </div>
            )}

            {message && <p className="text-xs text-emerald-400 font-semibold">{message}</p>}
            {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}
          </div>

          {/* Bid History */}
          {auction.bids && auction.bids.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Recent Bids
              </h4>
              <div className="divide-y divide-slate-100 text-xs">
                {auction.bids.map((b: any) => (
                  <div key={b.id} className="py-1.5 flex justify-between text-slate-500">
                    <span>₹{b.amount.toLocaleString()}</span>
                    <span>{new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
