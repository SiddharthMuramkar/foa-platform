import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { Search, ShieldCheck } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<any[]>('/gallery');
        setArtworks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = artworks.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.category && a.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Parental Consent Verified & Approved
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Approved Student Artwork Gallery</h1>
          <p className="text-slate-600 mt-1 text-sm">Celebrating empathy and artistic excellence from student creators across India.</p>
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-sm w-full shadow-sm">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search artworks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none text-slate-800"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="aspect-square bg-slate-200 animate-pulse rounded-2xl" />
          <div className="aspect-square bg-slate-200 animate-pulse rounded-2xl" />
          <div className="aspect-square bg-slate-200 animate-pulse rounded-2xl" />
          <div className="aspect-square bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(art => (
            <div key={art.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="relative aspect-square bg-slate-100 overflow-hidden">
                <img
                  src={art.assets[0]?.fileUrl || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=500&q=80'}
                  alt={art.title}
                  className="w-full h-full object-cover transition transform hover:scale-105 duration-300"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm text-[10px] text-white font-medium rounded">
                  {art.category}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{art.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">By {art.participant?.fullName}</p>
                  {art.school && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{art.school.name}, {art.school.city}</p>
                  )}
                  {art.finalRank && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">
                      ★ {art.finalRank}
                    </span>
                  )}
                </div>

                <Link
                  to={`/gallery/${art.id}`}
                  className="block text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition"
                >
                  View Story & Artist Statement
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500">
          No approved artworks found.
        </div>
      )}
    </div>
  );
};
