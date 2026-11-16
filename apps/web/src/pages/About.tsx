import React from 'react';
import { Heart, Compass, BookOpen, Users, CheckCircle, Shield } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">About Friends of Animals (FOA)</h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          To build a world where compassion for animals is a universal human value, inspiring people to treat all animals with respect, kindness, and care.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            To nurture compassion for animals as a lifelong human value, especially among children and young adults, through awareness, education, creative engagement, community participation, and positive action.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-foa-blue flex items-center justify-center font-bold">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">The Core Idea</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every child is born with natural empathy. By channeling that through drawing, painting, and creative expression in schools, we transform art into tangible aid for injured, abandoned, and working animals across cities and villages.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-8 sm:p-12 rounded-3xl space-y-6">
        <h3 className="text-2xl font-bold">Our 6-Month Strategic Roadmap</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p><strong>Digital Platform Launch:</strong> Safe registration and submission workflows for schools and students.</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p><strong>Pilot Drawing Competitions:</strong> Nationwide drawing, painting, essay, and photography competitions.</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p><strong>School Partnerships:</strong> Institutional networks with thousands of young learners and educators.</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p><strong>Animal-Welfare Network:</strong> Searchable database of verified NGOs, rescuers, and animal clinics.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
