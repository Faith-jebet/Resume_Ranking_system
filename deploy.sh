#!/bin/bash

# Resume Ranking System Deployment Script
# This script helps set up the project for deployment on Render

echo "🚀 Setting up Resume Ranking System for deployment..."

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Deployment checklist:"
echo "1. ✅ render.yaml configuration file exists"

# Check Backend requirements
if [ -f "Backend/requirements.txt" ]; then
    echo "2. ✅ Backend requirements.txt exists"
else
    echo "2. ❌ Backend requirements.txt missing"
fi

# Check Agent requirements  
if [ -f "Agent/requirements.txt" ]; then
    echo "3. ✅ Agent requirements.txt exists"
else
    echo "3. ❌ Agent requirements.txt missing"
fi

# Check Frontend package.json
if [ -f "frontend/package.json" ]; then
    echo "4. ✅ Frontend package.json exists"
else
    echo "4. ❌ Frontend package.json missing"
fi

# Check entry points
if [ -f "Backend/wsgi.py" ]; then
    echo "5. ✅ Backend WSGI entry point exists"
else
    echo "5. ❌ Backend WSGI entry point missing"
fi

if [ -f "Agent/wsgi.py" ]; then
    echo "6. ✅ Agent WSGI entry point exists"
else
    echo "6. ❌ Agent WSGI entry point missing"
fi

echo ""
echo "📝 Next steps for Render deployment:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Render"
echo "3. Deploy using the render.yaml configuration"
echo "4. Set the following environment variables in Render dashboard:"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET" 
echo "   - GMAIL_TOKEN"
echo "   - GROQ_API_KEY"
echo "   - GOOGLE_APPLICATION_CREDENTIALS"
echo ""
echo "🎯 Services will be deployed as:"
echo "   - Backend API: resume-ranking-backend"
echo "   - Agent Service: resume-ranking-agent"
echo "   - Frontend: resume-ranking-frontend"
echo ""
echo "✨ Deployment setup complete!"