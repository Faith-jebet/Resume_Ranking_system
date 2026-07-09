# Gmail API Setup Guide

## Overview
This guide will help you configure Gmail API access for automatic resume fetching from your inbox.

## Prerequisites
- Google Account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## Step 1: Create/Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown (top left)
3. Click **"New Project"** or select your existing project
4. Name it: `resume-ranking-system` (or your preferred name)
5. Click **"Create"**

---

## Step 2: Enable Gmail API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Gmail API"**
3. Click on it and press **"Enable"**
4. Wait for it to activate (takes a few seconds)

---

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in required fields:
   - **App name:** Resume Ranking System
   - **User support email:** Your email
   - **Developer contact email:** Your email
5. Click **"Save and Continue"**
6. On **Scopes** page:
   - Click **"Add or Remove Scopes"**
   - Search for and select: `https://www.googleapis.com/auth/gmail.readonly`
   - Click **"Update"** then **"Save and Continue"**
7. On **Test users** page:
   - Click **"Add Users"**
   - Add your Gmail address (the one you want to fetch resumes from)
   - Click **"Save and Continue"**
8. Review and click **"Back to Dashboard"**

---

## Step 4: Create OAuth 2.0 Credentials (Desktop App)

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. **Application type:** Select **"Desktop app"**
4. **Name:** `Gmail Resume Fetcher` (or any name)
5. Click **"Create"**
6. A dialog will appear with your credentials
7. Click **"Download JSON"** (downloads as `client_secret_*.json`)

---

## Step 5: Update Your Project

### Option A: Using the Downloaded File

1. Open the downloaded `client_secret_*.json` file
2. Copy its contents
3. Replace the contents of `Agent/my_agent/config/credentials.json` with the copied data

### Option B: Manual Entry

Replace the contents of `Agent/my_agent/config/credentials.json` with:

```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost"]
  }
}
```

**Replace:**
- `YOUR_CLIENT_ID` with your actual client ID
- `your-project-id` with your project ID
- `YOUR_CLIENT_SECRET` with your actual client secret

---

## Step 6: First-Time Authentication

1. Run the Gmail tool for the first time:
   ```bash
   cd Agent
   python -m my_agent.tools.gmail_tool
   ```

2. A browser window will open automatically
3. Select your Google account
4. Click **"Continue"** on the warning screen (it's safe - it's your own app)
5. Grant permission to **"See your email messages and settings"**
6. You'll see: "The authentication flow has completed"
7. Close the browser tab

8. A `token.pickle` file will be created in `Agent/my_agent/tools/`
9. This token is reusable - you won't need to authenticate again unless it expires

---

## Step 7: Test Gmail Integration

Run the test script:
```bash
cd Agent
python -m my_agent.tools.gmail_tool
```

You should see:
```
📧 Authenticated as: your-email@gmail.com
🔍 Searching for emails with resume attachments
✓ Found X email(s) matching search criteria
```

---

## Common Issues & Solutions

### Issue: "Access blocked: Authorization Error"
**Solution:** Make sure you added yourself as a test user in Step 3

### Issue: "Error 401: invalid_client"
**Solution:** 
- Check that you created "Desktop app" credentials, not "Web application"
- Verify credentials.json has correct format and values
- Make sure you copied the entire JSON content

### Issue: "token.pickle" file not created
**Solution:**
- Delete existing token.pickle if present
- Re-run authentication
- Check file permissions in `Agent/my_agent/tools/` folder

### Issue: "No emails found"
**Solution:**
- Make sure your Gmail has emails with PDF/DOCX attachments
- Try searching with a specific subject using the `subject` parameter
- Check that the Gmail API scope includes `gmail.readonly`

---

## Security Best Practices

✅ **DO:**
- Keep `credentials.json` in `.gitignore` (already configured)
- Keep `token.pickle` in `.gitignore` (already configured)
- Rotate credentials if they're ever exposed
- Use test users during development

❌ **DON'T:**
- Commit credentials to version control
- Share credentials publicly
- Use production Gmail accounts during testing
- Grant more permissions than needed (only use `gmail.readonly`)

---

## Testing the Integration

### Test 1: Fetch All Resumes
```python
from my_agent.tools.gmail_tool import fetch_resumes_from_gmail

resumes = fetch_resumes_from_gmail()
print(f"Found {len(resumes)} resumes")
```

### Test 2: Fetch with Subject Filter
```python
from my_agent.tools.gmail_tool import fetch_resumes_from_gmail

resumes = fetch_resumes_from_gmail(subject="Job Application")
print(f"Found {len(resumes)} resumes with subject filter")
```

### Test 3: From the UI
1. Start your backend: `cd Backend && python -m uvicorn app.main:app --reload`
2. Start your frontend: `cd frontend && npm run dev`
3. Navigate to Job Vacancy page
4. Enter subject filter (optional)
5. Click "Fetch Resumes"
6. Check the console for results

---

## Next Steps

After successful setup:
1. ✅ Gmail API is configured
2. ✅ Token is generated and stored
3. ✅ Resume fetching works from UI
4. ✅ You can now test the full recruitment pipeline

Need help? Check the error messages in the console or contact support.
