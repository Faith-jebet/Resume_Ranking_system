import React from 'react';

export function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.12),_transparent_36%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-slate-500 shadow-sm backdrop-blur">
              {eyebrow}
            </div>
            <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              {description}
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              ['Protected hiring workspace', 'Keep candidate data and reviews secure.'],
              ['Faster shortlisting', 'Rank resumes and surface top candidates quickly.'],
              ['Clear review flow', 'A clean dashboard for confident hiring decisions.'],
            ].map(([heading, text]) => (
              <div key={heading} className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-slate-900">{heading}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:p-8">
            {children}
            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}