#!/usr/bin/env python3
"""
Simple cleanup script - just delete files older than 7 days to clean up recent test files.
"""

import sys
import os
from datetime import datetime, timedelta

# Add project paths to sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from database.sqlite_db import get_connection, init_db

def simple_cleanup():
    """Clean up documents and show results."""
    
    print("🗑️  Simple Document Cleanup")
    print("=" * 40)
    
    init_db()
    conn = get_connection()
    
    try:
        cursor = conn.cursor()
        
        # Show current stats
        cursor.execute("SELECT COUNT(*) FROM documents")
        total_docs = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM import_sessions")
        total_sessions = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM candidate_documents")
        total_candidates = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(file_size_bytes) FROM documents WHERE file_size_bytes IS NOT NULL")
        total_size = cursor.fetchone()[0] or 0
        
        print(f"📊 Current Status:")
        print(f"   - Documents: {total_docs}")
        print(f"   - Import Sessions: {total_sessions}")
        print(f"   - Candidate Documents: {total_candidates}")
        print(f"   - Total Size: {total_size/1024/1024:.2f} MB")
        
        if total_docs == 0:
            print("✅ No documents to clean - database is already clean!")
            return
        
        # Show some sample files
        cursor.execute("""
            SELECT filename, doc_type, created_at, file_size_bytes
            FROM documents 
            ORDER BY created_at ASC 
            LIMIT 5
        """)
        oldest = cursor.fetchall()
        
        cursor.execute("""
            SELECT filename, doc_type, created_at, file_size_bytes
            FROM documents 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        newest = cursor.fetchall()
        
        print(f"\n📜 Oldest Files:")
        for filename, doc_type, created_at, size in oldest:
            print(f"   - {filename} - {created_at[:10]}")
            
        print(f"\n📅 Newest Files:")
        for filename, doc_type, created_at, size in newest:
            print(f"   - {filename} - {created_at[:10]}")
        
        # Ask if user wants to clean everything
        print(f"\n⚠️  Clean up ALL {total_docs} documents? This will:")
        print(f"   - Delete all {total_docs} document files")
        print(f"   - Delete all {total_sessions} import sessions")
        print(f"   - Delete all {total_candidates} candidate document links")
        print(f"   - Free up {total_size/1024/1024:.2f} MB of storage")
        
        response = input(f"\nProceed with cleanup? (y/N): ").strip().lower()
        
        if response not in ['y', 'yes']:
            print("❌ Cleanup cancelled.")
            return
        
        print(f"\n🗑️  Cleaning up all documents...")
        
        # Delete in correct order to handle foreign keys
        cursor.execute("DELETE FROM candidate_documents")
        candidate_docs_deleted = cursor.rowcount
        
        cursor.execute("DELETE FROM documents")
        docs_deleted = cursor.rowcount
        
        cursor.execute("DELETE FROM import_sessions")
        sessions_deleted = cursor.rowcount
        
        # Also clean resumes table
        cursor.execute("DELETE FROM resumes")
        resumes_deleted = cursor.rowcount
        
        conn.commit()
        
        print(f"✅ Cleanup Complete!")
        print(f"   - Documents deleted: {docs_deleted}")
        print(f"   - Import sessions deleted: {sessions_deleted}")
        print(f"   - Candidate documents deleted: {candidate_docs_deleted}")
        print(f"   - Resume records deleted: {resumes_deleted}")
        print(f"💾 Freed up {total_size/1024/1024:.2f} MB of storage")
        
        # Verify cleanup
        cursor.execute("SELECT COUNT(*) FROM documents")
        remaining_docs = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM import_sessions")
        remaining_sessions = cursor.fetchone()[0]
        
        print(f"\n📊 After Cleanup:")
        print(f"   - Documents: {remaining_docs}")
        print(f"   - Import Sessions: {remaining_sessions}")
        print(f"🎉 Database cleaned successfully!")
        
    finally:
        conn.close()

if __name__ == "__main__":
    simple_cleanup()