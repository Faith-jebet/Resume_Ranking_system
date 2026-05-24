import React from 'react';
import { Download } from 'lucide-react';
import { cn } from '../lib/utils';

export function CandidateTable({ candidates, onDownloadReport }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">Candidate Ranking</h3>
        <button
          onClick={onDownloadReport}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          <Download size={15} />
          Export PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-3 text-xs uppercase tracking-wider text-slate-500">Candidate</th>
              <th className="px-6 py-3 text-xs uppercase tracking-wider text-slate-500">Match</th>
              <th className="px-6 py-3 text-xs uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-slate-500">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((candidate, idx) => (
              <tr key={idx} className="transition-colors hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-900">{candidate.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{candidate.email}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-700"
                        style={{ width: `${candidate.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-blue-700">{candidate.score}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs",
                    candidate.score >= 85 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    candidate.score >= 70 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                    "bg-rose-50 text-rose-700 border border-rose-200"
                  )}>
                    {candidate.score >= 85 ? 'Strong Match' : candidate.score >= 70 ? 'Waitlist' : 'Rejected'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                    ★
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}