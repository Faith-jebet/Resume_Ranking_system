import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Trash2, Briefcase, Calendar, ChevronRight, Loader2, Users } from "lucide-react";
import { Navbar } from "../layout/Navbar";
import Footer from "../layout/Footer";
import { cn } from "../../lib/utils";
import { fetchRecruiterJobs, fetchRecruiterRankings, deleteRecruiterJob } from "../../lib/api";
import jsPDF from "jspdf";
import { autoTable } from 'jspdf-autotable'
console.log("autoTable is:", typeof autoTable, autoTable);

// ── Thresholds ─────────────────────────────────────────────────────────────
function getStatus(score) {
  if (score >= 60)
    return {
      label: "Shortlisted",
      cls: "bg-green-100 text-green-700 border border-green-200",
    };
  if (score >= 40)
    return {
      label: "Waitlisted",
      cls: "bg-amber-100 text-amber-700 border border-amber-200",
    };
  return {
    label: "Rejected",
    cls: "bg-red-100 text-red-600 border border-red-200",
  };
}

// Accent / color helpers
function getBarColor(score) {
  if (score >= 60) return "bg-green-500";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-500";
}

function getLeftAccentClass(score) {
  if (score >= 60) return "border-l-4 border-l-green-400";
  if (score >= 40) return "border-l-4 border-l-amber-400";
  return "border-l-4 border-l-red-400";
}

function getAvatarColors(score) {
  if (score >= 60) return "bg-green-100 text-green-700";
  if (score >= 40) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

// ── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, cls }) {
  return (
    <div className={cn("rounded-2xl border p-4 flex flex-col gap-1 min-w-0", cls)}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 truncate">
        {label}
      </p>
      <p className="text-3xl font-extrabold leading-none">{value}</p>
    </div>
  );
}

function SectionDivider({ color, dotColor, lineColor, label }) {
  return (
    <div className="flex items-center gap-2 -my-3">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 shrink-0",
          color,
        )}
      >
        <span
          className={cn("w-2 h-2 rounded-full inline-block", dotColor)}
        />
        <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
      </div>
      <div className={cn("flex-1 border-t border-dashed", lineColor)} />
    </div>
  );
}

function TableHead() {
  return (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        <th className="w-1 p-0" aria-hidden="true" />
        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 w-10">
          #
        </th>
        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Candidate
        </th>
        <th className="hidden sm:table-cell px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Email
        </th>
        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Match Score
        </th>
        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Status
        </th>
      </tr>
    </thead>
  );
}

function CandidateRow({ rank, name, email, score }) {
  const { label, cls } = getStatus(score);
  return (
    <tr
      className={cn(
        "hover:bg-gray-50 transition-colors",
        getLeftAccentClass(score),
      )}
    >
      <td className="p-0 w-1" />
      <td className="px-4 py-3.5 text-gray-400 font-semibold text-sm w-10">
        {rank}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
              getAvatarColors(score),
            )}
            aria-hidden="true"
          >
            {getInitials(name)}
          </div>
          <span className="font-semibold text-gray-900 text-sm truncate">
            {name}
          </span>
        </div>
      </td>
      <td className="hidden sm:table-cell px-4 py-3.5 text-gray-500 text-sm">
        {email ?? "—"}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-16 sm:w-24 h-2 rounded-full bg-gray-200 overflow-hidden shrink-0">
            <div
              className={cn("h-full rounded-full transition-all", getBarColor(score))}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-sm font-bold text-gray-800 tabular-nums w-9">
            {score}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={cn(
            "inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
            cls,
          )}
        >
          {label}
        </span>
      </td>
    </tr>
  );
}

function CandidateTable({ candidates }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <TableHead />
          <tbody className="divide-y divide-gray-100">
            {candidates.map((c, i) => (
              <CandidateRow
                key={i}
                rank={i + 1}
                name={c.name}
                email={c.email}
                score={c.score}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export function RankedResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [rankingsError, setRankingsError] = useState(null);

  // Parse job_id query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const jobId = searchParams.get("job_id");
    setSelectedJobId(jobId);
    if (jobId) {
      loadRankings(jobId);
    } else {
      setRankings(null);
    }
  }, [location.search]);

  // Load recruiter jobs
  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecruiterJobs();
      setJobs(data);
    } catch (err) {
      setError(err.message || "Failed to load jobs list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const loadRankings = async (jobId) => {
    setRankingsLoading(true);
    setRankingsError(null);
    try {
      const data = await fetchRecruiterRankings(jobId);
      setRankings(data);
    } catch (err) {
      setRankingsError(err.message || "Failed to load rankings for this job.");
    } finally {
      setRankingsLoading(false);
    }
  };

  const handleDeleteJob = async (e, jobId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this job description and all its ranked candidates? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteRecruiterJob(jobId);
      if (selectedJobId && Number(selectedJobId) === Number(jobId)) {
        navigate("/ranked-results");
      } else {
        loadJobs();
      }
    } catch (err) {
      alert(err.message || "Failed to delete job.");
    }
  };

  // Group jobs by category
  const groupedJobs = jobs.reduce((acc, job) => {
    const cat = job.category_title || "General / Unassigned";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(job);
    return acc;
  }, {});

  // Determine active view
  if (selectedJobId) {
    const activeJob = jobs.find((j) => Number(j.job_id) === Number(selectedJobId));

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
          {/* Breadcrumbs / Back button */}
          <div className="shrink-0">
            <button
              onClick={() => navigate("/ranked-results")}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors"
            >
              <ArrowLeft size={13} /> Back to Ranked Vacancies
            </button>
          </div>

          {rankingsLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <Loader2 size={32} className="animate-spin text-red-600" />
              <p className="text-sm font-semibold">Loading candidate assessments...</p>
            </div>
          ) : rankingsError ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-red-600 gap-3">
              <p className="text-sm font-bold">{rankingsError}</p>
              <button
                onClick={() => loadRankings(selectedJobId)}
                className="px-4 py-2 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-50"
              >
                Retry Load
              </button>
            </div>
          ) : rankings ? (
            <>
              {/* Hero header */}
              <div className="rounded-2xl bg-gray-900 px-5 sm:px-7 py-5 sm:py-6 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 mb-1 font-medium tracking-wide">
                    {activeJob?.category_title || "Recruitment Campaign"} &rsaquo; Ranked results
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {activeJob?.title || rankings?.title || "Ranked Candidates"}
                  </h1>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
                    Assessment Campaign
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-4xl font-extrabold text-white tabular-nums">
                    {rankings.ranked_candidates?.length || 0}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    candidate{rankings.ranked_candidates?.length !== 1 ? "s" : ""} assessed
                  </span>
                </div>
              </div>

              {/* Stat Cards */}
              {(() => {
                const list = rankings.ranked_candidates || [];
                const scored = list.map((c) => ({ ...c, score: Math.round(c.score || 0) }));
                const sh = scored.filter((c) => c.score >= 60);
                const wl = scored.filter((c) => c.score >= 40 && c.score < 60);
                const rj = scored.filter((c) => c.score < 40);

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <StatCard
                        label="Total assessed"
                        value={list.length}
                        cls="bg-white border-gray-200 text-gray-700"
                      />
                      <StatCard
                        label="Shortlisted"
                        value={sh.length}
                        cls="bg-green-50 border-green-200 text-green-700"
                      />
                      <StatCard
                        label="Waitlisted"
                        value={wl.length}
                        cls="bg-amber-50 border-amber-200 text-amber-700"
                      />
                      <StatCard
                        label="Rejected"
                        value={rj.length}
                        cls="bg-red-50 border-red-200 text-red-600"
                      />
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap -mt-1">
                      <button
                        onClick={() => navigate("/ranked-results")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteJob(e, selectedJobId)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} /> Delete Vacancy
                        </button>
                        <button 
                          onClick={() => {
                            // Import jsPDF and jspdf-autotable dynamically
                                const doc = new jsPDF();
                                const pageWidth = doc.internal.pageSize.getWidth();
                                const pageHeight = doc.internal.pageSize.getHeight();
                                let yPos = 20;
                                
                                // ══════════════════════════════════════════════════════════
                                // HEADER SECTION
                                // ══════════════════════════════════════════════════════════
                                doc.setFontSize(20);
                                doc.setFont(undefined, 'bold');
                                doc.setTextColor(220, 38, 38); // red-600
                                doc.text(activeJob?.title || rankings?.title || 'Ranked Candidates', 14, yPos);
                                yPos += 3;
                                
                                // Underline
                                doc.setDrawColor(220, 38, 38);
                                doc.setLineWidth(0.5);
                                doc.line(14, yPos, 80, yPos);
                                yPos += 8;
                                
                                // Metadata
                                doc.setFontSize(9);
                                doc.setFont(undefined, 'normal');
                                doc.setTextColor(100);
                                doc.text(`Category: ${activeJob?.category_title || 'General'}`, 14, yPos);
                                yPos += 4;
                                doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, yPos);
                                yPos += 4;
                                doc.text(`Total Assessed: ${rankings.ranked_candidates?.length || 0}`, 14, yPos);
                                yPos += 10;
                                
                                // ══════════════════════════════════════════════════════════
                                // AI RANKING METHODOLOGY SECTION
                                // ══════════════════════════════════════════════════════════
                                const criteria = rankings.ranking_criteria || {};
                                const factors = criteria.factors || [];
                                const summary = criteria.summary || '';
                                const warnings = criteria.warnings || [];
                                
                                if (factors.length > 0 || summary) {
                                  // Section header
                                  doc.setFontSize(14);
                                  doc.setFont(undefined, 'bold');
                                  doc.setTextColor(0);
                                  doc.text('AI Ranking Methodology', 14, yPos);
                                  yPos += 2;
                                  
                                  // Section underline
                                  doc.setDrawColor(200);
                                  doc.setLineWidth(0.3);
                                  doc.line(14, yPos, pageWidth - 14, yPos);
                                  yPos += 6;
                                  
                                  // Ranking factors
                                  if (factors.length > 0) {
                                    doc.setFontSize(10);
                                    doc.setFont(undefined, 'bold');
                                    doc.setTextColor(60);
                                    doc.text('Ranking Factors & Weights:', 14, yPos);
                                    yPos += 5;
                                    
                                    factors.forEach((factor, idx) => {
                                      // Check if we need a new page
                                      if (yPos > pageHeight - 30) {
                                        doc.addPage();
                                        yPos = 20;
                                      }
                                      
                                      doc.setFontSize(9);
                                      doc.setFont(undefined, 'bold');
                                      doc.setTextColor(0);
                                      doc.text(`${idx + 1}. ${factor.name} (${factor.weight}%)`, 18, yPos);
                                      yPos += 4;
                                      
                                      // Description with word wrap
                                      doc.setFont(undefined, 'normal');
                                      doc.setTextColor(80);
                                      const descLines = doc.splitTextToSize(factor.description || '', pageWidth - 46);
                                      doc.text(descLines, 23, yPos);
                                      yPos += (descLines.length * 3.5) + 3;
                                    });
                                    
                                    yPos += 3;
                                  }
                                  
                                  // Summary
                                  if (summary) {
                                    if (yPos > pageHeight - 40) {
                                      doc.addPage();
                                      yPos = 20;
                                    }
                                    
                                    doc.setFontSize(10);
                                    doc.setFont(undefined, 'bold');
                                    doc.setTextColor(60);
                                    doc.text('Assessment Summary:', 14, yPos);
                                    yPos += 5;
                                    
                                    doc.setFontSize(9);
                                    doc.setFont(undefined, 'normal');
                                    doc.setTextColor(0);
                                    const summaryLines = doc.splitTextToSize(summary, pageWidth - 32);
                                    doc.text(summaryLines, 18, yPos);
                                    yPos += (summaryLines.length * 3.5) + 5;
                                  }
                                  
                                  // Warnings (domain mismatches)
                                  if (warnings.length > 0) {
                                    if (yPos > pageHeight - 50) {
                                      doc.addPage();
                                      yPos = 20;
                                    }
                                    
                                    doc.setFontSize(10);
                                    doc.setFont(undefined, 'bold');
                                    doc.setTextColor(220, 38, 38);
                                    doc.text('⚠ Disqualified Candidates:', 14, yPos);
                                    yPos += 5;
                                    
                                    warnings.forEach((warning, idx) => {
                                      if (yPos > pageHeight - 25) {
                                        doc.addPage();
                                        yPos = 20;
                                      }
                                      
                                      doc.setFontSize(9);
                                      doc.setFont(undefined, 'bold');
                                      doc.setTextColor(0);
                                      doc.text(`• ${warning.candidate}`, 18, yPos);
                                      yPos += 4;
                                      
                                      doc.setFont(undefined, 'normal');
                                      doc.setTextColor(180, 60, 60);
                                      const issueLines = doc.splitTextToSize(warning.issue || '', pageWidth - 46);
                                      doc.text(issueLines, 23, yPos);
                                      yPos += (issueLines.length * 3.5) + 2;
                                    });
                                    
                                    yPos += 3;
                                  }
                                  
                                  yPos += 5;
                                }
                                
                                // ══════════════════════════════════════════════════════════
                                // CANDIDATE RANKINGS TABLE
                                // ══════════════════════════════════════════════════════════
                                
                                // Check if we need a new page for the table
                                if (yPos > pageHeight - 60) {
                                  doc.addPage();
                                  yPos = 20;
                                }
                                
                                // Table header
                                doc.setFontSize(14);
                                doc.setFont(undefined, 'bold');
                                doc.setTextColor(0);
                                doc.text('Candidate Rankings', 14, yPos);
                                yPos += 2;
                                
                                doc.setDrawColor(200);
                                doc.setLineWidth(0.3);
                                doc.line(14, yPos, pageWidth - 14, yPos);
                                yPos += 6;
                                
                                // Prepare table data
                                const tableData = (rankings.ranked_candidates || []).map((c, i) => {
                                  const score = Math.round(c.score || 0);
                                  let status = 'Rejected';
                                  if (score >= 60) status = 'Shortlisted';
                                  else if (score >= 40) status = 'Waitlisted';
                                  
                                  // Get justification or create summary
                                  const justification = c.justification || '';
                                  const strengths = Array.isArray(c.strengths) ? c.strengths.slice(0, 3).join(', ') : '';
                                  const gaps = Array.isArray(c.gaps) ? c.gaps.slice(0, 2).join(', ') : '';
                                  
                                  return [
                                    i + 1,
                                    c.name,
                                    c.email || '—',
                                    `${score}%`,
                                    status,
                                    justification || (strengths ? `Strengths: ${strengths}` : '—')
                                  ];
                                });
                                
                                // Generate table
                                autoTable(doc, {
                                  startY: yPos,
                                  head: [['#', 'Candidate', 'Email', 'Score', 'Status', 'AI Justification']],
                                  body: tableData,
                                  theme: 'striped',
                                  headStyles: { 
                                    fillColor: [220, 38, 38], 
                                    fontStyle: 'bold',
                                    fontSize: 9
                                  },
                                  styles: { 
                                    fontSize: 8,
                                    cellPadding: 2
                                  },
                                  columnStyles: {
                                    0: { cellWidth: 8 },
                                    1: { cellWidth: 35 },
                                    2: { cellWidth: 40 },
                                    3: { cellWidth: 15 },
                                    4: { cellWidth: 22 },
                                    5: { cellWidth: 60 }
                                  },
                                  didParseCell: function(data) {
                                    // Color-code status cells
                                    if (data.column.index === 4 && data.section === 'body') {
                                      const status = data.cell.text[0];
                                      if (status === 'Shortlisted') {
                                        data.cell.styles.textColor = [22, 163, 74]; // green
                                        data.cell.styles.fontStyle = 'bold';
                                      } else if (status === 'Waitlisted') {
                                        data.cell.styles.textColor = [245, 158, 11]; // amber
                                        data.cell.styles.fontStyle = 'bold';
                                      } else if (status === 'Rejected') {
                                        data.cell.styles.textColor = [220, 38, 38]; // red
                                        data.cell.styles.fontStyle = 'bold';
                                      }
                                    }
                                  }
                                });
                                
                                // ══════════════════════════════════════════════════════════
                                // FOOTER
                                // ══════════════════════════════════════════════════════════
                                const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY)|| yPos;
                                
                                // Add page numbers
                                const pageCount = doc.internal.getNumberOfPages();
                                for (let i = 1; i <= pageCount; i++) {
                                  doc.setPage(i);
                                  doc.setFontSize(8);
                                  doc.setTextColor(150);
                                  doc.text(
                                    `Page ${i} of ${pageCount}`,
                                    pageWidth / 2,
                                    pageHeight - 10,
                                    { align: 'center' }
                                  );
                                  doc.text(
                                    'Generated by RecruitRank AI',
                                    pageWidth - 14,
                                    pageHeight - 10,
                                    { align: 'right' }
                                  );
                                }
                                
                                // Save PDF
                                const filename = `${(activeJob?.title || 'candidates').replace(/[^a-z0-9]/gi, '_')}_AI_Report.pdf`;
                                doc.save(filename);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                        >
                          <Download size={14} /> Export PDF
                        </button>
                      </div>
                    </div>

                    {/* Tables */}
                    {sh.length > 0 && <CandidateTable candidates={sh} />}

                    {wl.length > 0 && (
                      <>
                        <SectionDivider
                          color="border-amber-200 bg-amber-50 text-amber-600"
                          dotColor="bg-amber-400"
                          lineColor="border-amber-200"
                          label={`Waitlisted · ${wl.length} candidate${wl.length !== 1 ? "s" : ""}`}
                        />
                        <CandidateTable candidates={wl} />
                      </>
                    )}

                    {rj.length > 0 && (
                      <>
                        <SectionDivider
                          color="border-red-200 bg-red-50 text-red-600"
                          dotColor="bg-red-400"
                          lineColor="border-red-200"
                          label={`Rejected · ${rj.length} candidate${rj.length !== 1 ? "s" : ""} below threshold`}
                        />
                        <CandidateTable candidates={rj} />
                      </>
                    )}
                  </>
                );
              })()}

              {/* Legend */}
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap pb-2">
                {[
                  { color: "bg-green-400", text: "Shortlisted — score ≥ 60%" },
                  { color: "bg-amber-400", text: "Waitlisted — score 40–59%" },
                  { color: "bg-red-400",   text: "Rejected — score < 40%" },
                ].map(({ color, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <span className={cn("w-3 h-3 rounded-sm inline-block", color)} />
                    <span className="text-xs text-gray-500">{text}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-sm">No assessment rankings found.</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    );
  }

  // ── List View (Grouped by Category) ──
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        
        {/* Header Hero */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Ranked Vacancies
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed max-w-2xl">
            View persistent AI-evaluated candidate ranking campaigns. Review shortlisted hires or clean up job postings once vacancies are successfully filled.
          </p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-red-600" />
            <p className="text-sm font-semibold">Loading ranked job vacancies...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-red-600 gap-2 text-center">
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={loadJobs}
              className="px-4 py-2 bg-white border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-50 text-red-600 transition"
            >
              Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 text-center bg-white border border-gray-200 rounded-2xl p-6 shadow-sm gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
              <Briefcase size={22} className="text-gray-400" />
            </div>
            <div className="max-w-md">
              <p className="text-sm font-bold text-gray-800">No ranked jobs found</p>
              <p className="text-xs text-gray-400 mt-1">
                You haven't run any candidate ranking campaigns yet. Head over to the Job Vacancy page to evaluate candidate CVs with advanced matching.
              </p>
            </div>
            <button
              onClick={() => navigate("/job-categories")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm uppercase tracking-wider"
            >
              Go to Job Categories
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(groupedJobs).map(([categoryName, catJobs]) => (
              <div key={categoryName} className="flex flex-col gap-3">
                {/* Category Header */}
                <div className="flex items-center gap-2 px-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600">
                    {categoryName}
                  </h2>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                    {catJobs.length} posting{catJobs.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Jobs list */}
                <div className="flex flex-col gap-2.5">
                  {catJobs.map((job) => (
                    <div
                      key={job.job_id}
                      onClick={() => navigate(`/ranked-results?job_id=${job.job_id}`)}
                      className="group bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 transition shadow-sm hover:shadow cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition truncate">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(job.created_at).toLocaleDateString(undefined, {
                              month: "short", day: "numeric", year: "numeric"
                            })}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Briefcase size={12} />
                            Job #{job.job_id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleDeleteJob(e, job.job_id)}
                          title="Delete job description & rankings"
                          className="p-2 border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700 transition"
                        >
                          View Results <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}