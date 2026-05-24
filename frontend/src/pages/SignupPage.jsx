import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, isBootstrapping } = useAuth();
  const [name, setName] = useState('');
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
      await signup({ name, email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="RecruitAI Access"
      title="Create your account"
      description="Set up your workspace in a few steps, then move straight into ranking candidates."
      footer={<p className="text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">Login</Link>.</p>}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Sign up</h2>
        <p className="text-sm leading-6 text-slate-600">Create your access and get redirected to the dashboard immediately.</p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            placeholder="Your name"
            required
          />
        </label>

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
            placeholder="Create a password"
            required
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}