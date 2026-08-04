export const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const TOKEN_KEY = "recruitai_auth_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Server error: ${response.status}`);
  }
  return response.json();
}

/**
 * Send real resume files + JD file to the backend for AI ranking.
 */
export async function matchCandidates(
  jobTitle,
  resumeFiles = [],
  jdFile = null,
  gmailCandidates = [],
  categoryId = null,
  categoryTitle = null
) {
  const formData = new FormData();
  formData.append("job_title", jobTitle);
  resumeFiles.forEach((file) => formData.append("resumes", file));
  if (jdFile) formData.append("job_description", jdFile);
  if (gmailCandidates.length > 0)
    formData.append("gmail_candidates", JSON.stringify(gmailCandidates));
  if (categoryId)
    formData.append("category_id", categoryId);
  if (categoryTitle)
    formData.append("category_title", categoryTitle);

  const response = await fetch(`${API_BASE}/api/match`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getStoredToken()}` },
    body: formData,
  });
  return parseResponse(response);
}

export async function fetchRecruiterJobs() {
  const response = await fetch(`${API_BASE}/api/recruiter/jobs`, {
    headers: { Authorization: `Bearer ${getStoredToken()}` },
  });
  return parseResponse(response);
}

export async function fetchRecruiterRankings(jobId) {
  const response = await fetch(`${API_BASE}/api/recruiter/rankings/${jobId}`, {
    headers: { Authorization: `Bearer ${getStoredToken()}` },
  });
  return parseResponse(response);
}

export async function deleteRecruiterJob(jobId) {
  const response = await fetch(`${API_BASE}/api/recruiter/jobs/${jobId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getStoredToken()}` },
  });
  return parseResponse(response);
}

/**
 * Fetch resumes from Gmail via the backend.
 * @param {string} subject
 * @param {string} [startDate]
 * @param {string} [endDate]
 */

export async function fetchGmailResumes(subject = "Resume Analyzing", startDate = null, endDate = null) {
  const response = await fetch(`${API_BASE}/api/gmail/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getStoredToken()}`,
    },
    body: JSON.stringify({
       subject,
       start_date: startDate || null,
       end_date: endDate || null,
       }),
  });
  return parseResponse(response);
}

export async function registerUser(payload) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function loginUser(payload) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function fetchCurrentUser(token = getStoredToken()) {
  if (!token) return null;
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response);
}

// ── Document Review helpers ──────────────────────────────────────────────────

/**
 * Fetch candidate list + JD metadata for a given import session.
 *
 * @param {number} importId
 * @returns {{ import_id, candidates, jd }}
 */
export async function fetchImportDocuments(importId) {
  const response = await fetch(`${API_BASE}/api/imports/${importId}/documents`, {
    headers: { Authorization: `Bearer ${getStoredToken()}` },
  });
  return parseResponse(response);
}

/**
 * Build the URL that streams a document's PDF bytes.
 * Used directly as the `file` prop in react-pdf's <Document>.
 *
 * We pass the JWT in a query param because react-pdf opens the URL
 * in an internal fetch and cannot set custom headers.
 *
 * @param {number} docId
 * @returns {string} URL string
 */
export function documentContentUrl(docId) {
  const token = getStoredToken();
  // token in query param is acceptable here because:
  //  1. the URL is only used for same-session PDF rendering
  //  2. it is never logged / persisted by the frontend
  return `${API_BASE}/api/documents/${docId}/content?token=${encodeURIComponent(token ?? "")}`;
}


// ── Categories & Specializations API ─────────────────────────────────────────

export async function fetchCategories() {
  const response = await fetch(`${API_BASE}/api/categories`, {
    headers: { Authorization: `Bearer ${getStoredToken()}` },
  });
  return parseResponse(response);
}

export async function createCategory(categoryData) {
  const response = await fetch(`${API_BASE}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getStoredToken()}`,
    },
    body: JSON.stringify(categoryData),
  });
  return parseResponse(response);
}

export async function updateCategory(categoryId, categoryData) {
  const response = await fetch(`${API_BASE}/api/categories/${categoryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getStoredToken()}`,
    },
    body: JSON.stringify(categoryData),
  });
  return parseResponse(response);
}

export async function deleteCategory(categoryId) {
  const response = await fetch(`${API_BASE}/api/categories/${categoryId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getStoredToken()}` },
  });
  return parseResponse(response);
}

export async function fetchSpecializations() {
  const response = await fetch(`${API_BASE}/api/specializations`, {
    headers: { Authorization: `Bearer ${getStoredToken()}` },
  });
  return parseResponse(response);
}

export async function createSpecialization(specializationData) {
  const response = await fetch(`${API_BASE}/api/specializations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getStoredToken()}`,
    },
    body: JSON.stringify(specializationData),
  });
  return parseResponse(response);
}

export async function updateSpecialization(specializationId, specializationData) {
  const response = await fetch(`${API_BASE}/api/specializations/${specializationId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getStoredToken()}`,
    },
    body: JSON.stringify(specializationData),
  });
  return parseResponse(response);
}

export async function deleteSpecialization(specializationId) {
  const response = await fetch(`${API_BASE}/api/specializations/${specializationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getStoredToken()}` },
  });
  return parseResponse(response);
}
