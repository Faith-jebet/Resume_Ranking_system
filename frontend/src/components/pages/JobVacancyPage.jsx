import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Mail,
  Upload,
  FileText,
  X,
  RefreshCw,
  ChevronRight,
  BarChart2,
  ListChecks,
  AlertCircle,
  Loader2,
  Eye,
  Plus,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import { Navbar } from "../layout/Navbar";
import { fetchGmailResumes, matchCandidates, getStoredToken, API_BASE } from "../../lib/api";
import { cn } from "../../lib/utils";
import Footer from "../layout/Footer";

// ── Helpers ───────────────────────────────────────────────────────────────────


async function fetchLatestImportId() {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}/api/imports`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  const sessions = Array.isArray(data) ? data : (data.sessions || []);
  if (!sessions.length) throw new Error("No import sessions found.");
  const sorted = [...sessions].sort((a, b) => b.id - a.id);
  return sorted[0].id;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilePill({ file, onRemove }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm">
      <FileText size={14} className="text-red-600 shrink-0" />
      <span className="flex-1 text-xs text-gray-800 truncate max-w-[160px]">
        {file.name}
      </span>
      <button
        onClick={() => onRemove(file.name)}
        className="flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        aria-label={`Remove ${file.name}`}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function SectionCard({ icon: Icon, iconBg, title, description, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className={cn("flex items-center justify-center w-10 h-10 rounded-xl shrink-0", iconBg)}>
          <Icon size={20} />
        </span>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function JDViewModal({ isOpen, onClose, jdFile, onUpload }) {
  const [isUploading, setIsUploading] = useState(false);
  const uploadInputRef = useRef(null);

  if (!isOpen) return null;

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload
      setTimeout(() => {
        onUpload(file);
        setIsUploading(false);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Job Description</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          {jdFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{jdFile.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(jdFile.size / 1024).toFixed(1)} KB • {jdFile.type}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const url = URL.createObjectURL(jdFile);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = jdFile.name;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview</h4>
                <div className="h-96 overflow-auto bg-white border border-gray-200 rounded p-4">
                  {jdFile.type === "application/pdf" ? (
                    <p className="text-gray-500 italic">PDF preview would be shown here</p>
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {jdFile.textContent || "File content would be displayed here"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Description Available</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                There is no job description file uploaded for this position. 
                You can upload a JD file to enable candidate ranking.
              </p>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleUpload}
              />
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 mx-auto"
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {isUploading ? "Uploading..." : "Upload JD File"}
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Page ──────────────────────────────────────────────────────────────────────

export function JobVacancyPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const jdInputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Read selected job details from router state
  const selectedJob = location.state || {};

  const category = selectedJob.category || null;

  const [jobTitle, setJobTitle] = useState(selectedJob.jobTitle || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const roleLabel = jobTitle || "AI Resume Ranking Engine";

  const [resumes, setResumes] = useState([]);
  const [jdFile, setJdFile] = useState(null);
  const [gmailSubject, setGmailSubject] = useState(selectedJob.jobTitle || "");
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailStatus, setGmailStatus] = useState(null);
  const [gmailError, setGmailError] = useState("");
  const [lastScan, setLastScan] = useState(null);
  const [gmailResumes, setGmailResumes] = useState([]);
  const [ranking, setRanking] = useState(false);
  const [rankError, setRankError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(null);

  // "Review Resumes" button state
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // JD View Modal state
  const [showJDModal, setShowJDModal] = useState(false);

  const addFiles = (incoming) => {
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfs.length) return;
    setResumes((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...pdfs.filter((f) => !names.has(f.name))];
    });
  };

  const removeResume = (name) => setResumes((prev) => prev.filter((f) => f.name !== name));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleGmailSync = async () => {
    setGmailLoading(true);
    setGmailStatus(null);
    setGmailError("");
    try {
      const response = await fetchGmailResumes(gmailSubject, startDate, endDate);
      const fetched = response.resumes || response.candidates || (Array.isArray(response) ? response : []);
      if (!fetched.length) {
        setGmailStatus("error");
        setGmailError(
          `No resumes found matching "${gmailSubject || 'Resume Analyzing'}"${startDate || endDate ? ' in the selected date range' : ''}. Try: (1) Check email subject matches, (2) Remove date filters, (3) Verify Gmail is connected with permissions`
        );
      } else {
        setGmailResumes(fetched);
        setGmailStatus("success");
        setLastScan(new Date());
      }
    } catch (err) {
      setGmailStatus("error");
      setGmailError(err.message || "Failed to connect to Gmail.");
    } finally {
      setGmailLoading(false);
    }
  };

  // Navigate to the most recent import session, or show an inline error
  const handleReviewResumes = async () => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const id = await fetchLatestImportId();
      navigate(`/document-review?import_id=${id}`);
    } catch (err) {
      setReviewError(err.message || "No import sessions found.");
    } finally {
      setReviewLoading(false);
    }
  };

  const totalCount = resumes.length + gmailResumes.length;

  const handleRank = async () => {
    if (!jobTitle.trim()) { setRankError("Please enter a job title."); return; }
    if (!totalCount) { setRankError("Please upload resumes or fetch from Gmail."); return; }

    setRanking(true);
    setRankError(null);
    try {
      const results = await matchCandidates(
        jobTitle,
        resumes,
        jdFile,
        gmailResumes,
        category?.id,
        category?.title
      );
      if (!results?.candidates?.length) throw new Error("No candidates returned from API.");
      if (!results?.job_id) throw new Error("No job ID returned from API.");

      // Save criteria and results in sessionStorage as backup
      sessionStorage.setItem("rr_ranked_results", JSON.stringify({
        jobTitle,
        candidates: results.candidates,
        criteria: results.ranking_criteria,
      }));

      navigate(`/ranked-results?job_id=${results.job_id}`);
    } catch (err) {
      setRankError(err.message || "Ranking failed. Please try again.");
    } finally {
      setRanking(false);
    }
  };

  const handleJDUpload = (file) => {
    setJdFile(file);
    setShowJDModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <JDViewModal
        isOpen={showJDModal}
        onClose={() => setShowJDModal(false)}
        jdFile={jdFile}
        onUpload={handleJDUpload}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-7">

        {/* Page header with workflow indicator */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {roleLabel}
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Recruitment Workflow &amp; Candidate Assessment Pipeline
              </p>

              {/* Workflow Steps Indicator */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Workflow:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/job-categories")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors"
                    title="Review job categories"
                  >
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-600 text-white text-[10px] font-bold">✓</span>
                    Job Category
                  </button>
                  <ChevronRight size={14} className="text-gray-300" />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">2</span>
                    Upload Resumes & JD
                  </div>
                  <ChevronRight size={14} className="text-gray-300" />
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    totalCount > 0
                      ? "bg-amber-50 border border-amber-200 text-amber-700"
                      : "bg-gray-100 border border-gray-200 text-gray-400"
                  )}>
                    <span className={cn(
                      "flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold",
                      totalCount > 0 ? "bg-amber-600" : "bg-gray-400"
                    )}>3</span>
                    Rank Candidates
                  </div>
                  <ChevronRight size={14} className="text-gray-300" />
                  <button
                    onClick={() => navigate("/ranked-results")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-200 transition-colors"
                    title="View ranked results"
                  >
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-400 text-white text-[10px] font-bold">4</span>
                    View Results
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Review Resumes — fetches latest import_id first */}
                <button
                  onClick={handleReviewResumes}
                  disabled={reviewLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  {reviewLoading
                    ? <Loader2 size={14} className="animate-spin" />
                    : <BarChart2 size={15} />
                  }
                  {reviewLoading ? "Loading…" : "Review Resumes"}
                </button>

                <button
                  onClick={() => navigate("/ranked-results")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <ListChecks size={15} />
                  Ranked Results
                </button>
              </div>

              {/* Inline error under the button row */}
              {reviewError && (
                <p className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle size={12} className="shrink-0" />
                  {reviewError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Three-column workflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* 1. Scan Email */}
          <SectionCard
            icon={Mail}
            iconBg="bg-red-100 text-red-600"
            title="Scan Email"
            description="Connect your recruitment inbox to automatically fetch resumes from incoming applicant threads."
          >
            {lastScan && (
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                Last Scan:{" "}
                {lastScan.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <input
              type="text"
              placeholder="Subject filter (optional)"
              value={gmailSubject}
              onChange={(e) => setGmailSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
            />

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Deadline</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
            </div>

            {gmailStatus === "error" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                <AlertCircle size={13} className="shrink-0" />
                {gmailError}
              </div>
            )}
            {gmailStatus === "success" && (
              <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                Fetched {gmailResumes.length} resume(s) from Gmail
              </div>
            )}
            <button
              onClick={handleGmailSync}
              disabled={gmailLoading}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={14} className={gmailLoading ? "animate-spin" : ""} />
              {gmailLoading ? "Fetching…" : "Fetch Resumes"}
            </button>
          </SectionCard>

          {/* 2. Upload Resumes */}
          <SectionCard
            icon={Upload}
            iconBg="bg-orange-100 text-orange-600"
            title="Upload Resumes"
          >
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors",
                dragging
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 bg-gray-50 hover:border-red-400 hover:bg-red-50"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <Upload size={22} className="text-orange-500" />
              <span className="text-sm font-semibold text-gray-700">
                Drag &amp; drop PDF files here
              </span>
              <span className="text-xs text-gray-400">or click to browse</span>
            </div>
            {resumes.length > 0 && (
              <div className="flex flex-col gap-2">
                {resumes.map((f) => (
                  <FilePill key={f.name} file={f} onRemove={removeResume} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* 3. Job Description */}
          <SectionCard
            icon={FileText}
            iconBg="bg-blue-100 text-blue-600"
            title="Job Description"
            description="Upload a PDF or DOCX file containing the role requirements."
          >
            <input
              type="text"
              placeholder="Job title, e.g. Senior Software Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
            />
            {!jdFile ? (
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors border-gray-200 bg-gray-50 hover:border-red-400 hover:bg-red-50"
                onClick={() => jdInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setJdFile(f); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && jdInputRef.current?.click()}
              >
                <input
                  ref={jdInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => { if (e.target.files[0]) setJdFile(e.target.files[0]); }}
                />
                <FileText size={22} className="text-blue-400" />
                <span className="text-sm font-semibold text-gray-700">
                  Drag &amp; drop JD file here
                </span>
                <span className="text-xs text-gray-400">PDF, DOCX or TXT</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm">
                <FileText size={14} className="text-blue-500 shrink-0" />
                <span className="flex-1 text-xs text-gray-800 truncate">{jdFile.name}</span>
                <button
                  onClick={() => setJdFile(null)}
                  className="flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  aria-label="Remove JD file"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!jdFile) {
                    setShowJDModal(true);
                    return;
                  }
                  // Open JD file in a new window/tab for review
                  const url = URL.createObjectURL(jdFile);
                  const newWindow = window.open(url, '_blank');
                  if (newWindow) {
                    newWindow.onload = () => URL.revokeObjectURL(url);
                  } else {
                    // Fallback if popup blocked
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = jdFile.name;
                    link.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                disabled={!jdFile}
                className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FileText size={14} />
                Review JD
              </button>
              <button
                onClick={() => setShowJDModal(true)}
                className="flex items-center justify-center px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                title="View Job Description Details"
              >
                <Eye size={14} />
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Ready to Rank banner */}
        <div className="bg-gray-900 rounded-2xl px-8 py-8 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Ready to Rank</h2>
            <p className="mt-2 text-sm text-gray-400 max-w-xl leading-relaxed">
              Our AI-driven engine will compare{" "}
              <span className="text-white font-semibold">{totalCount}</span>{" "}
              identified resume{totalCount !== 1 ? "s" : ""} against your{" "}
              <span className="text-white font-semibold">{roleLabel}</span>{" "}
              criteria to provide an objective score and talent report.
            </p>
            {rankError && <p className="mt-2 text-sm text-red-400">{rankError}</p>}
          </div>
          <button
            onClick={handleRank}
            disabled={ranking}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-red-600 text-white text-base font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {ranking ? "Ranking…" : "Rank Candidates"}
            {!ranking && <ChevronRight size={18} />}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}