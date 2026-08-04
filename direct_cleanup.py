import sys
import os
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)
from database.sqlite_db import get_connection, init_db

print("🗑️  Direct Document Cleanup")
print("=" * 30)

init_db()
conn = get_connection()
cursor = conn.cursor()

# Show current stats
cursor.execute("SELECT COUNT(*) FROM documents")
total_docs = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM import_sessions")
total_sessions = cursor.fetchone()[0]

cursor.execute("SELECT SUM(file_size_bytes) FROM documents WHERE file_size_bytes IS NOT NULL")
total_size = cursor.fetchone()[0] or 0

print(f"📊 Before: {total_docs} documents, {total_sessions} sessions, {total_size/1024/1024:.2f} MB")

if total_docs > 0:
    # Delete all document review files
    cursor.execute("DELETE FROM candidate_documents")
    cd_deleted = cursor.rowcount
    
    cursor.execute("DELETE FROM documents") 
    docs_deleted = cursor.rowcount
    
    cursor.execute("DELETE FROM import_sessions")
    sessions_deleted = cursor.rowcount
    
    cursor.execute("DELETE FROM resumes")
    resumes_deleted = cursor.rowcount
    
    conn.commit()
    
    print(f"✅ Deleted:")
    print(f"   - {docs_deleted} documents")  
    print(f"   - {sessions_deleted} import sessions")
    print(f"   - {cd_deleted} candidate document links")
    print(f"   - {resumes_deleted} resume records")
    print(f"💾 Freed up: {total_size/1024/1024:.2f} MB")
else:
    print("✅ No documents to clean - already empty!")

conn.close()
print("🎉 Cleanup complete!")