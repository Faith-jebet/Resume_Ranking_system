@echo off
echo 📁 Document Review Files Cleanup
echo ================================
echo.
echo This will delete ALL document review files from the database.
echo This includes:
echo - All resume documents (PDF, DOCX files)
echo - All import sessions
echo - All candidate document links
echo - All resume text records
echo.
set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Cleanup cancelled.
    pause
    exit /b
)

echo.
echo 🗑️  Running cleanup...
sqlite3 database\sqlite_database.db < cleanup_sql.sql

echo.
echo ✅ Cleanup complete!
pause