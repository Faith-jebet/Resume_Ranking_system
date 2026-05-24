import React from 'react';
import { BarChart3, LogOut, Users } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { icon: BarChart3, label: 'Dashboard' },
  { icon: Users, label: 'Candidates' },
];

export function Sidebar({ activeTab, onTabChange, onLogout }) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white/90 backdrop-blur fixed left-0 top-0 shadow-sm">
      <div className="px-6 py-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-800">
          RecruitAI
        </div>
        <p className="mt-3 text-sm text-slate-500">Candidate ranking workspace</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onTabChange?.(item.label)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              activeTab === item.label
                ? "bg-blue-50 text-blue-800 border border-blue-100"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}