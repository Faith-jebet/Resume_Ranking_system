import React from 'react';
import { Download } from 'lucide-react';
import { cn } from '../lib/utils';

// ── Status config ─────────────────────────────────────────────────────────────
// Adjust these thresholds here if you ever want to tune them.
function getStatus(score) {
  if (score >= 60) return { label: 'Shortlisted', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  if (score >= 40) return { label: 'Waitlisted',  color: 'bg-amber-50   text-amber-700   border border-amber-200'   };
  return             { label: 'Rejected',          color: 'bg-rose-50    text-rose-700    border border-rose-200'    };
}

// ── Score bar colour ──────────────────────────────────────────────────────────
function getBarColor(score) {
  if (score >= 60) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-rose-400';
}

export function CandidateTable({ candidates, onDownloadReport }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-4 gap-3">
        <h3 className="text-base font-semibold text-slate-900">Candidate Ranking</h3>
        <button
          onClick={onDownloadReport}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 w-full sm:w-auto"
        >
          <Download size={15} />
          <span className="sm:inline">Export PDF</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-3 text-xs uppercase tracking-wider text-slate-500">Candidate</th>
              <th className="px-6 py-3 text-xs uppercase tracking-wider text-slate-500">Match</th>
              <th className="px-6 py-3 text-xs uppercase tracking-wider text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((candidate, idx) => {
              // ── Normalise field names ──────────────────────────────────────
              // Backend sends candidate_name / match_score; support both shapes.
              const name  = candidate.candidate_name || candidate.name  || 'Unknown Candidate';
              const email = candidate.email          || '—';
              const score = candidate.match_score    ?? candidate.score ?? 0;
              const isDomainMismatch = candidate.error === 'DOMAIN_MISMATCH';

              const { label, color } = isDomainMismatch
                ? { label: 'Wrong Domain', color: 'bg-purple-50 text-purple-700 border border-purple-200' }
                : getStatus(score);

              const barColor = isDomainMismatch ? 'bg-purple-300' : getBarColor(score);

              return (
                <tr key={idx} className="transition-colors hover:bg-slate-50">
                  {/* Candidate */}
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{email}</p>
                    {isDomainMismatch && (
                      <p className="mt-0.5 text-xs text-purple-500">
                        ⚠ {candidate.justification || 'Domain does not match this role'}
                      </p>
                    )}
                  </td>

                  {/* Match score */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={cn('h-full rounded-full transition-all', barColor)}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-sm font-medium text-slate-700">
                        {score}%
                      </span>
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="px-6 py-4">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', color)}>
                      {label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden divide-y divide-slate-100">
        {candidates.map((candidate, idx) => {
          const name  = candidate.candidate_name || candidate.name  || 'Unknown Candidate';
          const email = candidate.email          || '—';
          const score = candidate.match_score    ?? candidate.score ?? 0;
          const isDomainMismatch = candidate.error === 'DOMAIN_MISMATCH';

          const { label, color } = isDomainMismatch
            ? { label: 'Wrong Domain', color: 'bg-purple-50 text-purple-700 border border-purple-200' }
            : getStatus(score);

          const barColor = isDomainMismatch ? 'bg-purple-300' : getBarColor(score);

          return (
            <div key={idx} className="p-4 space-y-3">
              {/* Header with name and status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                  <p className="text-xs text-slate-500 truncate">{email}</p>
                  {isDomainMismatch && (
                    <p className="mt-1 text-xs text-purple-500">
                      ⚠ {candidate.justification || 'Domain does not match this role'}
                    </p>
                  )}
                </div>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0', color)}>
                  {label}
                </span>
              </div>
              
              {/* Score bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Match Score</span>
                  <span className="text-sm font-medium text-slate-700">{score}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={cn('h-full rounded-full transition-all', barColor)}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 sm:gap-3 border-t border-slate-100 px-4 sm:px-6 py-3">
        {[
          { label: 'Shortlisted', color: 'bg-emerald-500', range: '60–100%' },
          { label: 'Waitlisted',  color: 'bg-amber-500',   range: '40–59%'  },
          { label: 'Rejected',    color: 'bg-rose-400',    range: '0–39%'   },
        ].map(({ label, color, range }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={cn('h-2 w-2 rounded-full shrink-0', color)} />
            <span className="shrink-0">{label}</span> 
            <span className="text-slate-400 hidden sm:inline">({range})</span>
          </div>
        ))}
      </div>
    </div>
  );
}