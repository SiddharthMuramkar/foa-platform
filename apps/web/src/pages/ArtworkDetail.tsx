import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { ArrowLeft, Award, Heart, ShieldCheck, Share2 } from 'lucide-react';

export const ArtworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<any>(`/gallery/${id}`);
        setArtwork(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="max-w-4xl mx-auto py-20 text-center text-slate-500">Loading artwork...</div>;
  if (!artwork) return <div className="max-w-4xl mx-auto py-20 text-center text-slate-500">Artwork not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <Link to="/gallery" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Gallery
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-inner">
            <img
              src={artwork.assets[0]?.fileUrl || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80'}
              alt={artwork.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="w-4 h-4" /> Guardian Consent Verified
            </span>
            <span>Ref: {artwork.submissionNumber}</span>
          </div>
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="px-2.5 py-1 bg-blue-50 text-foa-blue text-xs font-semibold rounded-md">
                {artwork.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{artwork.title}</h1>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                Artist: <span className="text-slate-900">{artwork.participant?.fullName}</span>
              </p>
              {artwork.school && (
                <p className="text-xs text-slate-500 mt-0.5">{artwork.school.name}, {artwork.school.city}</p>
              )}
            </div>

            {artwork.finalRank && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-900 flex items-center gap-2 text-xs font-bold">
                <Award className="w-4 h-4 text-amber-600" />
                <span>{artwork.finalRank}</span>
              </div>
            )}

            {artwork.artistStatement && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Message & Concept</h4>
                <p className="text-sm text-slate-600 italic bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                  "{artwork.artistStatement}"
                </p>
              </div>
            )}

            {artwork.description && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{artwork.description}</p>
              </div>
            )}
          </div>

          {/* Auction status hook if listed */}
          {artwork.auctionListing ? (
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-semibold uppercase tracking-wider">Fundraising Auction</span>
                <span className="text-slate-400">Status: {artwork.auctionListing.status}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold">₹{artwork.auctionListing.currentPrice.toLocaleString()}</span>
                <span className="text-xs text-slate-400">current bid</span>
              </div>
              <Link
                to={`/auctions/${artwork.auctionListing.id}`}
                className="block text-center py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                Place a Bid & Support Rescues
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
              Artwork archived in FOA Digital Library for compassion outreach.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
