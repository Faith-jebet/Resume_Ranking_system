/**
 * DocumentReviewPage.jsx
 * ──────────────────────
 * Two modes:
 *
 * 1. No import_id in URL → show "Import Sessions" list so recruiter can
 *    pick one (or is told to run a Gmail sync first).
 *
 * 2. ?import_id=<n> in URL → show the two-pane PDF viewer for that session.
 *
 * Install react-pdf before using:
 *   npm install react-pdf
 */

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  FileText,
  Inbox,
  Loader2,
  RefreshCw,
  User,
} from "lucide-react";

import { documentContentUrl, fetchImportDocuments } from "../lib/api";

// ── react-pdf worker ─────────────────────────────────────────────────────────
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitai-backend-418779851337.us-central1.run.app";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ── fetch all import sessions from backend ────────────────────────────────────
async function fetchAllImportSessions() {
  const token = localStorage.getItem("recruitai_auth_token");
  const res = await fetch(`${API_BASE}/api/imports`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json(); // expects { sessions: [...] }
}

// ── ImportSessionsList — shown when no import_id in URL ──────────────────────

function ImportSessionsList() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchAllImportSessions()
      .then((data) => setSessions(data.sessions || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-slate-900">Document Review</h1>
          <p className="text-xs text-slate-400">Select a Gmail import to review its PDFs</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-white"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-20 text-slate-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Loading import history…</span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm font-semibold text-rose-600">Could not load import sessions</p>
            <p className="mt-1 text-xs text-rose-400">{error}</p>
            <button
              onClick={load}
              className="mt-4 rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-100"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-slate-400">
            <Inbox size={40} className="opacity-30" />
            <p className="text-sm font-medium">No Gmail imports yet</p>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              Go to the Dashboard and run a Gmail Sync. After importing resumes,
              come back here to review the PDFs.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              <ArrowLeft size={14} /> Go to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => navigate(`/document-review?import_id=${s.id}`)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                        <FileSearch size={18} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {s.subject_filter ? `"${s.subject_filter}"` : "Gmail Import"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {s.fetched_count ?? "?"} resume{(s.fetched_count ?? 0) !== 1 ? "s" : ""} imported
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-block rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        Review PDFs →
                      </span>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {s.created_at ? new Date(s.created_at).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

// ── PdfPane ───────────────────────────────────────────────────────────────────

function PdfPane({ title, url, icon: Icon }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const [paneWidth, setPaneWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setPaneWidth(entry.contentRect.width || 600);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setPageNumber(1);
    setNumPages(null);
    setError(null);
    setLoading(true);
  }, [url]);

  if (!url) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-slate-400">
        {Icon && <Icon size={36} className="opacity-40" />}
        <p className="text-sm">{title} not available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 gap-3">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={16} className="shrink-0 text-blue-600" />}
          <span className="truncate text-sm font-semibold text-slate-700">{title}</span>
        </div>
        {numPages && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[60px] text-center text-xs text-slate-500">
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {loading && (
          <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading PDF…</span>
          </div>
        )}
        {error && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-rose-500">
            <p className="text-sm font-semibold">Failed to load PDF</p>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); }}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => { setNumPages(numPages); setLoading(false); }}
          onLoadError={(err) => { setError(err.message || "Unknown error"); setLoading(false); }}
          loading={null}
        >
          {!loading && !error && (
            <Page
              pageNumber={pageNumber}
              width={paneWidth - 2}
              renderTextLayer
              renderAnnotationLayer
            />
          )}
        </Document>
      </div>
    </div>
  );
}

// ── CandidateList ─────────────────────────────────────────────────────────────

function CandidateList({ candidates, selectedId, onSelect }) {
  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-slate-400">
        <User size={32} className="opacity-30" />
        <p className="text-sm">No candidates</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1 p-2">
      {candidates.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => onSelect(c)}
            className={cn(
              "w-full rounded-xl px-3 py-3 text-left transition-colors",
              selectedId === c.id
                ? "bg-blue-50 border border-blue-100 text-blue-800"
                : "hover:bg-slate-50 text-slate-700"
            )}
          >
            <p className="text-sm font-semibold truncate">{c.name || "Unknown"}</p>
            <p className="mt-0.5 text-xs text-slate-400 truncate">{c.email || "No email"}</p>
            {!c.resume_doc_id && (
              <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 border border-amber-100">
                No PDF stored
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

// ── ViewerPanel — shown when import_id is in URL ──────────────────────────────

function ViewerPanel({ importId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [jd, setJd] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchImportDocuments(importId)
      .then((data) => {
        setCandidates(data.candidates || []);
        setJd(data.jd || null);
        const first = (data.candidates || []).find((c) => c.resume_doc_id);
        setSelected(first || data.candidates?.[0] || null);
      })
      .catch((err) => setError(err.message || "Failed to load documents"))
      .finally(() => setLoading(false));
  }, [importId]);

  const resumeUrl = selected?.resume_doc_id ? documentContentUrl(selected.resume_doc_id) : null;
  const jdUrl = jd?.id ? documentContentUrl(jd.id) : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-slate-500">
        <Loader2 size={24} className="animate-spin" />
        <span>Loading documents…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-rose-500">Error</p>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          onClick={() => navigate("/document-review")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Back to imports
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <button
          onClick={() => navigate("/document-review")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> All Imports
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-slate-900 truncate">
            Document Review — Import #{importId}
          </h1>
          <p className="text-xs text-slate-400">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white overflow-y-auto">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Candidates
            </p>
          </div>
          <CandidateList
            candidates={candidates}
            selectedId={selected?.id}
            onSelect={setSelected}
          />
        </aside>

        <main className="flex min-w-0 flex-1 gap-4 overflow-auto p-5">
          <PdfPane
            title={selected ? `${selected.name || "Candidate"} — Resume` : "Resume"}
            url={resumeUrl}
            icon={User}
          />
          <PdfPane title="Job Description" url={jdUrl} icon={FileText} />
        </main>
      </div>
    </div>
  );
}

// ── DocumentReviewPage — top-level router ─────────────────────────────────────

export function DocumentReviewPage() {
  const [searchParams] = useSearchParams();
  const importId = searchParams.get("import_id");

  if (!importId) return <ImportSessionsList />;
  return <ViewerPanel importId={Number(importId)} />;
}