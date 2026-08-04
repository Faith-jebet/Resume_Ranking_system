import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock3,
  Users,
  Sparkles,
  ChevronDown,
  Search,
  Cpu,
  ListChecks,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { BRAND, CATEGORIES, resolveIcon } from "./JobCategoriesPage";
import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";

/* ------------------------------------------------------------------ */
/* Mock job + ranking data                                             */
/* In production, swap generateJobs() for a call to your RecruitAI      */
/* ranking endpoint, which should already return a matchScore and a    */
/* breakdown per job description comparison.                           */
/* ------------------------------------------------------------------ */
const COMPANY_POOL = [
  "Twiga Foods",
  "Bidco Africa",
  "Safaricom PLC",
  "Kenya Ports Authority",
  "East African Breweries",
  "Sasini Plc",
  "M-KOPA",
  "Davis & Shirtliff",
  "Kenya Airways",
  "Bamburi Cement",
];

const LOCATIONS = ["Nairobi", "Mombasa", "Thika", "Nakuru", "Kisumu", "Naivasha", "Eldoret"];
const JOB_TYPES = ["Full-time", "Contract", "Hybrid", "On-site"];

const ROLE_SUFFIXES = [
  "Officer",
  "Supervisor",
  "Manager",
  "Specialist",
  "Coordinator",
  "Analyst",
  "Technician",
  "Lead",
];

// Green used for the "positions available" indicator. Kept local to this
// file since it's not part of the shared BRAND palette.
const AVAILABLE_GREEN = "#1E8E5A";

// Builds plausible job titles from the category name itself, so this
// works for any category in the data file without needing a hand-kept
// title list per category id.
function titlesForCategory(category) {
  const base = category.title.split(/[&,]/)[0].trim();
  return ROLE_SUFFIXES.map((suffix) => `${base} ${suffix}`);
}

// Deterministic pseudo-random so a category always renders the same
// mock listings (no layout shift between renders).
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateJobs(category) {
  const rand = seededRandom(
    category.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + 7
  );
  const titles = titlesForCategory(category);

  return Array.from({ length: 8 }).map((_, i) => {
    const skillsMatch = Math.round(60 + rand() * 39);
    const experienceMatch = Math.round(55 + rand() * 44);
    const locationFit = Math.round(50 + rand() * 49);
    const matchScore = Math.round(
      skillsMatch * 0.5 + experienceMatch * 0.3 + locationFit * 0.2
    );
    const salaryBase = Math.round((45 + rand() * 180) / 5) * 5;
    const positions = Math.floor(rand() * 14) + 1;

    return {
      id: `${category.id}-${i}`,
      title: titles[i % titles.length],
      company: COMPANY_POOL[Math.floor(rand() * COMPANY_POOL.length)],
      location: LOCATIONS[Math.floor(rand() * LOCATIONS.length)],
      type: JOB_TYPES[Math.floor(rand() * JOB_TYPES.length)],
      salary: `KES ${salaryBase.toLocaleString()}K – ${(salaryBase + 25).toLocaleString()}K`,
      postedDaysAgo: Math.floor(rand() * 14) + 1,
      positions,
    };
  });
}

/* ------------------------------------------------------------------ */
/* UI bits                                                             */
/* ------------------------------------------------------------------ */
function BreakdownBar({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: BRAND.body }}>
          {label}
        </span>
        <span className="text-xs font-bold" style={{ color: BRAND.ink }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F0E3E0" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: BRAND.red }}
        />
      </div>
    </div>
  );
}

function JobCard({ job, category, onEdit, onDelete, onViewJD }) {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-xl border p-5 bg-white hover:shadow-md transition-shadow relative"
      style={{ borderColor: "#ECE5DF" }}
    >
      {/* Edit/Delete buttons (always visible but subtle) */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(job);
          }}
          className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Edit job"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(job.id);
          }}
          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Delete job"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold" style={{ color: BRAND.ink }}>
          {job.title}
        </h3>
        {job.matchScore >= 90 && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
            style={{ backgroundColor: BRAND.chip, color: BRAND.red }}
          >
            Highest ranked
          </span>
        )}
      </div>

      <p className="text-sm font-medium mt-0.5" style={{ color: BRAND.body }}>
        {job.company}
      </p>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs" style={{ color: BRAND.body }}>
        <span className="flex items-center gap-1.5">
          <MapPin size={13} /> {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock3 size={13} /> {job.postedDaysAgo}d ago · {job.type}
        </span>
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: AVAILABLE_GREEN }}>
          <Users size={13} /> {job.positions} Position{job.positions !== 1 ? "s" : ""} Available
        </span>
      </div>

      {job.salary && (
        <div className="mt-2 text-xs font-medium" style={{ color: BRAND.body }}>
          {job.salary}
        </div>
      )}

      {job.description && (
        <div className="mt-2 text-xs text-gray-600 line-clamp-2">
          {job.description}
        </div>
      )}

      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          onClick={() => {
            navigate("/job-vacancy", {
              state: {
                jobTitle: job.title,
                company: job.company,
                category: category,
              }
            });
          }}
          className="px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
          style={{ backgroundColor: BRAND.red, color: "white" }}
        >
          <Cpu size={13} /> {"Rank with AI"}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log("View JD clicked for:", job.title); // Debug log
            onViewJD(job);
          }}
          className="text-center text-[11px] font-bold uppercase tracking-wider py-1 px-2 rounded hover:bg-gray-100 transition-colors cursor-pointer"
          style={{ color: BRAND.red }}
        >
          View job description
        </button>
      </div>
    </div>
  );
}

function JDViewModal({ isOpen, onClose, job, onUpload, category }) {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [jdFile, setJdFile] = useState(null);
  const uploadInputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload
      setTimeout(() => {
        onUpload(file);
        setJdFile(file);
        setIsUploading(false);
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Job Description - {job?.title}
          </h2>
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
              
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    navigate("/job-vacancy", {
                      state: {
                        jobTitle: job?.title,
                        company: job?.company,
                        category: category,
                      }
                    });
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  <Cpu size={14} />
                  Rank Candidates with AI
                </button>
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

function AddJobModal({ isOpen, onClose, onSave, editingJob, category }) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    postedDaysAgo: 1,
    positions: 1,
    type: "Contract",
    salary: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingJob) {
      setFormData({
        title: editingJob.title || "",
        company: editingJob.company || "",
        location: editingJob.location || "",
        postedDaysAgo: editingJob.postedDaysAgo || 1,
        positions: editingJob.positions || 1,
        type: editingJob.type || "Contract",
        salary: editingJob.salary || "",
        description: editingJob.description || "",
      });
    } else {
      setFormData({
        title: "",
        company: "",
        location: "",
        postedDaysAgo: 1,
        positions: 1,
        type: "Contract",
        salary: "",
        description: "",
      });
    }
  }, [editingJob]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = editingJob ? "Edit Job Update" : "Add New Job Update";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {title} - {category.title}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g. Manufacturing Supervisor"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g. Twiga Foods"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g. Nairobi"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Posted *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.postedDaysAgo}
                  onChange={(e) => setFormData({...formData, postedDaysAgo: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. 3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Positions Required *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.positions}
                  onChange={(e) => setFormData({...formData, positions: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. 5"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Contract">Contract</option>
                <option value="Full-time">Full-time</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary Range
              </label>
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g. KES 80K – 120K"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-[100px]"
                placeholder="Enter job description..."
                rows="4"
              />
            </div>
          </div>
        </form>
        
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            type="button"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {editingJob ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page export — drop this into your router as the job-matches route.  */
/* Pass `category` (one of the objects from CATEGORIES, or any object  */
/* with the same shape) and onBack() to return to the categories page. */
/* e.g. <JobMatchesPage category={category} onBack={() => navigate(-1)} /> */
/* ------------------------------------------------------------------ */
export default function JobMatchesPage({ category = CATEGORIES[0], onBack = () => {} }) {
  const [sortBy, setSortBy] = useState("match");
  const [query, setQuery] = useState("");
  const [showJobModal, setShowJobModal] = useState(false);
  const [showJDModal, setShowJDModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this would fetch from an API
    const generatedJobs = generateJobs(category);
    setJobs(generatedJobs);
    setLoading(false);
  }, [category]);

  const handleSaveJob = async (jobData) => {
    // In production, this would call an API
    if (editingJob) {
      // Update existing job
      setJobs(prev => prev.map(j => 
        j.id === editingJob.id 
          ? { ...editingJob, ...jobData, id: editingJob.id }
          : j
      ));
    } else {
      // Add new job
      const newJob = {
        ...jobData,
        id: `${category.id}-${Date.now()}`,
        matchScore: Math.round(70 + Math.random() * 29), // Random match score for new jobs
      };
      setJobs(prev => [newJob, ...prev]);
    }
  };

  const handleDeleteJob = (jobId) => {
    if (!confirm('Are you sure you want to delete this job update?')) return;
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowJobModal(true);
  };

  const handleViewJD = (job) => {
    console.log("handleViewJD called for:", job.title); // Debug log
    setSelectedJob(job);
    setShowJDModal(true);
  };

  const handleJDUpload = (file) => {
    // In a real app, this would upload to a server
    console.log("JD uploaded for job:", selectedJob?.title, "File:", file.name);
    // You could update the job object to track that it has a JD
  };

  const visibleJobs = useMemo(() => {
    let list = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(query.toLowerCase()) ||
        j.company.toLowerCase().includes(query.toLowerCase())
    );
    if (sortBy === "match") list = [...list].sort((a, b) => b.matchScore - a.matchScore);
    if (sortBy === "recent") list = [...list].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    if (sortBy === "salary")
      list = [...list].sort(
        (a, b) => {
          const aSalary = a.salary ? parseInt(a.salary.match(/\d+/g)?.[0] || "0") : 0;
          const bSalary = b.salary ? parseInt(b.salary.match(/\d+/g)?.[0] || "0") : 0;
          return bSalary - aSalary;
        }
      );
    return list;
  }, [jobs, sortBy, query]);

  const Icon = resolveIcon(category.icon);

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BRAND.cream }}>
      <Navbar />
      
      <JDViewModal
        isOpen={showJDModal}
        onClose={() => {
          setShowJDModal(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
        onUpload={handleJDUpload}
        category={category}
      />
      
      <AddJobModal
        isOpen={showJobModal}
        onClose={() => {
          setShowJobModal(false);
          setEditingJob(null);
        }}
        onSave={handleSaveJob}
        editingJob={editingJob}
        category={category}
      />
      
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            style={{ color: BRAND.red }}
          >
            <ArrowLeft size={14} /> All categories
          </button>
          
          <button
            onClick={() => {
              setEditingJob(null);
              setShowJobModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Job Update
          </button>
        </div>

        <div className="flex items-start gap-4">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: BRAND.chip }}
          >
            {Icon ? (
              <Icon size={22} style={{ color: BRAND.red }} />
            ) : (
              <ListChecks size={22} style={{ color: BRAND.red }} />
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: BRAND.ink }}>
              {category.title}
            </h1>
            <p className="mt-1.5 text-sm max-w-xl" style={{ color: BRAND.body }}>
              {category.blurb}
            </p>
          </div>
        </div>

        <div
          className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          style={{ color: BRAND.red }}
        >
          <Sparkles size={14} />
          Every listing will be ranked by FAJET
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-4">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.body }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search role or company"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
            style={{ borderColor: "#ECE5DF", color: BRAND.ink, backgroundColor: BRAND.card }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: BRAND.body }}>
            {visibleJobs.length} job update{visibleJobs.length !== 1 ? 's' : ''} • {jobs.reduce((sum, job) => sum + (job.positions || 0), 0)} total positions
          </p>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
              style={{ borderColor: "#ECE5DF", color: BRAND.ink, backgroundColor: BRAND.card }}
            >
              <option value="match">Sort: best match</option>
              <option value="recent">Sort: most recent</option>
              <option value="salary">Sort: highest salary</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: BRAND.body }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-10 pb-6">
        <div className="flex flex-col gap-3">
          {visibleJobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              category={category}
              onEdit={handleEditJob}
              onDelete={handleDeleteJob}
              onViewJD={handleViewJD}
            />
          ))}
          {visibleJobs.length === 0 && (
            <div
              className="rounded-xl border p-10 text-center text-sm"
              style={{ borderColor: "#ECE5DF", color: BRAND.body, backgroundColor: BRAND.card }}
            >
              No job updates in this category yet. Click "Add Job Update" to create the first one.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}