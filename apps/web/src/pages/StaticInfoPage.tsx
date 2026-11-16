import React from 'react';
import { Heart, Compass, Shield, Users, Mail, FileCheck } from 'lucide-react';

interface InfoPageProps {
  title: string;
  subtitle: string;
  tag: string;
  content: string;
  items?: { title: string; desc: string }[];
}

export const StaticInfoPage: React.FC<InfoPageProps> = ({ title, subtitle, tag, content, items }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="space-y-3">
        <span className="px-3 py-1 bg-blue-50 text-foa-blue text-xs font-bold rounded-full uppercase tracking-wider">
          {tag}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-slate-600 text-sm leading-relaxed">{subtitle}</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
        <p>{content}</p>

        {items && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {items.map((it, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900">{it.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{it.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
