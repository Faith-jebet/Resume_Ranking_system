@echo off
echo 🚀 Setting up Resume Ranking System for deployment...

REM Check if we're in the right directory
if not exist "render.yaml" (
    echo ❌ Error: render.yaml not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo 📋 Deployment checklist:
echo 1. ✅ render.yaml configuration file exists

REM Check Backend requirements
if exist "Backend\requirements.txt" (
    echo 2. ✅ Backend requirements.txt exists
) else (
    echo 2. ❌ Backend requirements.txt missing
)

REM Check Agent requirements  
if exist "Agent\requirements.txt" (
    echo 3. ✅ Agent requirements.txt exists
) else (
    echo 3. ❌ Agent requirements.txt missing
)

REM Check Frontend package.json
if exist "frontend\package.json" (
    echo 4. ✅ Frontend package.json exists
) else (
    echo 4. ❌ Frontend package.json missing
)

REM Check entry points
if exist "Backend\wsgi.py" (
    echo 5. ✅ Backend WSGI entry point exists
) else (
    echo 5. ❌ Backend WSGI entry point missing
)

if exist "Agent\wsgi.py" (
    echo 6. ✅ Agent WSGI entry point exists
) else (
    echo 6. ❌ Agent WSGI entry point missing
)

echo.
echo 📝 Next steps for Render deployment:
echo 1. Push your code to GitHub
echo 2. Connect your GitHub repo to Render
echo 3. Deploy using the render.yaml configuration
echo 4. Set the following environment variables in Render dashboard:
echo    - GOOGLE_CLIENT_ID
echo    - GOOGLE_CLIENT_SECRET
echo    - GMAIL_TOKEN
echo    - GROQ_API_KEY
echo    - GOOGLE_APPLICATION_CREDENTIALS
echo.
echo 🎯 Services will be deployed as:
echo    - Backend API: resume-ranking-backend
echo    - Agent Service: resume-ranking-agent
echo    - Frontend: resume-ranking-frontend
echo.
echo ✨ Deployment setup complete!
pause