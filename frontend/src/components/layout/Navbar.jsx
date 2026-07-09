import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

const NAV_LINKS = [
  { to: "/job-categories",  label: "Job Categories",  exact: true  },
  { to: "/job-vacancy",     label: "Rank Jobs",        exact: true  },
  { to: "/document-review", label: "Document Review",  exact: true },
  { to: "/ranked-results",  label: "Ranked Results",   exact: true  },
];

export function Navbar() {
  const { logout } = useAuth();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('recruitrank-theme');
    return saved === 'dark';
  });

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('recruitrank-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('recruitrank-theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => { logout(); navigate("/"); };
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const isActive = (link) =>
    link.exact
      ? location.pathname === link.to
      : location.pathname.startsWith(link.to);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">

        {/* Logo */}
        <Link
          to="/job-categories"
          className="flex items-center shrink-0 overflow-hidden"
          style={{ width: 100, height: 100, borderRadius: 12 }}
        >
          <img
            src="https://res.cloudinary.com/dduqhj5oh/image/upload/v1782414473/Fajet_Monogram_Logo_with_Navy_and_Teal-removebg-preview_ofexwn.png"
            alt="RecruitRank logo"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-0.5 list-none m-0 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors",
                  isActive(link)
                    ? "text-brand font-semibold bg-brand-light"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Dark/Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>

          {/* Mobile toggle */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden flex flex-col px-4 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700 gap-1 bg-white dark:bg-gray-900">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(link)
                  ? "text-brand bg-brand-light font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {link.label}
            </Link>
          ))}

          <Link
            to="/about"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === "/about"
                ? "text-brand bg-brand-light font-semibold"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            About Us
          </Link>

          {/* Dark mode toggle for mobile */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-1"
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
