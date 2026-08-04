#!/usr/bin/env python3
"""
Quick script to check what document review files are stored in the database.
"""

import sys
import os
from datetime import datetime

# Add project paths to sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from database.sqlite_db import get_connection, init_db

def main():
    """Show current documents in the database."""
    print("📊 Document Review Files Database Summary")
    print("=" * 50)
    
    init_db()
    conn = get_connection()
    
    try:
        cursor = conn.cursor()
        
        # Count documents
        cursor.execute("SELECT COUNT(*) FROM documents")
        doc_count = cursor.fetchone()[0]
        
        # Count by type
        cursor.execute("SELECT doc_type, COUNT(*) FROM documents GROUP BY doc_type")
        doc_types = cursor.fetchall()
        
        # Count import sessions
        cursor.execute("SELECT COUNT(*) FROM import_sessions")
        session_count = cursor.fetchone()[0]
        
        # Count candidate documents
        cursor.execute("SELECT COUNT(*) FROM candidate_documents")
        candidate_doc_count = cursor.fetchone()[0]
        
        # Count resumes
        cursor.execute("SELECT COUNT(*) FROM resumes")
        resume_count = cursor.fetchone()[0]
        
        # Calculate total file size
        cursor.execute("SELECT SUM(file_size_bytes) FROM documents WHERE file_size_bytes IS NOT NULL")
        total_size = cursor.fetchone()[0] or 0
        
        # Database file size
        db_path = os.path.join(PROJECT_ROOT, "database", "sqlite_database.db")
        if os.path.exists(db_path):
            db_file_size = os.path.getsize(db_path)
            print(f"💾 Database File: {db_file_size/1024/1024:.2f} MB ({db_path})")
        
        print(f"📄 Total Documents: {doc_count}")
        if doc_types:
            for doc_type, count in doc_types:
                print(f"   - {doc_type.upper()}: {count}")
        else:
            print("   - No documents found")
            
        print(f"📂 Import Sessions: {session_count}")
        print(f"👥 Candidate Documents: {candidate_doc_count}")
        print(f"📝 Resumes: {resume_count}")
        print(f"📊 Total Stored File Size: {total_size/1024/1024:.2f} MB" if total_size > 0 else "📊 Total Stored File Size: 0 MB")
        
        if doc_count > 0:
            # Show recent documents
            cursor.execute("""
                SELECT filename, doc_type, created_at, file_size_bytes, import_session_id
                FROM documents 
                ORDER BY created_at DESC 
                LIMIT 10
            """)
            recent_docs = cursor.fetchall()
            
            print(f"\n📅 Recent Documents (last {min(10, len(recent_docs))}):")
            for filename, doc_type, created_at, size, session_id in recent_docs:
                size_mb = f"{size/1024/1024:.2f} MB" if size else "Unknown size"
                print(f"   - {filename} ({doc_type.upper()}) - Session {session_id} - {created_at[:19]} - {size_mb}")
            
            # Show oldest documents
            cursor.execute("""
                SELECT filename, doc_type, created_at, file_size_bytes, import_session_id
                FROM documents 
                ORDER BY created_at ASC 
                LIMIT 5
            """)
            oldest_docs = cursor.fetchall()
            
            if oldest_docs:
                print(f"\n📜 Oldest Documents (first {len(oldest_docs)}):")
                for filename, doc_type, created_at, size, session_id in oldest_docs:
                    size_mb = f"{size/1024/1024:.2f} MB" if size else "Unknown size"
                    print(f"   - {filename} ({doc_type.upper()}) - Session {session_id} - {created_at[:19]} - {size_mb}")
        
        print(f"\n💡 To clean up old files, run: python cleanup_documents.py")
        
    finally:
        conn.close()

if __name__ == "__main__":
    main()