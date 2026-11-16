import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { Flame, Clock, Tag } from 'lucide-react';

export const AuctionsPage: React.FC = () => {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<any[]>('/auctions');
        setAuctions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md mb-2">
          <Flame className="w-3.5 h-3.5" /> 100% of Net Auction Proceeds Fund Animal Medical Care
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fundraising Art Auctions</h1>
        <p className="text-slate-600 mt-1 text-sm">Bid on award-winning physical artworks created by compassionate student artists.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-80 bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      ) : auctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {auctions.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                <img
                  src={item.submission?.assets[0]?.fileUrl || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 px-2.5 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow">
                  Active Auction
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Artist: {item.submission?.participant?.fullName}</p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{item.story}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block uppercase">Current Highest Bid</span>
                    <span className="text-xl font-extrabold text-slate-900">₹{item.currentPrice.toLocaleString()}</span>
                  </div>
                  <Link
                    to={`/auctions/${item.id}`}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Bid Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500">
          No active auctions currently. Check back during the post-competition fundraising window!
        </div>
      )}
    </div>
  );
};
