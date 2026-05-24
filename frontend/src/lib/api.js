const API_BASE = import.meta.env.VITE_API_URL || "https://recruitai-backend-418779851337.us-central1.run.app";


const TOKEN_KEY = 'recruitai_auth_token';

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
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Send real resume files + JD file to the backend for AI ranking.
 *
 * @param {string}   jobTitle        - The job title entered by the user
 * @param {File[]}   resumeFiles     - Array of File objects (PDF/DOCX)
 * @param {File|null} jdFile         - Job description file (PDF/DOCX/TXT), optional
 * @param {object[]} gmailCandidates - Candidates already fetched from Gmail
 */
export async function matchCandidates(
  jobTitle,
  resumeFiles = [],
  jdFile = null,
  gmailCandidates = []
) {
  const formData = new FormData();

  // Job title (required)
  formData.append("job_title", jobTitle);

  // Resume files
  resumeFiles.forEach((file) => {
    formData.append("resumes", file);
  });

  // Job description file (optional)
  if (jdFile) {
    formData.append("job_description", jdFile);
  }

  // Gmail candidates as JSON string
  if (gmailCandidates.length > 0) {
    formData.append("gmail_candidates", JSON.stringify(gmailCandidates));
  }

  const response = await fetch(`${API_BASE}/api/match`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — browser sets it automatically with boundary
  });

  return parseResponse(response);
}

/**
 * Fetch resumes from Gmail via the backend.
 *
 * @param {string} subject - Email subject filter
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function loginUser(payload) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function fetchCurrentUser(token = getStoredToken()) {
  if (!token) return null;

  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}