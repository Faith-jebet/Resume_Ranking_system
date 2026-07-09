import React, { useMemo, useState } from "react";
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

function JobCard({ job, category }) {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-xl border p-5 bg-white hover:shadow-md transition-shadow"
      style={{ borderColor: "#ECE5DF" }}
    >
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

      <div className="mt-4 flex flex-col items-center">
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
          onClick={() => {
            navigate("/job-vacancy", {
              state: {
                jobTitle: job.title,
                company: job.company,
                category: category,
              }
            });
          }}
          className="text-center text-[11px] font-bold uppercase tracking-wider mt-2 py-1"
          style={{ color: BRAND.red }}
        >
          View job description
        </button>
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

  const jobs = useMemo(() => generateJobs(category), [category]);

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
        (a, b) => parseInt(b.salary.match(/\d+/g)[0]) - parseInt(a.salary.match(/\d+/g)[0])
      );
    return list;
  }, [jobs, sortBy, query]);

  const Icon = resolveIcon(category.icon);

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BRAND.cream }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-6"
          style={{ color: BRAND.red }}
        >
          <ArrowLeft size={14} /> All categories
        </button>

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
          Every listing ranked by RecruitAI
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
            {visibleJobs.length.toLocaleString()} of {category.openRoles?.toLocaleString?.() ?? visibleJobs.length} open roles
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
            <JobCard key={job.id} job={job} category={category} />
          ))}
          {visibleJobs.length === 0 && (
            <div
              className="rounded-xl border p-10 text-center text-sm"
              style={{ borderColor: "#ECE5DF", color: BRAND.body, backgroundColor: BRAND.card }}
            >
              No roles match "{query}" in this category yet.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}