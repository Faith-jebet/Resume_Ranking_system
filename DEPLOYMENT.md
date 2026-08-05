# Deployment Guide

This guide explains how to deploy the Resume Ranking System to Render.com.

## Architecture Overview

The system consists of three separate services:

1. **Backend API** (`Backend/`) - FastAPI service handling authentication and data
2. **Agent Service** (`Agent/`) - AI-powered resume ranking and job matching  
3. **Frontend** (`frontend/`) - React application (Static Site)

## Prerequisites

- GitHub repository with your code
- Render.com account
- Environment variables (see below)

## Deployment Methods

### Option 1: Automatic Deployment with render.yaml (Recommended)

1. **Push to GitHub**: Ensure all your code is pushed to a GitHub repository

2. **Connect to Render**: 
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Set Environment Variables**: In the Render dashboard, set these variables for each service:

   **Backend Service:**
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GMAIL_TOKEN={"your": "gmail_token_json"}
   DATABASE_URL=your_database_url (optional)
   SECRET_KEY=your_secret_key
   ```

   **Agent Service:**
   ```
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_APPLICATION_CREDENTIALS=path_or_json
   BACKEND_SERVICE_URL=https://your-backend.onrender.com
   ```

   **Frontend Service:**
   ```
   VITE_API_URL=https://your-backend.onrender.com
   VITE_AGENT_URL=https://your-agent.onrender.com
   ```

### Option 2: Manual Deployment

Deploy each service separately:

#### Backend API
1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `cd Backend && pip install -r requirements.txt`
4. Set start command: `cd Backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set environment variables as listed above

#### Agent Service  
1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `cd Agent && pip install -r requirements.txt`
4. Set start command: `cd Agent && python -m my_agent.main`
5. Set environment variables as listed above

#### Frontend
1. Create new Static Site
2. Connect GitHub repo  
3. Set build command: `cd frontend && npm install && npm run build`
4. Set publish directory: `frontend/dist`
5. Set environment variables as listed above

## Service URLs

After deployment, your services will be available at:
- Backend: `https://resume-ranking-backend.onrender.com`
- Agent: `https://resume-ranking-agent.onrender.com` 
- Frontend: `https://resume-ranking-frontend.onrender.com`

## Environment Variables Setup

### Getting Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable Gmail API and Google Drive API
4. Create credentials (OAuth 2.0 Client ID)
5. Download the credentials JSON

### Getting GROQ API Key

1. Sign up at [GROQ](https://groq.com)
2. Generate an API key from the dashboard
3. Add it to your environment variables

## Health Checks

Each service provides health endpoints:
- Backend: `/health`
- Agent: `/health` 
- Frontend: Automatic (static files)

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all Python paths are correctly configured in the entry points

2. **CORS Issues**: Update the CORS origins in `Backend/app/main.py` to include your frontend URL

3. **Environment Variables**: Double-check all required environment variables are set

4. **Database Issues**: The system uses SQLite by default. For production, consider upgrading to PostgreSQL

### Logs

View logs in the Render dashboard:
- Go to your service
- Click "Logs" tab
- Check for any error messages

### Service Communication

Make sure services can communicate:
- Backend should be accessible from Agent
- Frontend should be able to reach both Backend and Agent
- Check CORS settings if getting cross-origin errors

## Performance Optimization

### For Production

1. **Database**: Upgrade to PostgreSQL for better performance
2. **Caching**: Add Redis for caching frequently accessed data
3. **CDN**: Use a CDN for static assets
4. **Monitoring**: Set up monitoring and alerting

### Scaling

- Backend and Agent services can be scaled horizontally
- Consider using a load balancer for high traffic
- Monitor resource usage and scale accordingly

## Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **HTTPS**: All communication should be over HTTPS
3. **CORS**: Configure CORS properly for production domains
4. **Authentication**: Implement proper authentication for API endpoints

## Support

For deployment issues:
1. Check the logs in Render dashboard
2. Verify all environment variables are set
3. Test services individually using health endpoints
4. Check GitHub repository permissions

## Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] render.yaml file present
- [ ] All environment variables ready
- [ ] Render account created
- [ ] Repository connected to Render
- [ ] Services deployed and healthy
- [ ] Frontend can communicate with backend services
- [ ] All features working in production environment