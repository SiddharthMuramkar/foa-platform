import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { ArrowRight, Heart, Award, Shield, Palette, Users, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [compData, artData] = await Promise.all([
          fetchApi<any[]>('/competitions'),
          fetchApi<any[]>('/gallery')
        ]);
        setCompetitions(compData.slice(0, 3));
        setArtworks(artData.slice(0, 4));
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-24 sm:py-32">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Nationwide Student Movement
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Nurturing <span className="text-emerald-400">Compassion</span> for Animals Through Creative Expression.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Friends of Animals (FOA) connects schools, young artists, and rescuers to build universal empathy. Winning artworks are auctioned to fund animal rescue, medical treatment, and shelter operations.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/competitions"
                className="px-6 py-3.5 rounded-xl bg-foa-blue hover:bg-blue-600 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition transform hover:-translate-y-0.5"
              >
                Explore Competitions <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold border border-slate-700 transition"
              >
                Register as School or Student
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tri-Pillar Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-xs font-bold tracking-widest text-foa-blue uppercase">How FOA Works</h2>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">From Student Canvas to Rescued Animals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 hover:border-foa-blue/50 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-foa-blue flex items-center justify-center font-bold text-xl">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">1. Creative Competitions</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Schools and independent students explore animal empathy through painting, drawing, and storytelling guided by FOA frameworks.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 hover:border-emerald-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">2. Judging & Verification</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Multi-tiered evaluation by school coordinators and FOA central juries. Shortlisted original artworks are verified with parental consent.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 hover:border-rose-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">3. Charity Auctions & Aid</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Approved student artworks are auctioned to donors and corporate CSRs to fund veterinary care, ambulances, and animal shelters.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Competitions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-xs font-bold tracking-widest text-emerald-600 uppercase">Opportunities to Participate</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Active Competitions</p>
          </div>
          <Link to="/competitions" className="text-sm font-semibold text-foa-blue hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
            <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
          </div>
        ) : competitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {competitions.map((comp) => (
              <div key={comp.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
                {comp.coverImageUrl && (
                  <img src={comp.coverImageUrl} alt={comp.title} className="h-44 w-full object-cover" />
                )}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700">
                      {comp.status.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2 line-clamp-2">{comp.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">Theme: {comp.animalWelfareTheme}</p>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-3">{comp.description}</p>
                  </div>
                  <Link
                    to={`/competitions/${comp.slug}`}
                    className="w-full text-center py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
                  >
                    View Details & Guidelines
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            No active competitions right now. Check back soon!
          </div>
        )}
      </section>

      {/* Selected Approved Artworks */}
      {artworks.length > 0 && (
        <section className="bg-slate-100/70 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xs font-bold tracking-widest text-foa-blue uppercase">Student Gallery</h2>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Approved Young Voices</p>
              </div>
              <Link to="/gallery" className="text-sm font-semibold text-foa-blue hover:underline flex items-center gap-1">
                Explore gallery <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {artworks.map((art) => (
                <div key={art.id} className="bg-white rounded-xl overflow-hidden border border-slate-200/90 shadow-sm flex flex-col">
                  <div className="relative aspect-square bg-slate-100">
                    <img
                      src={art.assets[0]?.fileUrl || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=500&q=80'}
                      alt={art.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm text-[10px] text-white rounded">
                      FOA Verified
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{art.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">By {art.participant?.fullName}</p>
                      {art.finalRank && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded">
                          {art.finalRank}
                        </span>
                      )}
                    </div>
                    <Link to={`/gallery/${art.id}`} className="mt-3 text-xs text-foa-blue font-semibold hover:underline">
                      View story →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Institutional Call To Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-3xl p-8 sm:p-14 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              Are you a School Principal or Art Teacher?
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Register your institution to conduct internal drawing competitions. We provide standardized judging frameworks, student participation certificates, and nationwide recognition for your campus.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              to="/register"
              className="px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-bold text-center text-sm shadow-md transition"
            >
              Register Your School
            </Link>
            <Link
              to="/about"
              className="px-6 py-3.5 bg-emerald-700/50 hover:bg-emerald-700 text-white rounded-xl font-semibold text-center text-sm border border-emerald-500/30 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
