#!/usr/bin/env python3
"""
Automatic cleanup script to remove old document review files.
"""

import sys
import os
from datetime import datetime, timedelta

# Add project paths to sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from database.sqlite_db import get_connection, init_db

def auto_cleanup(days_old=30):
    """Automatically clean up documents older than specified days."""
    cutoff_date = (datetime.now() - timedelta(days=days_old)).isoformat()
    
    print(f"🗑️  Auto-cleaning documents older than {days_old} days (before {cutoff_date[:10]}):")
    print("=" * 70)
    
    init_db()
    conn = get_connection()
    
    try:
        cursor = conn.cursor()
        
        # Show current stats first
        cursor.execute("SELECT COUNT(*) FROM documents")
        total_before = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(file_size_bytes) FROM documents WHERE file_size_bytes IS NOT NULL")
        size_before = cursor.fetchone()[0] or 0
        
        print(f"📊 Before cleanup: {total_before} documents, {size_before/1024/1024:.2f} MB")
        
        # Find old documents
        cursor.execute("""
            SELECT id, filename, doc_type, created_at, file_size_bytes
            FROM documents 
            WHERE created_at < ?
            ORDER BY created_at
        """, (cutoff_date,))
        old_docs = cursor.fetchall()
        
        if not old_docs:
            print("✅ No old documents found to clean up.")
            
            # Clean orphaned records anyway
            cursor.execute("DELETE FROM candidate_documents WHERE resume_doc_id IS NULL")
            orphaned_candidates = cursor.rowcount
            
            cursor.execute("""
                DELETE FROM import_sessions 
                WHERE id NOT IN (SELECT DISTINCT import_session_id FROM documents WHERE import_session_id IS NOT NULL)
            """)
            orphaned_sessions = cursor.rowcount
            
            conn.commit()
            
            if orphaned_candidates > 0 or orphaned_sessions > 0:
                print(f"🧹 Cleaned up {orphaned_candidates} orphaned candidate records and {orphaned_sessions} orphaned sessions")
            
            return
        
        print(f"Found {len(old_docs)} old documents to delete:")
        total_size_cleaned = 0
        for doc_id, filename, doc_type, created_at, size in old_docs[:10]:  # Show first 10
            size_mb = f"{size/1024/1024:.2f} MB" if size else "Unknown size"
            total_size_cleaned += size or 0
            print(f"   - {filename} ({doc_type}) - {created_at[:10]} - {size_mb}")
        
        if len(old_docs) > 10:
            print(f"   ... and {len(old_docs) - 10} more files")
            
        total_size_cleaned = sum(doc[4] or 0 for doc in old_docs)
        
        print(f"\n🗑️  Deleting {len(old_docs)} old documents...")
        
        # Delete old documents (cascading will handle related records)
        cursor.execute("DELETE FROM documents WHERE created_at < ?", (cutoff_date,))
        deleted_count = cursor.rowcount
        
        # Clean up orphaned records
        cursor.execute("DELETE FROM candidate_documents WHERE resume_doc_id IS NULL")
        orphaned_candidates = cursor.rowcount
        
        cursor.execute("""
            DELETE FROM import_sessions 
            WHERE id NOT IN (SELECT DISTINCT import_session_id FROM documents WHERE import_session_id IS NOT NULL)
        """)
        orphaned_sessions = cursor.rowcount
        
        conn.commit()
        
        # Show final stats
        cursor.execute("SELECT COUNT(*) FROM documents")
        total_after = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(file_size_bytes) FROM documents WHERE file_size_bytes IS NOT NULL")
        size_after = cursor.fetchone()[0] or 0
        
        print(f"✅ Successfully deleted {deleted_count} old documents!")
        print(f"🧹 Cleaned up {orphaned_candidates} orphaned candidate records")
        print(f"🧹 Cleaned up {orphaned_sessions} orphaned import sessions")
        print(f"💾 Freed up ~{total_size_cleaned/1024/1024:.2f} MB of storage")
        print(f"📊 After cleanup: {total_after} documents, {size_after/1024/1024:.2f} MB")
        print(f"📉 Reduction: {total_before - total_after} documents, {(size_before - size_after)/1024/1024:.2f} MB")
        
    finally:
        conn.close()

if __name__ == "__main__":
    # Try different day ranges to find old files
    for days in [30, 60, 45, 15, 7]:
        print(f"\n🔍 Checking for files older than {days} days...")
        
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        init_db()
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM documents WHERE created_at < ?", (cutoff_date,))
            old_count = cursor.fetchone()[0]
            print(f"   Found {old_count} files older than {days} days")
            
            if old_count > 0:
                response = input(f"   Clean up these {old_count} files? (y/N): ").strip().lower()
                if response in ['y', 'yes']:
                    conn.close()
                    auto_cleanup(days)
                    break
                else:
                    print("   Skipped.")
            
        finally:
            if not conn._closed:
                conn.close()
    else:
        print("\n🤔 No old files found with any of the tested day ranges.")
        print("📊 Current database status:")
        auto_cleanup(0)  # Just show stats and clean orphaned records