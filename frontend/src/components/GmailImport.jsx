import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle, FileSearch, RefreshCw } from "lucide-react";
import { fetchGmailResumes } from "../lib/api";

/**
 * GmailImport
 * ───────────
 * Unchanged public API: onImport(candidates) is still called so App.jsx
 * can set gmailCandidates for ranking.
 *
 * New behaviour: after a successful import the backend now returns an
 * import_id alongside the candidates. We navigate the recruiter to
 * /document-review?import_id=<id> via a "Review PDFs" button.
 *
 * If the backend does NOT yet return import_id (old API), the button is
 * simply not shown — nothing breaks.
 */
export function GmailImport({ onImport }) {
  const navigate = useNavigate();

  const [isLoading,    setIsLoading]    = useState(false);
  const [status,       setStatus]       = useState(null);   // 'success' | 'error' | null
  const [fetchedCount, setFetchedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [subject,      setSubject]      = useState("");
  const [importId,     setImportId]     = useState(null);   // set when backend returns one

  const handleSync = async () => {
    setIsLoading(true);
    setStatus(null);
    setErrorMessage("");
    setImportId(null);

    try {
      const response = await fetchGmailResumes(subject);

      // Support both { resumes: [...] } and { candidates: [...] } shapes,
      // plus the direct array shape for backwards compatibility.
      const resumes =
        response.resumes || response.candidates || (Array.isArray(response) ? response : []);

      if (!Array.isArray(resumes)) {
        throw new Error("Invalid response format from Gmail API");
      }

      if (resumes.length === 0) {
        setStatus("error");
        setErrorMessage(
          `No resumes found${subject ? ` with subject "${subject}"` : ""}.`
        );
        setFetchedCount(0);
        return;
      }

      if (onImport && typeof onImport === "function") {
        onImport(resumes);
      }

      setFetchedCount(resumes.length);
      setStatus("success");

      // Capture import_id if the backend returned one
      if (response.import_id) {
        setImportId(response.import_id);
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(error.message || "Failed to fetch resumes from Gmail");
      setFetchedCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header row */}
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
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Syncing…" : "Sync"}
        </button>
      </div>

      {/* Subject filter */}
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

      {/* Success state */}
      {status === "success" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <CheckCircle className="shrink-0 text-emerald-500" size={14} />
            <p className="text-xs text-emerald-700">
              Imported {fetchedCount} resume{fetchedCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Review button — only shown when backend returns an import_id */}
          {importId && (
            <button
              onClick={() => navigate(`/document-review?import_id=${importId}`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <FileSearch size={14} />
              Review PDFs
            </button>
          )}
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
          <AlertCircle className="mt-0.5 shrink-0 text-rose-500" size={14} />
          <p className="text-xs text-rose-700">
            {errorMessage || "Failed to fetch resumes"}
          </p>
        </div>
      )}
    </div>
  );
}