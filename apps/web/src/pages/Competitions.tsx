import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { Search, Calendar, Award } from 'lucide-react';

export const CompetitionsPage: React.FC = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<any[]>('/competitions');
        setCompetitions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = competitions.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.animalWelfareTheme.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Active & Upcoming Competitions</h1>
        <p className="text-slate-600 mt-2">Discover creative challenges designed to foster compassion, artistic skill, and animal well-being.</p>
      </div>

      <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-md shadow-sm">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Search by title or theme..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none text-slate-800"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(comp => (
            <div key={comp.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
              {comp.coverImageUrl && (
                <img src={comp.coverImageUrl} alt={comp.title} className="h-48 w-full object-cover" />
              )}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700">
                      {comp.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">{comp.competitionType}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">{comp.title}</h3>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Theme: {comp.animalWelfareTheme}</p>
                  <p className="text-xs text-slate-600 mt-3 line-clamp-3">{comp.description}</p>
                </div>
                
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center text-xs text-slate-500 gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Closes: {new Date(comp.regEndDate).toLocaleDateString()}</span>
                  </div>
                  <Link
                    to={`/competitions/${comp.slug}`}
                    className="block text-center py-2.5 bg-foa-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
                  >
                    View Guidelines & Submit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500">
          No competitions matched your search criteria.
        </div>
      )}
    </div>
  );
};
