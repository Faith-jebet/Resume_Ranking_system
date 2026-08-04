import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, FileSearch, LogOut, Users } from "lucide-react";
import { cn } from "../lib/utils";

// Tab-based items navigate inside the /dashboard page (App.jsx tabs)
const TAB_ITEMS = [
  { icon: BarChart3, label: "Dashboard" },
  { icon: Users, label: "Candidates" },
];

// Route-based items navigate to a separate page
const ROUTE_ITEMS = [
  { icon: FileSearch, label: "Document Review", path: "/document-review" },
];

export function Sidebar({ activeTab, onTabChange, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-slate-200 bg-white/90 backdrop-blur shadow-sm">
      {/* Logo */}
      <div className="px-6 py-7">
        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2">
          <svg
            className="size-4 text-blue-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
          </svg>
          <span className="text-base font-bold text-blue-800">RecruitAI</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {TAB_ITEMS.map((item) => {
          const isActive = isDashboard && activeTab === item.label;
          return (
            <button
              key={item.label}
              onClick={() => {
                // If we're on another page, go back to /dashboard first
                if (!isDashboard) navigate("/dashboard");
                onTabChange?.(item.label);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-800 border border-blue-100"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
              )}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {ROUTE_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-800 border border-blue-100"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
              )}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
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
