import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import { CheckCircle2, XCircle, Award, ArrowLeft } from 'lucide-react';

export const VerifyCertificatePage: React.FC = () => {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        const data = await fetchApi<any>(`/certificates/verify/${certificateNumber}`);
        setCert(data);
      } catch (err: any) {
        setError(err.message || 'Invalid certificate');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [certificateNumber]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <Link to="/" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to FOA Home
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6">
        <img src="/foa-logo.jpg" alt="FOA" className="h-14 w-auto mx-auto rounded" />

        {loading ? (
          <p className="text-sm text-slate-500">Verifying certificate against FOA official registry...</p>
        ) : cert ? (
          <div className="space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
              Authentic Verified Certificate
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">{cert.awardTitle}</h1>
            <p className="text-sm text-slate-600">
              Awarded to <strong className="text-slate-900 font-bold">{cert.recipientName}</strong>
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-1 text-left max-w-sm mx-auto">
              <p><strong>Competition:</strong> {cert.competitionTitle}</p>
              {cert.category && <p><strong>Category:</strong> {cert.category}</p>}
              <p><strong>Serial Number:</strong> {cert.certificateNumber}</p>
              <p><strong>Issue Date:</strong> {new Date(cert.issueDate).toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Certificate Not Found</h2>
            <p className="text-xs text-slate-500">
              The certificate ID <code>{certificateNumber}</code> could not be validated or has been revoked.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
