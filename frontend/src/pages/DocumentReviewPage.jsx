/**
 * DocumentReviewPage.jsx
 * ──────────────────────
 * Two modes:
 *
 * 1. No import_id in URL → "Import Sessions" list.
 * 2. ?import_id=<n>      → two-pane viewer (Resume | JD).
 *
 * Supported document types:
 *   • PDF  → rendered with react-pdf  (install: npm install react-pdf)
 *   • DOCX → rendered with mammoth    (install: npm install mammoth)
 *   • Unknown → download link fallback
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSearch,
  FileText,
  Inbox,
  Loader2,
  Menu,
  RefreshCw,
  User,
} from "lucide-react";

import { documentContentUrl, fetchImportDocuments } from "../lib/api";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

// ── react-pdf worker ──────────────────────────────────────────────────────────
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ── fetch import sessions list ────────────────────────────────────────────────
async function fetchAllImportSessions() {
  const token = localStorage.getItem("recruitai_auth_token");
  const res = await fetch(`${API_BASE}/api/imports`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
const data = await res.json();
return Array.isArray(data) ? { sessions: data } : data;
}

/**
 * Fetch /api/documents/{id}/info to know whether to render as PDF or Word.
 * Returns: { render_as: "pdf" | "word" | "unknown", filename, mime_type }
 */
async function fetchDocInfo(docId) {
  const token = localStorage.getItem("recruitai_auth_token");
  const res = await fetch(`${API_BASE}/api/documents/${docId}/info`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return { render_as: "unknown", filename: "", mime_type: "" };
  return res.json();
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function DocumentReviewShell({ children, sidebarOpen, onOpenSidebar, onCloseSidebar }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/30 backdrop-blur-sm lg:hidden"
          onClick={onCloseSidebar}
        />
      )}
      <button
        type="button"
        onClick={onOpenSidebar}
        className="fixed left-4 top-4 z-40 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu size={16} />
        Menu
      </button>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onLogout={logout} />
      </div>
      <div className="min-h-screen min-w-0 lg:ml-64">{children}</div>
    </div>
  );
}

// ── ImportSessionsList ────────────────────────────────────────────────────────
function ImportSessionsList() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAllImportSessions()
      .then((data) => setSessions(data.sessions || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <DocumentReviewShell
      sidebarOpen={sidebarOpen}
      onOpenSidebar={() => setSidebarOpen(true)}
      onCloseSidebar={() => setSidebarOpen(false)}
    >
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
          <div className="flex-1 min-w-0 pl-14 lg:pl-0">
            <h1 className="text-base font-bold text-slate-900">Document Review</h1>
            <p className="text-xs text-slate-400">Select a Gmail import to review its documents</p>
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
              <button onClick={load} className="mt-4 rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-100">
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
                come back here to review the documents.
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
                          Review →
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
    </DocumentReviewShell>
  );
}

// ── PdfViewer ─────────────────────────────────────────────────────────────────
function PdfViewer({ url, paneWidth }) {
  const [numPages, setNumPages]   = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading]     = useState(true);

  // Reset on new URL
  useEffect(() => {
    setPageNumber(1);
    setNumPages(null);
    setLoadError(null);
    setLoading(true);
  }, [url]);

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* page controls */}
      {numPages && (
        <div className="flex items-center justify-end gap-1 px-1 shrink-0">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[60px] text-center text-xs text-slate-500">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-100">
        {loading && !loadError && (
          <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading PDF…</span>
          </div>
        )}
        {loadError && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-rose-500 px-4">
            <p className="text-sm font-semibold">Failed to load PDF</p>
            <p className="text-xs text-slate-400 text-center">{loadError}</p>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => { setNumPages(numPages); setLoading(false); }}
          onLoadError={(err) => { setLoadError(err.message || "Unknown error"); setLoading(false); }}
          loading={null}
        >
          {!loading && !loadError && (
            <Page
              pageNumber={pageNumber}
              width={paneWidth - 4}
              renderTextLayer
              renderAnnotationLayer
            />
          )}
        </Document>
      </div>
    </div>
  );
}

// ── WordViewer ─────────────────────────────────────────────────────────────────
/**
 * Fetches the raw .docx bytes, converts them to HTML using mammoth,
 * and renders the result in a sandboxed iframe.
 *
 * mammoth must be installed: npm install mammoth
 */
function WordViewer({ url }) {
  const [html, setHtml]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!url) return;
    setHtml(null);
    setError(null);
    setLoading(true);

    (async () => {
      try {
        // Dynamically import mammoth to keep bundle size down
        const mammoth = await import("mammoth");

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });

        if (result.messages?.length) {
          result.messages.forEach((m) =>
            m.type === "error" && console.warn("mammoth:", m.message)
          );
        }

        // Wrap in basic styles so it looks reasonable
        const wrapped = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8"/>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                font-family: "Segoe UI", Arial, sans-serif;
                font-size: 13px;
                line-height: 1.65;
                color: #1e293b;
                padding: 28px 32px;
                background: #fff;
              }
              h1, h2, h3, h4, h5 {
                font-weight: 700;
                margin-top: 1.2em;
                margin-bottom: 0.4em;
                color: #0f172a;
              }
              h1 { font-size: 1.4em; }
              h2 { font-size: 1.2em; }
              h3 { font-size: 1.05em; }
              p  { margin-bottom: 0.6em; }
              ul, ol { padding-left: 1.6em; margin-bottom: 0.6em; }
              li { margin-bottom: 0.25em; }
              table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 1em;
                font-size: 12px;
              }
              td, th {
                border: 1px solid #e2e8f0;
                padding: 6px 10px;
                vertical-align: top;
              }
              th { background: #f1f5f9; font-weight: 600; }
              strong, b { font-weight: 600; }
              a { color: #2563eb; }
              hr { border: none; border-top: 1px solid #e2e8f0; margin: 1em 0; }
            </style>
          </head>
          <body>${result.value}</body>
          </html>
        `;
        setHtml(wrapped);
      } catch (err) {
        setError(err.message || "Failed to render document");
      } finally {
        setLoading(false);
      }
    })();
  }, [url]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Rendering document…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 px-4">
        <p className="text-sm font-semibold text-rose-500">Could not render Word document</p>
        <p className="text-xs text-slate-400 text-center">{error}</p>
        <a
          href={url}
          download
          className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          <Download size={12} /> Download instead
        </a>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title="Word document preview"
      className="flex-1 w-full rounded-xl border border-slate-100"
      style={{ minHeight: "600px" }}
      sandbox="allow-same-origin"
    />
  );
}

// ── DocPane — smart wrapper that picks PDF or Word renderer ───────────────────
/**
 * Props:
 *   title    string   – header label
 *   docId    number   – backend document id (null = no document)
 *   icon     component
 */
function DocPane({ title, docId, icon: Icon }) {
  const containerRef = useRef(null);
  const [paneWidth, setPaneWidth]   = useState(600);
  const [docInfo, setDocInfo]       = useState(null);   // { render_as, filename }
  const [infoLoading, setInfoLoading] = useState(false);

  // Measure pane width for react-pdf
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setPaneWidth(entry.contentRect.width || 600);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Fetch doc info when docId changes
  useEffect(() => {
    if (!docId) { setDocInfo(null); return; }
    setInfoLoading(true);
    fetchDocInfo(docId)
      .then(setDocInfo)
      .catch(() => setDocInfo({ render_as: "unknown" }))
      .finally(() => setInfoLoading(false));
  }, [docId]);

  // Build URLs
  const token    = localStorage.getItem("recruitai_auth_token") ?? "";
  const rawUrl   = docId ? `${API_BASE}/api/documents/${docId}/content?token=${encodeURIComponent(token)}` : null;
  const wordUrl  = rawUrl;  // Word: fetch raw docx bytes on the client
  const pdfUrl   = docId ? `${API_BASE}/api/documents/${docId}/content?as_pdf=true&token=${encodeURIComponent(token)}` : null;

  // ── No document ────────────────────────────────────────────────────────────
  if (!docId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-slate-400">
        {Icon && <Icon size={36} className="opacity-40" />}
        <p className="text-sm">{title} not available</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-1 flex-col min-w-0 gap-3">
      {/* ── Pane header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={16} className="shrink-0 text-blue-600" />}
          <span className="truncate text-sm font-semibold text-slate-700">{title}</span>
          {docInfo && (
            <span className={cn(
              "ml-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              docInfo.render_as === "pdf"   && "bg-red-50 text-red-600 border border-red-100",
              docInfo.render_as === "word"  && "bg-blue-50 text-blue-600 border border-blue-100",
              docInfo.render_as === "unknown" && "bg-slate-100 text-slate-500",
            )}>
              {docInfo.render_as === "pdf"   ? "PDF"
               : docInfo.render_as === "word" ? "DOCX"
               : "File"}
            </span>
          )}
        </div>
        {/* Download button */}
        {rawUrl && (
          <a
            href={rawUrl}
            download={docInfo?.filename || `document_${docId}`}
            title="Download original"
            className="ml-2 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <Download size={15} />
          </a>
        )}
      </div>

      {/* ── Document body ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {infoLoading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : docInfo?.render_as === "word" ? (
          /* ── Word document ── mammoth renders it client-side ──────── */
          <div className="flex flex-col flex-1 overflow-hidden p-1">
            <WordViewer url={wordUrl} />
          </div>
        ) : docInfo?.render_as === "pdf" || !docInfo ? (
          /* ── PDF ── react-pdf ─────────────────────────────────────── */
          <div className="flex flex-col flex-1 overflow-hidden p-3">
            <PdfViewer url={pdfUrl || rawUrl} paneWidth={paneWidth} />
          </div>
        ) : (
          /* ── Unknown / fallback ─────────────────────────────────── */
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-slate-400">
            <FileText size={36} className="opacity-40" />
            <p className="text-sm text-center">
              Cannot preview this file type.
            </p>
            <a
              href={rawUrl}
              download={docInfo?.filename || `document_${docId}`}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 hover:bg-white"
            >
              <Download size={14} /> Download file
            </a>
          </div>
        )}
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

            {/* ── Email — fixed: show address or a soft "no email" note ── */}
            {c.email ? (
              <p className="mt-0.5 text-xs text-slate-400 truncate">{c.email}</p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-300 italic">No email on file</p>
            )}

            {/* File-type badge */}
            {c.resume_doc_id ? (
              <DocTypeBadge docId={c.resume_doc_id} />
            ) : (
              <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 border border-amber-100">
                No file stored
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Small async badge that fetches doc info and shows PDF / DOCX / File.
 * Lightweight — one fetch per candidate, result cached in component state.
 */
function DocTypeBadge({ docId }) {
  const [type, setType] = useState(null);

  useEffect(() => {
    fetchDocInfo(docId)
      .then((info) => setType(info.render_as))
      .catch(() => setType("unknown"));
  }, [docId]);

  if (!type) return null;

  return (
    <span className={cn(
      "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      type === "pdf"   && "bg-red-50 text-red-500 border border-red-100",
      type === "word"  && "bg-blue-50 text-blue-500 border border-blue-100",
      type === "unknown" && "bg-slate-100 text-slate-400",
    )}>
      {type === "pdf" ? "PDF" : type === "word" ? "DOCX" : "File"}
    </span>
  );
}

// ── ViewerPanel ───────────────────────────────────────────────────────────────
function ViewerPanel({ importId }) {
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [jd, setJd]               = useState(null);
  const [selected, setSelected]   = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchImportDocuments(importId)
      .then((data) => {
        const cands = data.candidates || [];
        setCandidates(cands);
        setJd(data.jd || null);
        // Select first candidate that has a stored document
        const first = cands.find((c) => c.resume_doc_id) || cands[0] || null;
        setSelected(first);
      })
      .catch((err) => {
        const message = err.message || "Failed to load documents";
        if (message.toLowerCase().includes("import session not found")) {
          navigate("/document-review", { replace: true });
          return;
        }
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [importId, navigate]);

  const shell = (children) => (
    <DocumentReviewShell
      sidebarOpen={sidebarOpen}
      onOpenSidebar={() => setSidebarOpen(true)}
      onCloseSidebar={() => setSidebarOpen(false)}
    >
      {children}
    </DocumentReviewShell>
  );

  if (loading) return shell(
    <div className="flex min-h-screen items-center justify-center gap-3 text-slate-500">
      <Loader2 size={24} className="animate-spin" />
      <span>Loading documents…</span>
    </div>
  );

  if (error) return shell(
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

  return shell(
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <button
          onClick={() => navigate("/document-review")}
          className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 lg:flex"
        >
          <ArrowLeft size={14} /> All Imports
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-slate-900 truncate">
            Document Review: Import {importId}
          </h1>
          <p className="text-xs text-slate-400">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
            {jd ? " · JD attached" : ""}
          </p>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Candidate sidebar */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white overflow-y-auto lg:flex">
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

        {/* Viewer area — resume left, JD right */}
        <main className="flex min-w-0 flex-1 gap-4 overflow-auto p-5">
          <DocPane
            title={selected ? `${selected.name || "Candidate"} — Resume` : "Resume"}
            docId={selected?.resume_doc_id ?? null}
            icon={User}
          />

          {jd && (
            <DocPane
              title="Job Description"
              docId={jd.id}
              icon={FileText}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ── Top-level router ──────────────────────────────────────────────────────────
export function DocumentReviewPage() {
  const [searchParams] = useSearchParams();
  const importId = searchParams.get("import_id");
  if (!importId) return <ImportSessionsList />;
  return <ViewerPanel importId={Number(importId)} />;
}