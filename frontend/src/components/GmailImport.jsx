import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchGmailResumes } from '../lib/api';

export function GmailImport({ onImport }) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [subject, setSubject] = useState('');

  const handleSync = async () => {
    setIsLoading(true);
    setStatus(null);
    setErrorMessage('');

    try {
      const response = await fetchGmailResumes(subject);
      const resumes = response.resumes || response.candidates || response;

      if (!Array.isArray(resumes)) throw new Error('Invalid response format from Gmail API');

      if (resumes.length === 0) {
        setStatus('error');
        setErrorMessage(`No resumes found with subject "${subject}".`);
        setFetchedCount(0);
        return;
      }

      if (onImport && typeof onImport === 'function') {
        onImport(resumes);
        setFetchedCount(resumes.length);
        setStatus('success');
      } else {
        throw new Error('onImport callback not provided');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to fetch resumes from Gmail');
      setFetchedCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Gmail Integration</p>
          <p className="mt-0.5 text-xs text-slate-500">Scan your inbox for received resumes</p>
        </div>
        <button
          onClick={handleSync}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-500">Subject filter</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Resume Submission"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          disabled={isLoading}
        />
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <CheckCircle className="flex-shrink-0 text-emerald-500" size={14} />
          <p className="text-xs text-emerald-700">Imported {fetchedCount} resume(s)</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
          <AlertCircle className="mt-0.5 flex-shrink-0 text-rose-500" size={14} />
          <p className="text-xs text-rose-700">{errorMessage || 'Failed to fetch resumes'}</p>
        </div>
      )}
    </div>
  );
}