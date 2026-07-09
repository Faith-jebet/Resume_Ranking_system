import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Play, Zap, TrendingUp, ArrowUpRight, BarChart2 } from "lucide-react";
import { Pages } from "../layout/Pages";
import Footer from "../layout/Footer";

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ApplicationsPage() {
  const navigate = useNavigate();
  const [avgScore, setAvgScore] = useState(84);
  const [pipelineReady, setPipelineReady] = useState(false);
  const [pipelineCount, setPipelineCount] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem("rr_ranked_results");
    if (raw) {
      try {
        const { candidates } = JSON.parse(raw);
        if (Array.isArray(candidates) && candidates.length > 0) {
          setPipelineReady(true);
          setPipelineCount(candidates.length);
          const scores = candidates.map((c) => c.match_score ?? c.score ?? 0);
          setAvgScore(
            Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          );
        }
      } catch { /* ignore */ }
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f3ee", fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
       <Pages />
      {/* ── HERO ── */}
      <section style={{ background: "linear-gradient(180deg, #f5f3ee 0%, #edeade 100%)", padding: "64px 0 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", display: "flex", alignItems: "flex-start", gap: 64 }}>

          {/* Left copy */}
          <div style={{ flex: "0 0 420px" }}>
            {/* Eyebrow — logo + app name */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fee2e2",
              padding: "5px 14px 5px 5px", borderRadius: 6, marginBottom: 24,
            }}>
              <span style={{
                color: "#b91c1c", fontSize: 11, fontWeight: 800,
                letterSpacing: "0.14em", textTransform: "uppercase",
              }}>
                RecruitAI
              </span>
            </div>

            {/* Headline */}
            <h1 style={{ margin: 0, fontSize: 52, fontWeight: 900, lineHeight: 1.08, color: "#111", letterSpacing: "-0.02em" }}>
              Rank Your Best Talent,{" "}
              <em style={{ color: "#b91c1c", fontStyle: "italic" }}>Faster.</em>
            </h1>

            {/* Body */}
            <p style={{ margin: "20px 0 0", fontSize: 15, lineHeight: 1.7, color: "#555", maxWidth: 360 }}>
              Transform your hiring process with AI-driven candidate scoring and multi-dimensional skill analytics. Decisions backed by data, not gut feelings.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 14, marginTop: 36, alignItems: "center" }}>
              <button
                onClick={() => navigate("/signup")}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#b91c1c", color: "#fff",
                  fontSize: 14, fontWeight: 700,
                  padding: "13px 24px", border: "none", borderRadius: 6, cursor: "pointer",
                }}
              >
                Get Started for Free <span style={{ fontSize: 16 }}>→</span>
              </button>
              <button
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "transparent", color: "#222",
                  fontSize: 14, fontWeight: 600,
                  padding: "12px 20px", border: "1.5px solid #ccc", borderRadius: 6, cursor: "pointer",
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", border: "1.5px solid #555",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Play size={9} fill="#555" color="#555" />
                </span>
                Watch Demo
              </button>
            </div>

            <p style={{ marginTop: 18, fontSize: 13, color: "#666" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#b91c1c", fontWeight: 600, textDecoration: "none" }}>
                Log in
              </Link>
            </p>
          </div>

          {/* Right — floating UI card */}
          <div style={{ flex: 1, position: "relative", paddingTop: 8 }}>
            {/* Main card */}
            <div style={{
              background: "#fff", borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
              overflow: "hidden", border: "1px solid #e8e8e8",
            }}>
              {/* Card chrome */}
              <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fca5a5" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fca5a5", opacity: 0.6 }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fca5a5", opacity: 0.3 }} />
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#aaa", fontWeight: 500 }}>Candidate Ranking Engine</span>
              </div>

              {/* Candidate rows */}
              {[
                { name: "Alex Rivera", role: "Senior Engineer", score: 98 },
                { name: "Sarah Chen",  role: "Fullstack Lead",  score: 84 },
              ].map((c, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: "1px solid #f5f5f5",
                  borderLeft: i === 0 ? "3px solid #b91c1c" : "3px solid transparent",
                  background: i === 0 ? "#fff" : "#fafafa",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, color: "#999",
                    }}>
                      ◉
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111" }}>{c.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#999", marginTop: 2 }}>{c.role}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#b91c1c" }}>{c.score}%</p>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: "0.08em", textTransform: "uppercase" }}>Match Score</p>
                  </div>
                </div>
              ))}

              {/* Skill gap */}
              <div style={{ padding: "24px 20px", background: "#f9f9f9", textAlign: "center", minHeight: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Pentagon SVG */}
                <div style={{ position: "relative", width: 120 }}>
                  <svg viewBox="0 0 120 110" width="120" aria-hidden>
                    <polygon points="60,8 108,40 90,96 30,96 12,40" fill="none" stroke="#e0e0e0" strokeWidth="1.5" />
                    <polygon points="60,20 92,44 80,82 40,82 28,44" fill="none" stroke="#e0e0e0" strokeWidth="1" />
                    <polygon points="60,30 78,48 70,68 50,68 42,48" fill="rgba(185,28,28,0.15)" stroke="#b91c1c" strokeWidth="1.5" />
                  </svg>
                  <p style={{ position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)", margin: 0, fontSize: 10, color: "#aaa", whiteSpace: "nowrap", fontWeight: 500 }}>
                    Skill Gap Analysis Grid
                  </p>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div style={{
              position: "absolute", bottom: -20, left: 20,
              background: "#111", borderRadius: 10, padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}>
              <div style={{ width: 36, height: 36, background: "#b91c1c", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={16} color="#fff" fill="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>4.2x</p>
                <p style={{ margin: 0, fontSize: 11, color: "#888", marginTop: 3 }}>Faster Time-to-Hire</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div style={{ background: "#edeade", paddingTop: 60, paddingBottom: 40 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", textAlign: "center" }}>
          <p style={{ margin: "0 0 28px", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>
            Trusted by{" "}
            <span style={{ color: "#b91c1c" }}>High-Growth Engineering</span> Teams
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 52, flexWrap: "wrap" }}>
            {["TECHFLOW", "VELOCITY", "QUANTUM", "NEXUS AI", "STELAR"].map((b) => (
              <span key={b} style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.14em", color: "#c0bdb5", textTransform: "uppercase" }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRECISION TOOLS ── */}
      <section style={{ background: "#fff", padding: "80px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px" }}>

          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ margin: 0, fontSize: 34, fontWeight: 900, color: "#111", letterSpacing: "-0.01em" }}>
              Precision Tools for Modern HR
            </h2>
            <div style={{ width: 44, height: 3, background: "#b91c1c", margin: "14px auto 0", borderRadius: 2 }} />
          </div>

          {/* Top row: AI Scoring (left+mid) + Analytics (right) */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>

            {/* AI Scoring card */}
            <div style={{
              flex: "0 0 calc(66.6% - 8px)",
              border: "1px solid #e8e8e8", borderRadius: 12, padding: "36px",
              display: "flex", gap: 36,
            }}>
              {/* Left text */}
              <div style={{ flex: "0 0 220px" }}>
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 8, border: "1px solid #e8e8e8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 18,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4"/><path d="M12 12c-4 0-7 2-7 4.5V18h14v-1.5c0-2.5-3-4.5-7-4.5z"/>
                    <path d="M16 3.5c1.5.5 2.5 1.8 2.5 3.5s-1 3-2.5 3.5"/>
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "#111" }}>AI-Powered Scoring</h3>
                <p style={{ margin: "0 0 16px", fontSize: 13, lineHeight: 1.65, color: "#b91c1c", fontWeight: 500 }}>
                  Automated ranking based on complex job requirements. Our neural engine parses multi-format resumes against live industry standards to find the 1% that truly matters.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Semantic Intent Analysis", "Unbiased Scoring Algorithms"].map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "#444" }}>
                      <CheckCircle2 size={14} color="#b91c1c" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — mock list UI */}
              <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div style={{ width: "100%", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 14px", borderBottom: i < 4 ? "1px solid #f0f0f0" : "none",
                      background: "#fafafa",
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 1 ? "#b91c1c" : "#e0e0e0", flexShrink: 0 }} />
                      <div style={{ height: 8, borderRadius: 4, background: "#e8e8e8", width: `${[70, 55, 80, 45][i - 1]}%` }} />
                      <div style={{ height: 8, borderRadius: 4, background: "#f0f0f0", width: `${[25, 32, 14, 40][i - 1]}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Multi-Dimensional Analytics card */}
            <div style={{
              flex: 1,
              background: "#111", borderRadius: 12, padding: "36px",
              display: "flex", flexDirection: "column",
            }}>
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: "#222",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
              }}>
                <BarChart2 size={18} color="#b91c1c" />
              </div>
              <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.25 }}>
                Multi-Dimensional Analytics
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#888", lineHeight: 1.65 }}>
                Go beyond text matches. Visualize hard skills, soft traits, and cultural alignment on high-density radar charts.
              </p>

              {/* Divider + link */}
              <div style={{ marginTop: "auto", paddingTop: 28, borderTop: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5" }}>Deep Insights</span>
                <TrendingUp size={16} color="#b91c1c" />
              </div>
            </div>
          </div>

          {/* Bottom row: 3 metrics + Executive Dashboard */}
          <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, display: "flex", overflow: "hidden" }}>

            {/* Metrics group */}
            <div style={{ display: "flex", borderRight: "1px solid #e8e8e8" }}>
              {[
                { val: "120", label: "Active Pipelines", dark: false },
                { val: "14d", label: "Avg. Closure",     dark: true  },
                { val: "92%", label: "Retention",        dark: false },
              ].map((m, i) => (
                <div key={m.label} style={{
                  width: 120, padding: "30px 20px", textAlign: "center",
                  background: m.dark ? "#111" : "#f9f9f9",
                  borderRight: i < 2 ? "1px solid #e8e8e8" : "none",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#b91c1c", lineHeight: 1 }}>{m.val}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: m.dark ? "#555" : "#aaa" }}>
                    {m.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Executive Dashboard */}
            <div style={{ flex: 1, padding: "30px 36px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
              {/* Grid icon */}
              <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                {[0,1,2,3].map((i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: 2,
                    background: i < 3 ? "#b91c1c" : "transparent",
                    border: i === 3 ? "1.5px solid #ccc" : "none",
                  }} />
                ))}
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111" }}>Executive Dashboard</h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "#666" }}>
                Centralized control for recruitment leadership. Monitor conversion rates, interviewer efficiency, and candidate flow across all business units{" "}
                <span style={{ color: "#b91c1c", fontWeight: 600 }}>in real-time.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{
        background: "#0f0f0f",
        backgroundImage: "radial-gradient(circle, rgba(185,28,28,0.35) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        padding: "96px 48px",
        textAlign: "center",
      }}>
        <h2 style={{ margin: 0, fontSize: 42, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>
          Ready to hire your next <span style={{ color: "#ef4444" }}>A-Player?</span>
        </h2>
        <p style={{ margin: "18px auto 0", fontSize: 15, color: "#888", maxWidth: 520, lineHeight: 1.65 }}>
          Join 500+ companies using RecruitRank to build elite teams with surgical precision.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/signup")}
            style={{
              background: "#b91c1c", color: "#fff",
              fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "16px 40px", border: "none", borderRadius: 6, cursor: "pointer",
            }}
          >
            Get Started for Free
          </button>
          <button
            style={{
              background: "transparent", color: "#fff",
              fontSize: 14, fontWeight: 600,
              padding: "15px 36px", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 6, cursor: "pointer",
            }}
          >
            Talk to an Expert
          </button>
        </div>
        <p style={{ margin: "20px 0 0", fontSize: 12, color: "#555" }}>
          No credit card required. 14-day free trial on Pro plans.
        </p>
        <p style={{ marginTop: 12, fontSize: 13, color: "#777" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#ef4444", fontWeight: 600, textDecoration: "none" }}>
            Log in
          </Link>
        </p>
      </section>

      <Footer />
    </div>
  );
}