const API_BASE =
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
  gmailCandidates = []
) {
  const formData = new FormData();
  formData.append("job_title", jobTitle);
  resumeFiles.forEach((file) => formData.append("resumes", file));
  if (jdFile) formData.append("job_description", jdFile);
  if (gmailCandidates.length > 0)
    formData.append("gmail_candidates", JSON.stringify(gmailCandidates));

  const response = await fetch(`${API_BASE}/api/match`, {
    method: "POST",
    body: formData,
  });
  return parseResponse(response);
}

/**
 * Fetch resumes from Gmail via the backend.
 */
export async function fetchGmailResumes(subject = "Resume Analyzing") {
  const response = await fetch(`${API_BASE}/api/gmail/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject }),
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