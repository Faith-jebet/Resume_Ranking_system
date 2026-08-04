-- Direct SQL script to clean up document review files
-- Run this with: sqlite3 database/sqlite_database.db < cleanup_sql.sql

-- First, show current status
.print "📊 Current Document Status:"
.print "=============================="
SELECT '📄 Documents: ' || COUNT(*) FROM documents;
SELECT '📂 Import Sessions: ' || COUNT(*) FROM import_sessions;
SELECT '👥 Candidate Documents: ' || COUNT(*) FROM candidate_documents;
SELECT '📝 Resumes: ' || COUNT(*) FROM resumes;
SELECT '💾 Total Size: ' || ROUND(CAST(SUM(file_size_bytes) AS REAL) / 1024 / 1024, 2) || ' MB' FROM documents WHERE file_size_bytes IS NOT NULL;

.print ""
.print "🗑️  Cleaning up document review files..."
.print "==========================================="

-- Delete in correct order to handle foreign keys
DELETE FROM candidate_documents;
.print "✅ Deleted candidate documents: " || changes()

DELETE FROM documents;
.print "✅ Deleted documents: " || changes()

DELETE FROM import_sessions;
.print "✅ Deleted import sessions: " || changes()

DELETE FROM resumes;
.print "✅ Deleted resume records: " || changes()

-- Show final status
.print ""
.print "📊 After Cleanup:"
.print "=================="
SELECT '📄 Documents: ' || COUNT(*) FROM documents;
SELECT '📂 Import Sessions: ' || COUNT(*) FROM import_sessions;
SELECT '👥 Candidate Documents: ' || COUNT(*) FROM candidate_documents;
SELECT '📝 Resumes: ' || COUNT(*) FROM resumes;

.print ""
.print "🎉 Document cleanup complete!"