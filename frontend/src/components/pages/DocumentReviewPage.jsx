import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Share2,
  MoreHorizontal,
  User,
  Users,
  Calendar,
  Menu,
} from "lucide-react";

import { fetchImportDocuments, getStoredToken, API_BASE } from "../../lib/api";
import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";

// ── Worker ────────────────────────────────────────────────────────────────────
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ── API helpers — use centralized API_BASE and token from lib/api.js ──────────
async function fetchAllImportSessions() {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}/api/imports`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? { sessions: data } : data;
}

async function fetchDocInfo(docId) {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}/api/documents/${docId}/info`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return { render_as: "unknown", filename: "", mime_type: "" };
  return res.json();
}

function authToken() {
  return getStoredToken() ?? "";
}

// ── Import List View ─────────────────────────────────────────────────────────
function ImportListView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetchAllImportSessions()
      .then((data) => setSessions(data.sessions || []))
      .catch((err) => setError(err.message || "Failed to load import sessions"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Document Review
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed max-w-2xl">
            Review resumes and job descriptions from your Gmail import sessions. Select a session to view candidate documents side-by-side with job requirements.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-red-600" />
            <p className="text-sm font-semibold">Loading import sessions...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-red-600 gap-3">
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 text-center bg-white border border-gray-200 rounded-2xl p-6 shadow-sm gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
              <FileText size={22} className="text-gray-400" />
            </div>
            <div className="max-w-md">
              <p className="text-sm font-bold text-gray-800">No import sessions found</p>
              <p className="text-xs text-gray-400 mt-1">
                You haven't imported any resumes yet. Go to the Job Vacancy page and fetch resumes from Gmail to review them here.
              </p>
            </div>
            <button
              onClick={() => navigate("/job-vacancy")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm uppercase tracking-wider"
            >
              Rank Job
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-2">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600">
                Import Sessions
              </h2>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {sessions.map((session) => {
                const label = session.subject_filter
                  ? session.subject_filter.replace(/^["']|["']$/g, "")
                  : session.job_title || "Gmail Import";
                
                return (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/document-review?import_id=${session.id}`)}
                    className="group bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 transition shadow-sm hover:shadow cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition truncate">
                        {label}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(session.created_at).toLocaleDateString(undefined, {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                          {" · "}
                          {new Date(session.created_at).toLocaleTimeString(undefined, {
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {session.fetched_count ?? 0} candidates
                        </span>
                        <span>·</span>
                        <span>Import #{session.id}</span>
                      </div>
                    </div>

                    <button
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700 transition"
                    >
                      Review Documents <ChevronRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────
export function DocumentReviewPage() {
  const [searchParams] = useSearchParams();
  const importId = searchParams.get("import_id");

  if (!importId) {
    return <ImportListView />;
  }
  
  return <ViewerPanel importId={Number(importId)} />;
}


// ── PdfViewer ─────────────────────────────────────────────────────────────────
function PdfViewer({ url, paneWidth }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageNumber(1);
    setNumPages(null);
    setLoadError(null);
    setLoading(true);
  }, [url]);

  return (
    <div className="flex flex-col h-full">
      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto">
        {loading && !loadError && (
          <div className="flex h-40 items-center justify-center gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading PDF…</span>
          </div>
        )}
        {loadError && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-red-500 px-4">
            <p className="text-sm font-semibold">Failed to load PDF</p>
            <p className="text-xs text-gray-400 text-center">{loadError}</p>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={({ numPages: n }) => { setNumPages(n); setLoading(false); }}
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

      {/* Page nav */}
      {numPages && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 bg-white shrink-0">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition"
          >
            <ChevronLeft size={13} /> Prev page
          </button>
          <span className="text-xs text-gray-400">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition"
          >
            Next page <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── WordViewer ────────────────────────────────────────────────────────────────
function WordViewer({ url }) {
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    setHtml(null);
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const mammoth = await import("mammoth");
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const wrapped = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: "Segoe UI", Arial, sans-serif; font-size: 13px; line-height: 1.65; color: #1e293b; padding: 28px 32px; background: #fff; }
            h1,h2,h3,h4,h5 { font-weight:700; margin-top:1.2em; margin-bottom:0.4em; color:#0f172a; }
            h1{font-size:1.4em} h2{font-size:1.2em} h3{font-size:1.05em}
            p{margin-bottom:0.6em} ul,ol{padding-left:1.6em;margin-bottom:0.6em}
            li{margin-bottom:0.25em}
            table{border-collapse:collapse;width:100%;margin-bottom:1em;font-size:12px}
            td,th{border:1px solid #e2e8f0;padding:6px 10px;vertical-align:top}
            th{background:#f1f5f9;font-weight:600}
            strong,b{font-weight:600} a{color:#2563eb}
            hr{border:none;border-top:1px solid #e2e8f0;margin:1em 0}
          </style></head><body>${result.value}</body></html>`;
        setHtml(wrapped);
      } catch (err) {
        setError(err.message || "Failed to render document");
      } finally {
        setLoading(false);
      }
    })();
  }, [url]);

  if (loading) return (
    <div className="flex h-40 items-center justify-center gap-2 text-gray-400">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm">Rendering document…</span>
    </div>
  );

  if (error) return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 px-4">
      <p className="text-sm font-semibold text-red-500">Could not render Word document</p>
      <p className="text-xs text-gray-400 text-center">{error}</p>
      <a
        href={url}
        download
        className="mt-2 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
      >
        <Download size={12} /> Download instead
      </a>
    </div>
  );

  return (
    <iframe
      srcDoc={html}
      title="Word document preview"
      className="flex-1 w-full"
      style={{ minHeight: "600px", border: "none" }}
      sandbox="allow-same-origin"
    />
  );
}

// ── DocTypeBadge ──────────────────────────────────────────────────────────────
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
      type === "pdf"     && "bg-red-50 text-red-500 border border-red-100",
      type === "word"    && "bg-blue-50 text-blue-500 border border-blue-100",
      type === "unknown" && "bg-gray-100 text-gray-400",
    )}>
      {type === "pdf" ? "PDF" : type === "word" ? "DOCX" : "File"}
    </span>
  );
}

// ── ResumeDocPane ─────────────────────────────────────────────────────────────
function ResumeDocPane({ docId, paneWidth }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(paneWidth || 680);
  const [docInfo, setDocInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width || 680)
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!docId) { setDocInfo(null); return; }
    setInfoLoading(true);
    fetchDocInfo(docId)
      .then(setDocInfo)
      .catch(() => setDocInfo({ render_as: "unknown" }))
      .finally(() => setInfoLoading(false));
  }, [docId]);

  const token  = authToken();
  const rawUrl = docId
    ? `${API_BASE}/api/documents/${docId}/content?token=${encodeURIComponent(token)}`
    : null;
  const pdfUrl = docId
    ? `${API_BASE}/api/documents/${docId}/content?as_pdf=true&token=${encodeURIComponent(token)}`
    : null;

  if (!docId) {
    return (
      <div
        ref={containerRef}
        className="flex flex-1 flex-col items-center justify-center gap-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 p-10 text-gray-400"
      >
        <FileText size={40} className="opacity-30" />
        <p className="text-sm">No resume available</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm"
    >
      {infoLoading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : docInfo?.render_as === "word" ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <WordViewer url={rawUrl} />
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          <PdfViewer url={pdfUrl || rawUrl} paneWidth={width} />
        </div>
      )}
    </div>
  );
}

// ── ViewerPanel ───────────────────────────────────────────────────────────────
function ViewerPanel({ importId }) {
  const navigate = useNavigate();
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [allSessions, setAllSessions]   = useState([]);
  const [candidates, setCandidates]     = useState([]);
  const [jd, setJd]                     = useState(null);
  const [selected, setSelected]         = useState(null);
  const [sessionMeta, setSessionMeta]   = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const mainRef  = useRef(null);
  const [mainWidth, setMainWidth] = useState(680);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("resume");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Measure main pane width
  useEffect(() => {
    if (!mainRef.current) return;
    const obs = new ResizeObserver(([e]) =>
      setMainWidth(e.contentRect.width || 680)
    );
    obs.observe(mainRef.current);
    return () => obs.disconnect();
  }, []);

  // Load all sessions for the sidebar
  useEffect(() => {
    setSessionsLoading(true);
    fetchAllImportSessions()
      .then((data) => setAllSessions(data.sessions || []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, []);

  // Load this session's docs
  useEffect(() => {
    const token = authToken();
    const metaPromise = fetch(`${API_BASE}/api/imports/${importId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    Promise.all([fetchImportDocuments(importId), metaPromise])
      .then(([data, meta]) => {
        const cands = data.candidates || [];
        setCandidates(cands);
        setJd(data.jd || null);
        setSelected(cands.find((c) => c.resume_doc_id) || cands[0] || null);
        setSessionMeta(meta);
      })
      .catch((err) => {
        const msg = err.message || "Failed to load documents";
        if (msg.toLowerCase().includes("import session not found")) {
          navigate("/document-review", { replace: true });
          return;
        }
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [importId, navigate]);

  const selectedIndex = candidates.findIndex((c) => c.id === selected?.id);

  const jobTitle =
    sessionMeta?.job_title ||
    sessionMeta?.role_name ||
    (sessionMeta?.subject_filter
      ? sessionMeta.subject_filter.replace(/^["']|["']$/g, "")
      : null) ||
    "Document Review";

  const token  = authToken();
  const rawUrl = selected?.resume_doc_id
    ? `${API_BASE}/api/documents/${selected.resume_doc_id}/content?token=${encodeURIComponent(token)}`
    : null;

  // ── Loading / error screens ──
  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center gap-3 text-gray-500">
        <Loader2 size={24} className="animate-spin" />
        <span>Loading documents…</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-red-500">Error</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => navigate("/document-review")}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          <ArrowLeft size={16} /> Back to imports
        </button>
      </div>
    </div>
  );

  // ── Main viewer layout ──
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      {/* Breadcrumb + Toggle Sidebar Button */}
      <div className="bg-white border-b border-gray-200 px-6 py-2.5 shrink-0 flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">
          <span
            className="hover:text-gray-600 cursor-pointer"
            onClick={() => navigate("/job-vacancy")}
          >
            Rank Jobs
          </span>
          <span className="mx-1.5 text-gray-300">/</span>
          <span className="text-gray-700 font-semibold">Document Review</span>
        </p>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100"
        >
          <Menu size={12} />
          Sessions / Candidates
        </button>
      </div>

      {/* Body: sidebar + main, fixed height */}
      <div
        className="flex flex-1 overflow-hidden relative"
        style={{ height: "calc(100vh - 96px)" }}
      >
        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            className="lg:hidden absolute inset-0 bg-black/40 z-30 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── LEFT SIDEBAR ── */}
        <aside
          className={cn(
            "w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 z-40",
            "lg:relative lg:translate-x-0 lg:flex",
            sidebarOpen
              ? "absolute top-0 bottom-0 left-0 translate-x-0 shadow-xl"
              : "absolute top-0 bottom-0 left-0 -translate-x-full lg:translate-x-0"
          )}
        >

          {/* Sidebar header */}
          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Recent Imports
            </h2>
            <button
              onClick={() => {
                setSessionsLoading(true);
                fetchAllImportSessions()
                  .then((d) => setAllSessions(d.sessions || []))
                  .catch(() => {})
                  .finally(() => setSessionsLoading(false));
              }}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <RefreshCw size={13} className={sessionsLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Session list */}
          <div className="overflow-y-auto shrink-0" style={{ maxHeight: "220px" }}>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-6 text-gray-300">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : allSessions.length === 0 ? (
              <p className="px-4 py-4 text-xs text-gray-400">No sessions found</p>
            ) : (
              <ul className="p-2 flex flex-col gap-1">
                {allSessions.map((s) => {
                  const isActive = s.id === Number(importId);
                  const label = s.subject_filter
                    ? s.subject_filter.replace(/^["']|["']$/g, "")
                    : "Gmail Import";
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => {
                          navigate(`/document-review?import_id=${s.id}`);
                          setSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full rounded-xl px-3 py-2.5 text-left transition-all",
                          isActive
                            ? "bg-red-50 border border-red-200"
                            : "border border-transparent hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "text-xs font-semibold truncate",
                              isActive ? "text-red-800" : "text-gray-800"
                            )}>
                              {label}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Users size={9} />
                              {s.fetched_count ?? 0} candidates
                            </p>
                          </div>
                          {isActive && (
                            <span className="shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                          )}
                        </div>
                        {s.created_at && (
                          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar size={9} />
                            {new Date(s.created_at).toLocaleDateString(undefined, {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                            {" · "}
                            {new Date(s.created_at).toLocaleTimeString(undefined, {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Divider + Candidates label */}
          <div className="px-4 pt-4 pb-2 border-t border-gray-100 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Candidates · {candidates.length}
            </p>
          </div>

          {/* Candidate list — fills remaining sidebar height */}
          <div className="flex-1 overflow-y-auto">
            {candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-6 text-gray-300">
                <User size={28} className="opacity-40" />
                <p className="text-xs">No candidates</p>
              </div>
            ) : (
              <ul className="px-2 pb-3 flex flex-col gap-0.5">
                {candidates.map((c) => {
                  const isActive = selected?.id === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => {
                          setSelected(c);
                          setSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full rounded-xl px-3 py-2.5 text-left transition-all",
                          isActive
                            ? "bg-red-50 border border-red-100"
                            : "border border-transparent hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "text-xs font-semibold truncate",
                              isActive ? "text-red-800" : "text-gray-800"
                            )}>
                              {c.name || "Unknown Candidate"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                              {c.email || "No email"}
                            </p>
                          </div>
                          {c.resume_doc_id ? (
                            <span className={cn(
                              "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                              isActive ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                            )}>
                              CV
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-500 border border-amber-100">
                              —
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Candidate header bar */}
          {selected && (
            <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-extrabold text-gray-900 tracking-tight truncate">
                    {selected.name || "Unknown Candidate"}
                  </h1>
                  {selected.email && (
                    <span className="text-xs text-gray-400 font-medium hidden sm:block truncate max-w-[240px]">
                      {selected.email}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selected.role || selected.title || "Candidate"}
                  {sessionMeta && (
                    <>
                      {" · "}
                      <span className="font-medium text-gray-500">{jobTitle}</span>
                      {" · "}Import #{importId}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {rawUrl && (
                  <a
                    href={rawUrl}
                    download
                    title="Download resume"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >
                    <Download size={13} />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                )}
                <button
                  title="Share"
                  className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition"
                >
                  <Share2 size={15} />
                </button>
                <button
                  title="More options"
                  className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition"
                >
                  <MoreHorizontal size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Document panes */}
          <div ref={mainRef} className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-4 min-h-0">
            {/* Tab switcher for mobile */}
            {jd && (
              <div className="md:hidden flex border-b border-gray-200 mb-2 bg-gray-50 rounded-lg p-1 shrink-0">
                <button
                  onClick={() => setActiveTab("resume")}
                  className={cn(
                    "flex-1 py-1.5 text-center text-xs font-bold uppercase tracking-wider rounded-md transition-colors",
                    activeTab === "resume" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  Candidate Resume
                </button>
                <button
                  onClick={() => setActiveTab("jd")}
                  className={cn(
                    "flex-1 py-1.5 text-center text-xs font-bold uppercase tracking-wider rounded-md transition-colors",
                    activeTab === "jd" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  Job Description
                </button>
              </div>
            )}

            {/* Resume pane */}
            <div className={cn(
              "flex-1 flex flex-col min-w-0 overflow-hidden",
              jd ? (activeTab === "resume" ? "flex" : "hidden md:flex") : "flex"
            )}>
              <ResumeDocPane
                docId={selected?.resume_doc_id ?? null}
                paneWidth={jd && !isMobile ? mainWidth * 0.58 : mainWidth - 8}
              />
            </div>

            {/* JD pane */}
            {jd && (
              <div className={cn(
                "flex flex-col min-w-0 overflow-hidden",
                activeTab === "jd" ? "flex w-full" : "hidden md:flex md:w-[38%]"
              )}>
                <div className="flex items-center gap-2 mb-2 px-1 shrink-0">
                  <FileText size={14} className="text-red-600 shrink-0" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Job Description
                  </span>
                </div>
                <ResumeDocPane docId={jd.id} paneWidth={isMobile ? mainWidth - 8 : mainWidth * 0.38} />
              </div>
            )}
          </div>

          {/* Bottom candidate navigation */}
          <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                if (selectedIndex > 0) setSelected(candidates[selectedIndex - 1]);
              }}
              disabled={selectedIndex <= 0}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition"
            >
              <ChevronLeft size={14} /> Previous Candidate
            </button>

            <p className="text-xs text-gray-400">
              {selectedIndex + 1} of {candidates.length} candidates
            </p>

            <button
              onClick={() => {
                if (selectedIndex < candidates.length - 1)
                  setSelected(candidates[selectedIndex + 1]);
              }}
              disabled={selectedIndex >= candidates.length - 1}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition"
            >
              Next Candidate <ChevronRight size={14} />
            </button>
          </div>
        </main>
      </div>

      {/* Footer sits outside the fixed-height flex row */}
      <Footer />
    </div>
  );
}