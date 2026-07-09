import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Scale,
  Cpu,
  TrendingUp,
  Lightbulb,
  BarChart2,
  Rocket,
  ArrowUpRight,
} from "lucide-react";
import { Navbar } from "../layout/Navbar";
import Footer from "../layout/Footer";

// ─── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "1M+", label: "RESUMES PARSED" },
  { value: "98%", label: "ACCURACY RATE" },
  { value: "500+", label: "ENTERPRISE CLIENTS" },
  { value: "45%", label: "FASTER HIRING" },
];

const INTEGRITY_FEATURES = [
  {
    icon: Shield,
    title: "High-Fidelity AI",
    desc: "Proprietary models trained on multi-industry expertise.",
  },
  {
    icon: Scale,
    title: "Bias Reduction",
    desc: "Neutralizing unconscious bias at the source of screening.",
  },
];

const ENGINE_CARDS = [
  {
    icon: Cpu,
    title: "The Parsing Core",
    desc: "Our neural engine extracts semantic meaning from complex resumes, moving beyond keyword matching to true context understanding.",
    dark: false,
  },
  {
    icon: TrendingUp,
    title: "Objective Scoring",
    desc: "Mathematical precision applied to soft skills and technical proficiency.",
    dark: true,
  },
  {
    icon: Lightbulb,
    title: "AI Insights",
    desc: "Predictive analytics on candidate retention and cultural fit potential based on historical growth patterns.",
    dark: false,
  },
  {
    icon: BarChart2,
    title: "Market Intelligence",
    desc: "Real-time salary benchmarking and competitive talent mapping integrated directly into your pipeline.",
    dark: false,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-white px-6 pt-14 pb-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          {/* Left copy */}
          <div className="flex-1">
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-red-600 border border-red-200 bg-red-50 px-3 py-1 rounded-full mb-5">
              Precision Engineered
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Revolutionizing{" "}
              <span className="text-red-600">Talent Acquisition</span>
            </h1>
            <p className="mt-5 text-sm text-gray-500 leading-relaxed max-w-md">
              RecruitRank bridges the gap between high-velocity startups and
              corporate giants through objective, high-fidelity AI recruitment
              technology.
            </p>
            <div className="mt-7 flex gap-3">
              <button
                onClick={() => navigate("/about#story")}
                className="px-6 py-2.5 rounded-lg bg-red-700 text-white text-sm font-semibold hover:bg-red-800 transition-colors"
              >
                Our Story
              </button>
              <button
                onClick={() => navigate("/about#tech")}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-800 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                View Technology
              </button>
            </div>
          </div>

          {/* Right — mock browser screenshot card */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-sm rounded-xl border border-gray-200 shadow-md overflow-hidden bg-white">
              {/* Browser chrome */}
              <div className="bg-gray-100 px-3 py-2 flex items-center gap-1.5 border-b border-gray-200">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="ml-3 flex-1 bg-white rounded text-xs text-gray-400 px-2 py-0.5 border border-gray-200">
                  recruitrank.app/about
                </div>
              </div>
              {/* Mock page content */}
              <div className="p-5 space-y-3">
                <div className="text-sm font-bold text-gray-800">
                  About RecruitRank
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 bg-gray-100 rounded w-full" />
                  <div className="h-2 bg-gray-100 rounded w-5/6" />
                  <div className="h-2 bg-gray-100 rounded w-4/6" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="h-12 bg-gray-50 border border-gray-100 rounded-lg" />
                  <div className="h-12 bg-gray-50 border border-gray-100 rounded-lg" />
                </div>
                <div className="h-14 bg-red-700 rounded-lg flex items-center justify-center mt-2">
                  <span className="text-white text-xs font-semibold">
                    Post a Job — Get Started
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-red-700 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-extrabold text-white">{value}</div>
              <div className="text-xs font-semibold text-red-200 tracking-widest mt-1 uppercase">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Automating with Integrity ── */}
      <section id="story" className="bg-gray-50 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Automating with Integrity
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl mb-10">
            Our mission is to eliminate the noise in technical and executive
            recruitment. We believe that every candidate deserves a fair,
            objective evaluation based on their true potential, not just the
            keywords on their resume. By leveraging advanced natural language
            processing and market intelligence, we empower companies to build
            diverse, high-performing teams with absolute confidence.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {INTEGRITY_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-gray-100 rounded-xl p-6 flex gap-4"
              >
                <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-600">
                  <Icon size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    {title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Engine Behind the Rank ── */}
      <section id="tech" className="bg-white px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              The Engine Behind the Rank
            </h2>
            <p className="mt-3 text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Advanced technology layers working in unison to surface the top 1%
              of talent for your specific needs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ENGINE_CARDS.map(({ icon: Icon, title, desc, dark }) => (
              <div
                key={title}
                className={`rounded-xl p-7 flex flex-col gap-4 border ${
                  dark
                    ? "bg-red-700 border-red-700"
                    : "bg-white border-gray-100"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                    dark ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon size={20} />
                </span>
                <h3
                  className={`text-base font-bold ${
                    dark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    dark ? "text-red-200" : "text-gray-500"
                  }`}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Born from Inefficiency ── */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-start">
          {/* Left copy */}
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
              Born from Inefficiency
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Founded in 2021, RecruitRank emerged from a simple observation:
              the world's most innovative companies were still using outdated,
              biased methods to find their most critical assets — their people.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Our founders, former engineering leaders and talent partners, saw
              the friction in the hiring process. Great candidates were lost in
              "black hole" applicant tracking systems, and recruiters were burnt
              out by repetitive manual screening.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              RecruitRank was built to solve this. We've spent thousands of
              hours perfecting an interface that feels like an extension of the
              recruiter's mind, backed by the raw power of enterprise-grade AI.
            </p>
          </div>

          {/* Right photo collage */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="col-span-1 rounded-xl bg-gray-800 h-40 overflow-hidden flex items-center justify-center">
              <span className="text-gray-600 text-xs">Team meeting</span>
            </div>
            <div className="col-span-1 rounded-xl bg-gray-200 h-40 overflow-hidden flex items-center justify-center">
              <span className="text-gray-400 text-xs">Office space</span>
            </div>
            <div className="col-span-1 rounded-xl bg-red-700 p-5 flex items-center justify-center h-36">
              <p className="text-white text-sm font-semibold italic text-center leading-snug">
                "We're not just ranking candidates; we're leveling the playing
                field."
              </p>
            </div>
            <div className="col-span-1 rounded-xl bg-gray-100 h-36 flex items-center justify-center">
              <Rocket size={32} className="text-red-600" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-900 rounded-2xl px-10 py-12 flex flex-col md:flex-row items-center gap-8">
            {/* Copy */}
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-white leading-snug mb-3">
                Ready to upgrade your talent engine?
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                Join hundreds of industry-leading companies using RecruitRank to
                build the teams of tomorrow.
              </p>
              <div className="mt-7 flex gap-3 flex-wrap">
                <button
                  onClick={() => navigate("/schedule-demo")}
                  className="px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Schedule a Demo
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-6 py-2.5 rounded-lg border border-gray-600 text-white text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                >
                  Get Started Free <ArrowUpRight size={14} />
                </button>
              </div>
            </div>

            {/* Decorative icon block */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-red-700 flex items-center justify-center">
                <TrendingUp size={48} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}