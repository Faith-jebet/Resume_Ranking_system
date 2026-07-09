import React, { useState } from "react";
import {
  Factory,
  Cog,
  Wrench,
  HardHat,
  Truck,
  BadgeCheck,
  ShieldCheck,
  UtensilsCrossed,
  Fuel,
  Shirt,
  Car,
  FlaskConical,
  Cpu,
  Briefcase,
  Building2,
  Wheat,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Banknote,
  Mail,
} from "lucide-react";

import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";

import { industrialCategories } from "../data/industrialCategories";

/* ------------------------------------------------------------------ */
/* Brand tokens — keep identical in the listings file so both pages    */
/* feel like one product.                                              */
/* ------------------------------------------------------------------ */
export const BRAND = {
  red: "#A11C1C",
  redDark: "#7A1414",
  ink: "#1A1512",
  body: "#6E5C55",
  cream: "#FAF7F3",
  card: "#FFFFFF",
  chip: "#F6E3E0",
};

/* ------------------------------------------------------------------ */
/* The data file stores icons as strings (e.g. "Factory") so it stays  */
/* JSON-friendly. This map resolves that string to the real component. */
/* Exported so the job-matches page can resolve the same icons.        */
/* ------------------------------------------------------------------ */
export const ICON_MAP = {
  Factory,
  Cog,
  Wrench,
  HardHat,
  Truck,
  BadgeCheck,
  ShieldCheck,
  UtensilsCrossed,
  Fuel,
  Shirt,
  Car,
  FlaskConical,
  Cpu,
  Briefcase,
  Building2,
  Wheat,
};

export function resolveIcon(name) {
  return ICON_MAP[name] || Briefcase;
}

// Re-exported under the name the listings page expects, so it can keep
// importing `CATEGORIES` without caring where the data actually lives.
export const CATEGORIES = industrialCategories;

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: BRAND.cream }}>
      <div className="absolute -right-10 -top-6 hidden sm:block opacity-[0.06] pointer-events-none">
        <Banknote size={320} color={BRAND.red} strokeWidth={1} />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-16 pb-14">
        <h1
          className="text-4xl sm:text-5xl font-extrabold leading-[1.05] max-w-2xl"
          style={{ color: BRAND.ink }}
        >
          Fast AI <span style={{ color: BRAND.red }} className="italic">Job Engine</span> and Tracking
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: BRAND.body }}>
          Explore specialized career paths across Kenya's fastest-growing sectors. From
          industrial automation to sustainable agriculture, let FAJET match and rank
          roles against your profile.
        </p>
        <div className="mt-7 flex flex-wrap gap-6">
          <span
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: BRAND.red }}
          >
            <CheckCircle2 size={15} /> Verified employers
          </span>
          <span
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: BRAND.red }}
          >
            <TrendingUp size={15} /> High growth fields
          </span>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category, onViewJobs }) {
  const Icon = resolveIcon(category.icon);
  const isDark = category.style === "dark";

  const base =
    "group relative rounded-2xl border flex flex-col justify-between p-6 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 h-full";

  if (isDark) {
    return (
      <div
        onClick={() => onViewJobs(category)}
        className={`${base} hover:shadow-lg`}
        style={{ backgroundColor: BRAND.red, borderColor: BRAND.red }}
      >
        <div>
          <div className="h-10 w-10 rounded-lg bg-white/15 flex items-center justify-center mb-4">
            <Icon size={20} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{category.title}</h3>
          <p className="text-sm text-white/85 leading-relaxed">{category.blurb}</p>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/15 text-white">
            {category.openRoles.toLocaleString()} open roles
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewJobs(category);
            }}
            className="text-xs font-bold uppercase tracking-wider bg-white px-4 py-2.5 rounded-lg flex items-center gap-1.5 group-hover:gap-2.5 transition-all shrink-0"
            style={{ color: BRAND.red }}
          >
            Explore <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onViewJobs(category)}
      className={`${base} hover:shadow-lg`}
      style={{ backgroundColor: BRAND.card, borderColor: "#ECE5DF" }}
    >
      <div>
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mb-4"
          style={{ backgroundColor: BRAND.chip }}
        >
          <Icon size={20} style={{ color: BRAND.red }} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: BRAND.ink }}>
          {category.title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: BRAND.body }}>
          {category.blurb}
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span
          className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "#F2EEE8", color: BRAND.body }}
        >
          {category.openRoles.toLocaleString()} open roles
        </span>
        <span
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all"
          style={{ color: BRAND.red }}
        >
          View jobs <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
}

function CategoryGrid({ onViewJobs }) {
  return (
    <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: BRAND.ink }}>
            Browse by specialization
          </h2>
          <p className="mt-2 text-sm max-w-md" style={{ color: BRAND.body }}>
            Click on a category to view active listings, each ranked by RecruitAI
            against the job description.
          </p>
        </div>
        <span
          className="text-xs font-bold uppercase tracking-wider shrink-0"
          style={{ color: BRAND.body }}
        >
          {industrialCategories.length} categories
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {industrialCategories.map((category) => (
          <CategoryCard key={category.id} category={category} onViewJobs={onViewJobs} />
        ))}
      </div>
    </section>
  );
}

function NotifySection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-10">
      <div
        className="rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        style={{ backgroundColor: "#EFEBE5" }}
      >
        <div className="max-w-md">
          <h3 className="text-2xl font-extrabold" style={{ color: BRAND.ink }}>
            Don't see your field?
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: BRAND.body }}>
            Sign up for customized alerts. We'll notify you as soon as new roles in your
            specific area of expertise are posted by verified Kenyan firms.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) setSubmitted(true);
          }}
          className="flex flex-col gap-2 w-full sm:w-auto"
        >
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="px-4 py-3 rounded-lg border text-sm w-full sm:w-72 outline-none focus:ring-2"
              style={{ borderColor: "#DDD3C8", color: BRAND.ink }}
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white shrink-0"
              style={{ backgroundColor: BRAND.red }}
            >
              Notify me
            </button>
          </div>
          <span className="text-[11px]" style={{ color: BRAND.body }}>
            {submitted ? "You're on the list — no spam, only opportunities." : "No spam. Only opportunities."}
          </span>
        </form>
      </div>
    </section>
  );
}

export default function JobCategoriesPage({ onViewJobs = () => {} }) {
  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BRAND.cream }}>
     <Navbar />

      <Hero />
      <CategoryGrid onViewJobs={onViewJobs} />
      <NotifySection />
      <Footer />
    </div>
  );
}