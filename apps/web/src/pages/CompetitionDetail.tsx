import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Calendar, Shield, Award, CheckCircle, FileText, ArrowLeft } from 'lucide-react';

export const CompetitionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<any>(`/competitions/${slug}`);
        setCompetition(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return <div className="max-w-4xl mx-auto py-20 px-4 text-center text-slate-500">Loading competition guidelines...</div>;
  }

  if (!competition) {
    return <div className="max-w-4xl mx-auto py-20 px-4 text-center text-slate-500">Competition not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link to="/competitions" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to All Competitions
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {competition.coverImageUrl && (
          <img src={competition.coverImageUrl} alt={competition.title} className="w-full h-72 object-cover" />
        )}
        <div className="p-8 sm:p-10 space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">
                {competition.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-foa-blue text-xs font-semibold rounded-md">
                Type: {competition.competitionType}
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md">
                Physical Artwork: {competition.physicalArtworkRequired.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {competition.title}
            </h1>
            <p className="text-emerald-700 font-semibold text-sm">Animal Welfare Theme: {competition.animalWelfareTheme}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-foa-blue" />
              <span><strong>Registration:</strong> {new Date(competition.regStartDate).toLocaleDateString()} – {new Date(competition.regEndDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span><strong>Submissions:</strong> {new Date(competition.submissionStartDate).toLocaleDateString()} – {new Date(competition.submissionEndDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Description & Rules */}
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2">About This Challenge</h3>
              <p>{competition.description}</p>
            </div>

            {competition.eligibilityRules && (
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Eligibility Criteria</h3>
                <p>{competition.eligibilityRules}</p>
              </div>
            )}

            {competition.rules && (
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Rules & Guidelines</h3>
                <p>{competition.rules}</p>
              </div>
            )}

            {competition.prizes && (
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Recognition & Rewards</h3>
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 flex items-start gap-3">
                  <Award className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>{competition.prizes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action CTA Box */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-bold text-base">Ready to submit artwork?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Participate either independently or submit your shortlisted school artwork.
              </p>
            </div>
            {user ? (
              <Link
                to={user.role === 'SCHOOL_COORDINATOR' ? '/school-dashboard' : '/participant-dashboard'}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow transition"
              >
                Go to Dashboard to Submit
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow transition"
                >
                  Register to Enter
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
