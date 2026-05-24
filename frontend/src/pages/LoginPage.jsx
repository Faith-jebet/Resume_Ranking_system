import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && !isBootstrapping) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="RecruitAI Access"
      title="Welcome back"
      description="Sign in to review candidates, rank resumes, and keep your hiring workflow moving."
      footer={<p className="text-sm text-slate-600">New here? <Link to="/signup" className="font-semibold text-blue-700 hover:text-blue-800">Create an account</Link>.</p>}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Login</h2>
        <p className="text-sm leading-6 text-slate-600">Use your account to continue to the dashboard.</p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            placeholder="Enter your password"
            required
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Login to dashboard'}
        </button>
      </form>
    </AuthLayout>
  );
}