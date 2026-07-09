import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  X,
  ChevronDown,
  Code2,
  Database,
  Layers,
  Paintbrush,
  ShieldCheck,
  BarChart3,
  Cloud,
  Cpu,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

const JOB_CATEGORIES = [
  {
    label: "Software Engineering",
    icon: Code2,
    href: "/job-vacancy?role=software-engineering",
  },
  {
    label: "Data Science & Analytics",
    icon: BarChart3,
    href: "/job-vacancy?role=data-science",
  },
  {
    label: "DevOps & Cloud",
    icon: Cloud,
    href: "/job-vacancy?role=devops-cloud",
  },
  {
    label: "Product Management",
    icon: Layers,
    href: "/job-vacancy?role=product-management",
  },
  {
    label: "UI/UX Design",
    icon: Paintbrush,
    href: "/job-vacancy?role=ui-ux-design",
  },
  {
    label: "Cybersecurity",
    icon: ShieldCheck,
    href: "/job-vacancy?role=cybersecurity",
  },
  {
    label: "Machine Learning & AI",
    icon: Cpu,
    href: "/job-vacancy?role=machine-learning",
  },
  {
    label: "Database Administration",
    icon: Database,
    href: "/job-vacancy?role=database-administration",
  },
];

export function Pages() {
  const { login, signup, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileJobsOpen, setMobileJobsOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const isJobVacancyActive = location.pathname === "/job-vacancy";

  const handleSignup = () => {
    navigate("/signup");
  }

  const handleLogin = () => {
    navigate("/login");
  };
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
        {/* Logo */}
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <img
            src="https://res.cloudinary.com/dduqhj5oh/image/upload/v1782414473/Fajet_Monogram_Logo_with_Navy_and_Teal-removebg-preview_ofexwn.png"
            alt="RecruitAI logo"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
          onClick={handleSignup}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Signup
          </button>

          <button
            onClick={handleLogin}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Login
          </button>

          {/* Mobile toggle */}
          <button
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-800"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden flex flex-col px-4 pb-3 pt-1 border-t border-gray-100 gap-1">
          {/* Job Vacancy expandable section */}
          <button
            onClick={() => setMobileJobsOpen((o) => !o)}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isJobVacancyActive
                ? "text-red-600 bg-red-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
            )}
          >
            Job Vacancy
            <ChevronDown
              size={14}
              className={cn(
                "transition-transform duration-200",
                mobileJobsOpen && "rotate-180",
              )}
            />
          </button>

          {mobileJobsOpen && (
            <div className="ml-3 flex flex-col gap-0.5 border-l-2 border-red-100 pl-3">
              {JOB_CATEGORIES.map(({ label, icon: Icon, href }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => {
                    setMobileOpen(false);
                    setMobileJobsOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icon size={14} className="shrink-0 text-gray-400" />
                  {label}
                </Link>
              ))}
            </div>
          )}

          <Link
            to="/about"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === "/about"
                ? "text-red-600 bg-red-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
            )}
          >
            About Us
          </Link>
        </div>
      )}
    </nav>
  );
}
