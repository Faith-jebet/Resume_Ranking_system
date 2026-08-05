import React, { useState, useEffect } from "react";
import {
  Factory,
  Cog,
  Wrench,
  HardHat,
  Truck,
  BadgeCheck,
  ShieldCheck,
  UtensilsCrossed,
  Fuel,
  Shirt,
  Car,
  FlaskConical,
  Cpu,
  Briefcase,
  Building2,
  Wheat,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Banknote,
  Mail,
  Plus,
  X,
  Edit,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";

import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";

import { industrialCategories } from "../data/IndustrialCategories";

/* ------------------------------------------------------------------ */
/* Brand tokens — keep identical in the listings file so both pages    */
/* feel like one product.                                              */
/* ------------------------------------------------------------------ */
export const BRAND = {
  red: "#A11C1C",
  redDark: "#7A1414",
  ink: "#1A1512",
  body: "#6E5C55",
  cream: "#FAF7F3",
  card: "#FFFFFF",
  chip: "#F6E3E0",
};

/* ------------------------------------------------------------------ */
/* The data file stores icons as strings (e.g. "Factory") so it stays  */
/* JSON-friendly. This map resolves that string to the real component. */
/* Exported so the job-matches page can resolve the same icons.        */
/* ------------------------------------------------------------------ */
export const ICON_MAP = {
  Factory,
  Cog,
  Wrench,
  HardHat,
  Truck,
  BadgeCheck,
  ShieldCheck,
  UtensilsCrossed,
  Fuel,
  Shirt,
  Car,
  FlaskConical,
  Cpu,
  Briefcase,
  Building2,
  Wheat,
};

export function resolveIcon(name) {
  return ICON_MAP[name] || Briefcase;
}

// Re-exported under the name the listings page expects, so it can keep
// importing `CATEGORIES` without caring where the data actually lives.
export const CATEGORIES = industrialCategories;

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: BRAND.cream }}>
      <div className="absolute -right-10 -top-6 hidden sm:block opacity-[0.06] pointer-events-none">
        <Banknote size={320} color={BRAND.red} strokeWidth={1} />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-16 pb-14">
        <h1
          className="text-4xl sm:text-5xl font-extrabold leading-[1.05] max-w-2xl"
          style={{ color: BRAND.ink }}
        >
          Fast AI <span style={{ color: BRAND.red }} className="italic">Job Engine</span> and Tracking
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: BRAND.body }}>
          Explore specialized career paths across Kenya's fastest-growing sectors. From
          industrial automation to sustainable agriculture, let FAJET match and rank
          roles against your profile.
        </p>
        <div className="mt-7 flex flex-wrap gap-6">
          <span
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: BRAND.red }}
          >
            <CheckCircle2 size={15} /> Verified employers
          </span>
          <span
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: BRAND.red }}
          >
            <TrendingUp size={15} /> High growth fields
          </span>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category, onViewJobs }) {
  const Icon = resolveIcon(category.icon);
  const isDark = category.style === "dark";
  const openRoles = category.open_roles || category.openRoles || category.positions || 0;
  const description = category.description || category.blurb || "";

  const base =
    "group relative rounded-2xl border flex flex-col justify-between p-6 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 h-full";

  if (isDark) {
    return (
      <div
        onClick={() => onViewJobs(category)}
        className={`${base} hover:shadow-lg`}
        style={{ backgroundColor: BRAND.red, borderColor: BRAND.red }}
      >
        <div>
          <div className="h-10 w-10 rounded-lg bg-white/15 flex items-center justify-center mb-4">
            <Icon size={20} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{category.title}</h3>
          <p className="text-sm text-white/85 leading-relaxed">{description}</p>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/15 text-white">
            {openRoles.toLocaleString()} {category.positions ? 'positions' : 'open roles'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewJobs(category);
            }}
            className="text-xs font-bold uppercase tracking-wider bg-white px-4 py-2.5 rounded-lg flex items-center gap-1.5 group-hover:gap-2.5 transition-all shrink-0"
            style={{ color: BRAND.red }}
          >
            Explore <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onViewJobs(category)}
      className={`${base} hover:shadow-lg`}
      style={{ backgroundColor: BRAND.card, borderColor: "#ECE5DF" }}
    >
      <div>
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mb-4"
          style={{ backgroundColor: BRAND.chip }}
        >
          <Icon size={20} style={{ color: BRAND.red }} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: BRAND.ink }}>
          {category.title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: BRAND.body }}>
          {description}
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span
          className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "#F2EEE8", color: BRAND.body }}
        >
          {openRoles.toLocaleString()} {category.positions ? 'positions' : 'open roles'}
        </span>
        <span
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all"
          style={{ color: BRAND.red }}
        >
          View jobs <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
}

function CategoryGrid({ onViewJobs, categories = [], onAddSpecialization }) {
  return (
    <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: BRAND.ink }}>
            Browse by specialization
          </h2>
          <p className="mt-2 text-sm max-w-md" style={{ color: BRAND.body }}>
            Click on a category to view active listings, ranked each by RecruitAI
            against the job description.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="text-xs font-bold uppercase tracking-wider shrink-0"
            style={{ color: BRAND.body }}
          >
            {categories.length} specializations
          </span>
          <button
            onClick={onAddSpecialization}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-800 text-white text-sm font-semibold hover:bg-red-500 transition-colors shrink-0"
          >
            <Plus size={16} />
            Add Specialization
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} onViewJobs={onViewJobs} />
        ))}
      </div>
    </section>
  );
}

function NotifySection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-10">
      <div
        className="rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        style={{ backgroundColor: "#EFEBE5" }}
      >
        <div className="max-w-md">
          <h3 className="text-2xl font-extrabold" style={{ color: BRAND.ink }}>
            Don't see your field?
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: BRAND.body }}>
            Sign up for customized alerts. We'll notify you as soon as new roles in your
            specific area of expertise are posted by verified Kenyan firms.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) setSubmitted(true);
          }}
          className="flex flex-col gap-2 w-full sm:w-auto"
        >
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="px-4 py-3 rounded-lg border text-sm w-full sm:w-72 outline-none focus:ring-2"
              style={{ borderColor: "#DDD3C8", color: BRAND.ink }}
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white shrink-0"
              style={{ backgroundColor: BRAND.red }}
            >
              Notify me
            </button>
          </div>
          <span className="text-[11px]" style={{ color: BRAND.body }}>
            {submitted ? "You're on the list — no spam, only opportunities." : "No spam. Only opportunities."}
          </span>
        </form>
      </div>
    </section>
  );
}

function AddCategoryModal({ isOpen, onClose, onSave, editingCategory, mode = "category" }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    open_roles: 0,
    positions: 0,
    icon: "Briefcase",
    style: "light",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        title: editingCategory.title || "",
        description: editingCategory.description || editingCategory.blurb || "",
        open_roles: editingCategory.open_roles || 0,
        positions: editingCategory.positions || 0,
        icon: editingCategory.icon || "Briefcase",
        style: editingCategory.style || "light",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        open_roles: 0,
        positions: 0,
        icon: "Briefcase",
        style: "light",
      });
    }
  }, [editingCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = mode === "category" ? "Job Category" : "Specialization";
  const iconOptions = [
    "Factory", "Cog", "Wrench", "HardHat", "Truck", "BadgeCheck", 
    "ShieldCheck", "UtensilsCrossed", "Fuel", "Shirt", "Car", 
    "FlaskConical", "Cpu", "Briefcase", "Building2", "Wheat"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {editingCategory ? `Edit ${title}` : `Add New ${title}`}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder={`Enter ${title.toLowerCase()} title`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-[80px]"
                placeholder={`Enter ${title.toLowerCase()} description`}
              />
            </div>
            
            {mode === "category" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Open Roles
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.open_roles}
                  onChange={(e) => setFormData({...formData, open_roles: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Number of open roles"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Open Positions
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.positions}
                  onChange={(e) => setFormData({...formData, positions: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Number of open positions"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {iconOptions.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style
              </label>
              <select
                value={formData.style}
                onChange={(e) => setFormData({...formData, style: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </form>
        
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            type="button"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {editingCategory ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobCategoriesPage({ onViewJobs = () => {} }) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSpecialization, setEditingSpecialization] = useState(null);
  const [categories, setCategories] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories and specializations from API
      const [categoriesRes, specializationsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/categories`).then(res => res.ok ? res.json() : []),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/specializations`).then(res => res.ok ? res.json() : [])
      ]);
      
      // Use API data if available, otherwise fallback to static data
      const finalCategories = categoriesRes && categoriesRes.length > 0 ? categoriesRes : industrialCategories;
      const finalSpecializations = specializationsRes && specializationsRes.length > 0 ? specializationsRes : industrialCategories;
      
      setCategories(finalCategories);
      setSpecializations(finalSpecializations);
      
      console.log("Categories loaded:", finalCategories.length);
      console.log("Specializations loaded:", finalSpecializations.length);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to static data
      setCategories(industrialCategories);
      setSpecializations(industrialCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async (data) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = editingCategory ? `${baseUrl}/api/categories/${editingCategory.id}` : `${baseUrl}/api/categories`;
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to save category');
      
      await fetchData();
      setEditingCategory(null);
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    }
  };

  const handleSaveSpecialization = async (data) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = editingSpecialization ? `${baseUrl}/api/specializations/${editingSpecialization.id}` : `${baseUrl}/api/specializations`;
      const method = editingSpecialization ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to save specialization');
      
      await fetchData();
      setEditingSpecialization(null);
      setShowSpecializationModal(false);
    } catch (error) {
      console.error('Error saving specialization:', error);
      throw error;
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete category');
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleDeleteSpecialization = async (specializationId) => {
    if (!confirm('Are you sure you want to delete this specialization?')) return;
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/specializations/${specializationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete specialization');
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting specialization:', error);
      alert('Failed to delete specialization');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleEditSpecialization = (specialization) => {
    setEditingSpecialization(specialization);
    setShowSpecializationModal(true);
  };

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BRAND.cream }}>
      <Navbar />

      <AddCategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
        mode="category"
      />

      <AddCategoryModal
        isOpen={showSpecializationModal}
        onClose={() => {
          setShowSpecializationModal(false);
          setEditingSpecialization(null);
        }}
        onSave={handleSaveSpecialization}
        editingCategory={editingSpecialization}
        mode="specialization"
      />

      <Hero />
      
      <CategoryGrid 
        onViewJobs={onViewJobs} 
        categories={specializations}
        onAddSpecialization={() => {
          setEditingSpecialization(null);
          setShowSpecializationModal(true);
        }}
      />

      <NotifySection />
      <Footer />
    </div>
  );
}