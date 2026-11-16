import React, { useEffect, useState } from 'react';
import { fetchApi } from '../api/client';
import { School, Award, Upload, CheckCircle2, FileText, Send } from 'lucide-react';

export const SchoolDashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload artwork state
  const [selectedCompId, setSelectedCompId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Group B (Grades 5-8)');
  const [statement, setStatement] = useState('');
  const [schoolRank, setSchoolRank] = useState(1);
  const [fileUrl, setFileUrl] = useState('https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [userProfile, subs, comps] = await Promise.all([
        fetchApi<any>('/auth/me'),
        fetchApi<any[]>('/submissions'),
        fetchApi<any[]>('/competitions')
      ]);
      setProfile(userProfile);
      setSubmissions(subs);
      setCompetitions(comps);
      if (comps.length > 0) setSelectedCompId(comps[0].id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadShortlisted = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res: any = await fetchApi('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          competitionId: selectedCompId,
          category,
          title,
          artistStatement: statement,
          schoolRank: Number(schoolRank),
          fileDataUrl: fileUrl,
          parentConsentOnRecord: true,
          publicDisplayAllowed: true,
          auctionAllowed: true
        })
      });

      setMessage(`Success! Entry submitted with ID: ${res.submissionNumber}`);
      setTitle('');
      setStatement('');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const school = profile?.schoolMemberships?.[0]?.school;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* School Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full">
            {school?.verificationStatus || 'VERIFIED'} INSTITUTION
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {school?.name || 'Partner School Portal'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Code: {school?.code} | Coordinator: {profile?.fullName}</p>
        </div>

        <div className="flex gap-4 text-center">
          <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-semibold block">Uploaded Shortlists</span>
            <span className="text-2xl font-black text-slate-900">{submissions.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Shortlisted Artwork Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" /> Upload School Shortlisted Artwork
          </h3>
          <p className="text-xs text-slate-500">
            Upload the Top 1st, 2nd, or 3rd evaluated entries from your campus drawing competition.
          </p>

          {message && <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl">{message}</div>}
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

          <form onSubmit={handleUploadShortlisted} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">Select Competition</label>
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
                required
              >
                {competitions.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Artwork Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Stray Puppies on Campus"
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold block mb-1">School Rank</label>
                <select
                  value={schoolRank}
                  onChange={(e) => setSchoolRank(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value={1}>1st Place</option>
                  <option value={2}>2nd Place</option>
                  <option value={3}>3rd Place</option>
                  <option value={4}>Top 5</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option>Group A (Grades 1-4)</option>
                  <option>Group B (Grades 5-8)</option>
                  <option>Group C (Grades 9-12)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Artist Empathy Statement</label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Brief sentence from student on why they drew this..."
                rows={2}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Artwork Image URL</label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition"
            >
              Submit Shortlist to FOA
            </button>
          </form>
        </div>

        {/* Shortlisted Submissions List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">School Competition Submissions</h3>

          {submissions.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {submissions.map(sub => (
                <div key={sub.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{sub.title}</h4>
                    <p className="text-slate-500">ID: {sub.submissionNumber} | Rank: {sub.schoolRank ? `#${sub.schoolRank} in School` : 'Participant'}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded font-bold bg-blue-50 text-foa-blue">
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-10 text-center">No shortlisted artworks submitted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
