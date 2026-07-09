import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Footer from "../layout/Footer";
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  LayoutDashboard,
} from "lucide-react";

// Google/LinkedIn icons as SVG components
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M15.68 8.18182C15.68 7.61455 15.6291 7.06909 15.5345 6.54545H8V9.64364H12.3055C12.1164 10.64 11.5491 11.4836 10.6982 12.0509V14.0655H13.2945C14.8073 12.6691 15.68 10.6182 15.68 8.18182Z" fill="#4285F4"/>
      <path d="M8 16C10.16 16 11.9709 15.2873 13.2945 14.0655L10.6982 12.0509C9.98545 12.5309 9.07636 12.8218 8 12.8218C5.92 12.8218 4.15273 11.4182 3.52 9.52H0.858182V11.5927C2.17091 14.2036 4.87273 16 8 16Z" fill="#34A853"/>
      <path d="M3.52 9.52C3.36 9.04 3.26909 8.52727 3.26909 8C3.26909 7.47273 3.36 6.96 3.52 6.48V4.40727H0.858182C0.312727 5.49091 0 6.70909 0 8C0 9.29091 0.312727 10.5091 0.858182 11.5927L3.52 9.52Z" fill="#FBBC05"/>
      <path d="M8 3.17818C9.17818 3.17818 10.2255 3.58545 11.0582 4.37818L13.3527 2.08364C11.9673 0.792727 10.1564 0 8 0C4.87273 0 2.17091 1.79636 0.858182 4.40727L3.52 6.48C4.15273 4.58182 5.92 3.17818 8 3.17818Z" fill="#EA4335"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#0A66C2">
      <path d="M14.5 0h-13C0.675 0 0 0.675 0 1.5v13C0 15.325 0.675 16 1.5 16h13c0.825 0 1.5-0.675 1.5-1.5v-13C16 0.675 15.325 0 14.5 0zM4.75 13.5H2.5v-7h2.25v7zM3.625 5.5C2.85 5.5 2.25 4.9 2.25 4.125S2.85 2.75 3.625 2.75 5 3.35 5 4.125 4.4 5.5 3.625 5.5zM13.5 13.5h-2.25V10c0-0.825-0.3-1.5-1.125-1.5-0.6 0-1.05 0.45-1.2 0.9-0.075 0.15-0.075 0.375-0.075 0.6v3.5H6.5v-7h2.25v0.975c0.3-0.45 0.9-1.125 2.1-1.125 1.5 0 2.7 1.05 2.7 3.225V13.5z"/>
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(formData);
      navigate("/job-categories");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: ShieldCheck,
      title: "Protected hiring",
      description: "Keep candidate data and reviews secure.",
    },
    {
      icon: Zap,
      title: "Faster shortlisting",
      description: "Rank resumes and surface top talent quickly.",
    },
    {
      icon: LayoutDashboard,
      title: "Clear review flow",
      description: "A clean dashboard for confident decisions.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
        {/* Left: Brand / Feature Panel */}
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 mb-5">
            <Sparkles size={12} className="text-red-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
              Precision engineered recruitment
            </span>
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Welcome <span className="text-red-600">back</span>
          </h1>
          <p className="mt-3 text-sm text-gray-500 max-w-sm">
            Sign in to review candidates, rank resumes, and keep your hiring
            workflow moving at light speed.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-gray-200 bg-white/70 p-4"
                >
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 mb-3">
                    <Icon size={16} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 border-t-4 border-t-red-600 p-8">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold text-gray-900">Login</h2>
              <p className="mt-1 text-xs text-gray-500">
                Use your account to continue to the dashboard.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-800">Login Failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:text-red-700 transition"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-xs text-gray-600">Remember me</span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-bold transition shadow-sm disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Login to Dashboard"
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                New here?{" "}
                <Link
                  to="/signup"
                  className="font-bold text-red-600 hover:text-red-700 transition"
                >
                  Create an account.
                </Link>
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400 font-medium uppercase tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            {/* SSO Buttons (Disabled) */}
            <div className="flex gap-3">
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-xs font-medium text-gray-400 cursor-not-allowed opacity-60"
                title="Google SSO not configured"
              >
                <GoogleIcon /> Google
              </button>
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-xs font-medium text-gray-400 cursor-not-allowed opacity-60"
                title="LinkedIn SSO not configured"
              >
                <LinkedInIcon /> LinkedIn
              </button>
            </div>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}