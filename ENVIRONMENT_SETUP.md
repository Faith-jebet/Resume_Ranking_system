# Environment Variables Setup Guide

## Overview
This project uses environment variables to manage sensitive configuration across three components:
- **Agent** (Python AI agents)
- **Backend** (FastAPI server)
- **Frontend** (React/Vite app)

---

## Directory Structure

```
resume-ranking-system/
├── Agent/
│   └── .env                    # Agent configuration
├── Backend/
│   └── .env                    # Backend API configuration
├── frontend/
│   ├── .env                    # Frontend development config
│   ├── .env.local             # Local overrides (gitignored)
│   └── .env.production        # Production config
└── Agent/my_agent/config/
    └── credentials.json        # Gmail API OAuth credentials
```

---

## 1. Agent Configuration (`Agent/.env`)

**Purpose:** Configuration for AI agents, LLM access, and Gmail integration

```bash
# Groq LLM API Key (Required)
GROQ_API_KEY="your_groq_api_key_here"

# Optional: Override default model
# GROQ_MODEL="llama-3.3-70b-versatile"

# Optional: Pipeline sleep duration (seconds)
# PIPELINE_SLEEP_SECONDS=2
```

### How to Get Groq API Key:
1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it in `GROQ_API_KEY`

---

## 2. Backend Configuration (`Backend/.env`)

**Purpose:** Backend API server configuration, authentication, and external service credentials

```bash
# API Configuration
VITE_API_URL=http://127.0.0.1:8000

# JWT Authentication (Required)
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
AUTH_SECRET_KEY=your_secret_key_here_at_least_32_characters_long

# Groq API Key (Required - shared with Agent)
GROQ_API_KEY="your_groq_api_key_here"

# Google OAuth for Web SSO (Optional - currently disabled in UI)
GOOGLE_CLIENT_ID=your_web_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_web_oauth_client_secret

# Database (Optional - uses default SQLite path if not set)
# DB_PATH=./custom_path/resumes.db
```

### Generate AUTH_SECRET_KEY:
```bash
# Windows (PowerShell)
python -c "import secrets; print(secrets.token_hex(32))"

# Or use this one-liner
python -c "import os; print(os.urandom(32).hex())"
```

---

## 3. Frontend Configuration (`frontend/.env`)

**Purpose:** Frontend app configuration for API communication

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000

# Google OAuth for Web SSO (Optional - currently disabled)
GOOGLE_CLIENT_ID=your_web_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_web_oauth_client_secret

# Note: In Vite, only variables prefixed with VITE_ are exposed to the client
```

### Frontend `.env.local` (Create this for local overrides):
```bash
# This file is gitignored and won't be committed
VITE_API_URL=http://localhost:8000
```

### Frontend `.env.production` (For production deployment):
```bash
# Production Backend URL
VITE_API_URL=https://your-production-backend.com
```

---

## 4. Gmail API Configuration (`Agent/my_agent/config/credentials.json`)

**Purpose:** OAuth 2.0 credentials for Gmail API (server-side resume fetching)

**⚠️ IMPORTANT:** This is NOT the same as Web SSO credentials!

### Structure:
```json
{
  "installed": {
    "client_id": "your_desktop_app_client_id.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "your_desktop_app_client_secret",
    "redirect_uris": ["http://localhost"]
  }
}
```

**Setup:** Follow the [GMAIL_SETUP_GUIDE.md](./GMAIL_SETUP_GUIDE.md)

---

## Understanding OAuth Credential Types

### 🖥️ Desktop App (credentials.json)
- **Used for:** Gmail API (fetch resumes from inbox)
- **OAuth Type:** Desktop/Installed Application
- **Authentication:** One-time consent → stores token.pickle
- **Location:** `Agent/my_agent/config/credentials.json`
- **Redirect URI:** `http://localhost` or `urn:ietf:wg:oauth:2.0:oob`

### 🌐 Web Application (.env files)
- **Used for:** User login via Google SSO (Sign in with Google button)
- **OAuth Type:** Web Application
- **Authentication:** Per-session browser redirect
- **Location:** `Backend/.env` and `frontend/.env`
- **Redirect URI:** `http://localhost:8000/auth/google/callback`

### Key Differences:

| Feature | Desktop App (Gmail API) | Web App (SSO) |
|---------|------------------------|---------------|
| Purpose | Fetch emails | User authentication |
| User flow | One-time consent | Every login |
| Token storage | token.pickle (persistent) | Session/cookies |
| Runs on | Backend/Agent | Frontend + Backend |
| Current status | Needs setup | Disabled (not needed) |

---

## Security Checklist

### ✅ Files in `.gitignore`:
- [x] `Agent/.env`
- [x] `Backend/.env`
- [x] `frontend/.env.local`
- [x] `Agent/my_agent/config/credentials.json`
- [x] `Agent/my_agent/tools/token.pickle`

### ✅ Best Practices:
- [x] Never commit `.env` files with real values
- [x] Use `.env.example` files as templates
- [x] Rotate credentials if exposed
- [x] Use different credentials for dev/staging/prod
- [x] Keep AUTH_SECRET_KEY private and strong
- [x] Don't share API keys in screenshots/logs

---

## Quick Start Setup

### Step 1: Copy Example Files
```bash
# Agent
cp Agent/.env.example Agent/.env

# Backend
cp Backend/.env.example Backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### Step 2: Get Required API Keys

**Groq API Key** (Required):
1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Create new API key
3. Add to both `Agent/.env` and `Backend/.env`:
   ```bash
   GROQ_API_KEY="gsk_your_actual_key_here"
   ```

**AUTH_SECRET_KEY** (Required):
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
Add output to `Backend/.env`:
```bash
AUTH_SECRET_KEY=<generated_key>
```

### Step 3: Gmail API Setup (Optional)

Only needed if you want automatic resume fetching from Gmail.

Follow: [GMAIL_SETUP_GUIDE.md](./GMAIL_SETUP_GUIDE.md)

### Step 4: Google Web SSO (Optional - Currently Disabled)

The Google/LinkedIn SSO buttons are currently disabled in the UI.
If you want to enable them in the future:
1. Create "Web application" OAuth credentials in Google Cloud Console
2. Add to `Backend/.env` and `frontend/.env`
3. Re-enable buttons in `frontend/src/pages/LoginPage.jsx`

---

## Verification

### Check Agent Configuration:
```bash
cd Agent
python -c "from my_agent.config.settings import GROQ_API_KEY; print('✓ Groq API key loaded' if GROQ_API_KEY else '✗ Missing Groq key')"
```

### Check Backend Configuration:
```bash
cd Backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('✓ Backend .env loaded' if os.getenv('AUTH_SECRET_KEY') else '✗ Missing AUTH_SECRET_KEY')"
```

### Check Frontend Configuration:
```bash
cd frontend
npm run dev
# Check browser console for VITE_API_URL
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'dotenv'"
**Solution:**
```bash
pip install python-dotenv
```

### Issue: Frontend can't connect to backend
**Solution:**
- Check `VITE_API_URL` in `frontend/.env` matches backend address
- Verify backend is running: `http://localhost:8000/health`
- Check CORS configuration in `Backend/app/main.py`

### Issue: "Invalid Groq API key"
**Solution:**
- Verify key starts with `gsk_`
- Check for extra spaces or quotes
- Generate a new key if needed

### Issue: Gmail API not working
**Solution:**
- Follow [GMAIL_SETUP_GUIDE.md](./GMAIL_SETUP_GUIDE.md)
- Verify `credentials.json` has correct format
- Delete `token.pickle` and re-authenticate

---

## Production Deployment

### Environment Variables for Production:

**Backend (Cloud Run / Render / Heroku):**
```bash
AUTH_SECRET_KEY=<strong_secret_key>
GROQ_API_KEY=<production_groq_key>
GMAIL_TOKEN=<serialized_token_json>
```

**Frontend (Vercel / Netlify):**
```bash
VITE_API_URL=https://your-backend-url.com
```

### Security Notes:
- Use environment variable management in your hosting platform
- Never hardcode secrets in code
- Use separate API keys for production
- Enable HTTPS for all production endpoints
- Restrict CORS to your frontend domain only

---

## Need Help?

- Gmail API issues → See [GMAIL_SETUP_GUIDE.md](./GMAIL_SETUP_GUIDE.md)
- Groq API → [https://console.groq.com/docs](https://console.groq.com/docs)
- OAuth setup → Check Google Cloud Console documentation
- General questions → Check project README.md
