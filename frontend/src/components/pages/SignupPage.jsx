import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Footer from "../layout/Footer";
import {
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  LayoutDashboard,
} from "lucide-react";

// Google/GitHub icons as SVG components
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

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#181717">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
    // Clear field-specific validation error
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: null,
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate("/job-categories");
    } catch (err) {
      setError(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const password = formData.password;
    if (!password) return null;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    return strength;
  };

  const strength = passwordStrength();

  const features = [
    {
      icon: ShieldCheck,
      title: "Protected workspace",
      description:
        "Your candidate data and internal reviews are secured with enterprise-grade encryption.",
    },
    {
      icon: Zap,
      title: "Faster shortlisting",
      description:
        "Rank thousands of resumes in seconds and surface top matches automatically.",
    },
    {
      icon: LayoutDashboard,
      title: "Clear review flow",
      description:
        "A clean, focused dashboard designed for confident, collaborative hiring decisions.",
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
            Create your <span className="text-red-600">account</span>
          </h1>
          <p className="mt-3 text-sm text-gray-500 max-w-sm">
            Set up your workspace in a few steps, then move straight into
            surfacing elite talent with AI-driven ranking.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              const isLast = i === features.length - 1;
              return (
                <div
                  key={feature.title}
                  className={`rounded-xl border border-gray-200 bg-white/70 p-4 ${
                    isLast ? "col-span-2" : ""
                  }`}
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

        {/* Right: Signup Card */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 border-t-4 border-t-red-600 p-8">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold text-gray-900">Sign up</h2>
              <p className="mt-1 text-xs text-gray-500">
                Create your access and get redirected to the dashboard
                immediately.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-800">Sign Up Failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${
                      validationErrors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Full name"
                  />
                </div>
                {validationErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
                )}
              </div>

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
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${
                      validationErrors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="work@company.com"
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${
                      validationErrors.password ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Min. 8 characters"
                  />
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
                )}

                {/* Password Strength Indicator */}
                {formData.password && strength !== null && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition ${
                            level <= strength
                              ? strength <= 1
                                ? "bg-red-500"
                                : strength === 2
                                ? "bg-amber-500"
                                : strength === 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Password strength: {
                        strength <= 1 ? "Weak" : strength === 2 ? "Fair" : strength === 3 ? "Good" : "Strong"
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${
                      validationErrors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="••••••••"
                  />
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <CheckCircle size={16} className="text-green-500" />
                    </div>
                  )}
                </div>
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-0.5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="terms" className="ml-2 text-xs text-gray-600">
                  I agree to the{" "}
                  <button type="button" className="font-semibold text-red-600 hover:text-red-700">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button type="button" className="font-semibold text-red-600 hover:text-red-700">
                    Privacy Policy
                  </button>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-bold transition shadow-sm disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-red-600 hover:text-red-700 transition"
                >
                  Login.
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
                  Secure login
                </span>
              </div>
            </div>

            {/* SSO Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-xs font-medium text-gray-400 cursor-not-allowed opacity-60"
                title="Google SSO not configured"
              >
                <GoogleIcon />
              </button>
              <button
                type="button"
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-xs font-medium text-gray-400 cursor-not-allowed opacity-60"
                title="GitHub SSO not configured"
              >
                <GitHubIcon />
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