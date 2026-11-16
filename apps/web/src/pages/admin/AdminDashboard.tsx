import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import { Award, School, Users, FileCheck, AlertCircle, Plus, Check, X, Shield, ArrowUpRight } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COMPETITIONS' | 'SCHOOLS' | 'SUBMISSIONS' | 'TRACKING' | 'AUDIT'>('OVERVIEW');
  const [metrics, setMetrics] = useState<any>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [trackingList, setTrackingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Competition Form state
  const [isCreatingComp, setIsCreatingComp] = useState(false);
  const [compTitle, setCompTitle] = useState('');
  const [compSlug, setCompSlug] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compTheme, setCompTheme] = useState('');
  const [compCover, setCompCover] = useState('https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1000&q=80');
  const [regStart, setRegStart] = useState('2026-11-01');
  const [regEnd, setRegEnd] = useState('2026-11-20');
  const [subStart, setSubStart] = useState('2026-11-05');
  const [subEnd, setSubEnd] = useState('2026-11-25');
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, comp, sch, sub, trk] = await Promise.all([
        fetchApi<any>('/admin/overview'),
        fetchApi<any[]>('/competitions'),
        fetchApi<any[]>('/schools'),
        fetchApi<any[]>('/submissions'),
        fetchApi<any[]>('/physical-tracking')
      ]);
      setMetrics(ov);
      setCompetitions(comp);
      setSchools(sch);
      setSubmissions(sub);
      setTrackingList(trk);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg('');
    setActionErr('');

    try {
      await fetchApi('/competitions', {
        method: 'POST',
        body: JSON.stringify({
          title: compTitle,
          slug: compSlug,
          description: compDesc,
          animalWelfareTheme: compTheme,
          competitionType: 'DRAWING',
          coverImageUrl: compCover,
          regStartDate: new Date(regStart).toISOString(),
          regEndDate: new Date(regEnd).toISOString(),
          submissionStartDate: new Date(subStart).toISOString(),
          submissionEndDate: new Date(subEnd).toISOString(),
          status: 'DRAFT'
        })
      });
      setActionMsg('Draft competition created successfully!');
      setIsCreatingComp(false);
      setCompTitle('');
      setCompSlug('');
      setCompDesc('');
      setCompTheme('');
      await loadData();
    } catch (err: any) {
      setActionErr(err.message);
    }
  };

  const handlePublishCompetition = async (id: string) => {
    try {
      await fetchApi(`/competitions/${id}/publish`, { method: 'POST' });
      setActionMsg('Competition successfully published and live on website!');
      await loadData();
    } catch (err: any) {
      setActionErr(err.message);
    }
  };

  const handleApproveSchool = async (id: string) => {
    try {
      await fetchApi(`/schools/${id}/approve`, { method: 'POST', body: JSON.stringify({ notes: 'Verified officially' }) });
      setActionMsg('School verified and coordinator notified.');
      await loadData();
    } catch (err: any) {
      setActionErr(err.message);
    }
  };

  const handleApproveSubmission = async (id: string) => {
    try {
      await fetchApi(`/submissions/${id}/approve`, { method: 'POST' });
      setActionMsg('Artwork approved for public gallery showcase!');
      await loadData();
    } catch (err: any) {
      setActionErr(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold">FOA ADMIN</span>
            <span className="text-xs text-slate-500 font-medium">Global Management Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Platform Operations</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingComp(true)}
            className="px-4 py-2 bg-foa-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" /> New Competition
          </button>
        </div>
      </div>

      {actionMsg && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">{actionMsg}</div>}
      {actionErr && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{actionErr}</div>}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 transition ${activeTab === 'OVERVIEW' ? 'border-b-2 border-slate-900 text-slate-900' : 'hover:text-slate-800'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('COMPETITIONS')}
          className={`pb-3 transition ${activeTab === 'COMPETITIONS' ? 'border-b-2 border-slate-900 text-slate-900' : 'hover:text-slate-800'}`}
        >
          Competitions ({competitions.length})
        </button>
        <button
          onClick={() => setActiveTab('SCHOOLS')}
          className={`pb-3 transition ${activeTab === 'SCHOOLS' ? 'border-b-2 border-slate-900 text-slate-900' : 'hover:text-slate-800'}`}
        >
          Schools ({schools.length})
        </button>
        <button
          onClick={() => setActiveTab('SUBMISSIONS')}
          className={`pb-3 transition ${activeTab === 'SUBMISSIONS' ? 'border-b-2 border-slate-900 text-slate-900' : 'hover:text-slate-800'}`}
        >
          Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('TRACKING')}
          className={`pb-3 transition ${activeTab === 'TRACKING' ? 'border-b-2 border-slate-900 text-slate-900' : 'hover:text-slate-800'}`}
        >
          Physical Tracking ({trackingList.length})
        </button>
      </div>

      {/* MODAL: Create Competition */}
      {isCreatingComp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900">Create New Competition Draft</h3>
            <form onSubmit={handleCreateCompetition} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Competition Title</label>
                <input
                  type="text"
                  value={compTitle}
                  onChange={(e) => {
                    setCompTitle(e.target.value);
                    setCompSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  placeholder="e.g. Wildlife In Our Backyard"
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Slug (URL friendly)</label>
                <input
                  type="text"
                  value={compSlug}
                  onChange={(e) => setCompSlug(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Animal Welfare Theme</label>
                <input
                  type="text"
                  value={compTheme}
                  onChange={(e) => setCompTheme(e.target.value)}
                  placeholder="e.g. Water pots for birds during peak summer"
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Reg Start Date</label>
                  <input type="date" value={regStart} onChange={(e) => setRegStart(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg" required />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Reg End Date</label>
                  <input type="date" value={regEnd} onChange={(e) => setRegEnd(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Submissions Start</label>
                  <input type="date" value={subStart} onChange={(e) => setSubStart(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg" required />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Submissions End</label>
                  <input type="date" value={subEnd} onChange={(e) => setSubEnd(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg" required />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreatingComp(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-foa-blue text-white rounded-xl font-semibold hover:bg-blue-700"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Competitions</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics?.counts?.totalCompetitions || 0}</p>
              <span className="text-[11px] text-emerald-600 mt-1 block">Active: {metrics?.counts?.activeCompetitions || 0}</span>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Registered Schools</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics?.counts?.totalSchools || 0}</p>
              <span className="text-[11px] text-amber-600 mt-1 block">Pending Review: {metrics?.counts?.pendingSchools || 0}</span>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Submissions</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics?.counts?.totalSubmissions || 0}</p>
              <span className="text-[11px] text-foa-blue mt-1 block">Approved: {metrics?.counts?.approvedSubmissions || 0}</span>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Donations Raised</span>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">₹{metrics?.counts?.totalDonationsAmount?.toLocaleString() || 0}</p>
              <span className="text-[11px] text-slate-500 mt-1 block">Backing animal care</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Live Platform Activity Log</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {metrics?.recentAuditLogs?.map((log: any) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-slate-500 ml-2">by {log.user?.fullName || 'System'}</span>
                  </div>
                  <span className="text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPETITIONS */}
      {activeTab === 'COMPETITIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Type & Theme</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {competitions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">
                    {c.title}
                    <span className="block text-[11px] text-slate-400 font-normal">/{c.slug}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800">{c.competitionType}</span>
                    <span className="block text-slate-500">{c.animalWelfareTheme}</span>
                  </td>
                  <td className="p-4 text-slate-500">
                    Reg: {new Date(c.regStartDate).toLocaleDateString()} - {new Date(c.regEndDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${
                      c.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {c.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublishCompetition(c.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition"
                      >
                        Publish Live
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: SCHOOLS */}
      {activeTab === 'SCHOOLS' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">School & Code</th>
                <th className="p-4">City / State</th>
                <th className="p-4">Coordinator</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">
                    {s.name}
                    <span className="block text-[11px] text-slate-400 font-normal">{s.code}</span>
                  </td>
                  <td className="p-4">{s.city}, {s.state}</td>
                  <td className="p-4">
                    {s.authorizedPersonName}
                    <span className="block text-slate-400">{s.authorizedPersonEmail}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${
                      s.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {s.verificationStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {s.verificationStatus === 'PENDING' && (
                      <button
                        onClick={() => handleApproveSchool(s.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition"
                      >
                        Approve & Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: SUBMISSIONS */}
      {activeTab === 'SUBMISSIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Entry & ID</th>
                <th className="p-4">Participant & School</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Showcase Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">
                    {sub.title}
                    <span className="block text-[11px] text-slate-400 font-normal">{sub.submissionNumber}</span>
                  </td>
                  <td className="p-4">
                    {sub.participant?.fullName}
                    <span className="block text-slate-400">{sub.school?.name || 'Independent Student'}</span>
                  </td>
                  <td className="p-4">{sub.category}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 font-bold rounded text-[10px] bg-blue-50 text-foa-blue">
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {sub.status !== 'APPROVED' ? (
                      <button
                        onClick={() => handleApproveSubmission(sub.id)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition"
                      >
                        Approve for Gallery
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold">Approved ✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: PHYSICAL TRACKING */}
      {activeTab === 'TRACKING' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Submission Artwork</th>
                <th className="p-4">Courier & Tracking</th>
                <th className="p-4">Physical Status</th>
                <th className="p-4">Condition Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trackingList.map((trk) => (
                <tr key={trk.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">
                    {trk.submission?.title}
                    <span className="block text-[11px] text-slate-400">{trk.submission?.participant?.fullName}</span>
                  </td>
                  <td className="p-4">
                    {trk.courierService || 'Not assigned'}
                    <span className="block text-slate-400">{trk.trackingNumber}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 font-bold rounded text-[10px] bg-emerald-50 text-emerald-800">
                      {trk.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">
                    {trk.physicalCondition || 'Pending inspection'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
