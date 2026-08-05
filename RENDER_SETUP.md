# Render Deployment Setup Guide

## Issue: "Could not import module 'main'"

This error occurs when Render can't find the correct module path. Here's how to fix it:

## Solution 1: Update Service Settings (Quick Fix)

### For Backend Service:

1. Go to your Render dashboard
2. Select your Backend web service
3. Go to **Settings**
4. Update these fields:

   **Root Directory:**
   ```
   Backend
   ```

   **Build Command:**
   ```
   pip install -r requirements.txt
   ```

   **Start Command:**
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

4. Click **Save Changes**
5. Manually deploy or wait for auto-deploy

### For Agent Service:

   **Root Directory:**
   ```
   Agent
   ```

   **Build Command:**
   ```
   pip install -r requirements.txt
   ```

   **Start Command:**
   ```
   python -m my_agent.main
   ```

## Solution 2: Use Blueprint Deployment (Recommended)

This automatically configures all services correctly:

1. **Delete existing services** (if any) from Render dashboard

2. **Deploy via Blueprint:**
   - Go to Render Dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select branch: `main`
   - Render will detect `render.yaml` and create all services

3. **Set Environment Variables** after deployment:
   
   **Backend Service:**
   - `AUTH_SECRET_KEY` - Any random secure string
   - `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - Your Google OAuth secret
   - `GMAIL_TOKEN` - Your Gmail API token (JSON format)
   - `DATABASE_URL` - (optional, SQLite by default)

   **Agent Service:**
   - `GROQ_API_KEY` - Your GROQ API key
   - `GOOGLE_APPLICATION_CREDENTIALS` - Google service account JSON
   - `BACKEND_SERVICE_URL` - Will be auto-set by Render

   **Frontend Service:**
   - `VITE_API_URL` - Will be auto-set by Render
   - `VITE_AGENT_URL` - Will be auto-set by Render

## Verification

After deployment, check:

1. **Backend Health:**
   ```
   https://your-backend.onrender.com/health
   ```

2. **Agent Health:**
   ```
   https://your-agent.onrender.com/health
   ```

3. **Frontend:**
   ```
   https://your-frontend.onrender.com
   ```

## Common Issues

### "No module named 'app'"
- **Fix:** Set `Root Directory` to `Backend` in service settings

### "No module named 'my_agent'"
- **Fix:** Set `Root Directory` to `Agent` in service settings

### "No module named 'openai'"
- **Fix:** Already fixed in commit 37f7aec5. Redeploy to get the updated requirements.txt

### "requirements.txt not found"
- **Fix:** Ensure `Root Directory` is set correctly

### Services can't communicate
- **Fix:** Set `BACKEND_SERVICE_URL` in Agent environment variables

### "GROQ_API_KEY not found"
- **Fix:** Set `GROQ_API_KEY` environment variable in Agent service settings

### "AUTH_SECRET_KEY environment variable must be set"
- **Fix:** Set `AUTH_SECRET_KEY` environment variable in Backend service settings

## Current Service URLs

After successful deployment, your services will be at:
- Backend: `https://resume-ranking-backend.onrender.com`
- Agent: `https://resume-ranking-agent.onrender.com`
- Frontend: `https://resume-ranking-frontend.onrender.com`

## Support

If issues persist:
1. Check Render logs for specific error messages
2. Verify all environment variables are set
3. Ensure GitHub repository is up to date
4. Try manual deploy from Render dashboard