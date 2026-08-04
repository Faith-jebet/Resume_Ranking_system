#!/usr/bin/env python3
"""
Document cleanup script to remove old document review files from the database.
This script will clean up documents, import_sessions, candidate_documents, and resumes.
"""

import sys
import os
from datetime import datetime, timedelta

# Add project paths to sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from database.sqlite_db import get_connection, init_db

def show_current_documents():
    """Show current documents in the database."""
    print("📊 Current Documents Summary:")
    print("=" * 50)
    
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
        
        print(f"📄 Total Documents: {doc_count}")
        for doc_type, count in doc_types:
            print(f"   - {doc_type}: {count}")
        print(f"📂 Import Sessions: {session_count}")
        print(f"👥 Candidate Documents: {candidate_doc_count}")
        print(f"📝 Resumes: {resume_count}")
        print(f"💾 Total File Size: {total_size/1024/1024:.2f} MB" if total_size > 0 else "💾 Total File Size: 0 MB")
        
        # Show recent documents
        cursor.execute("""
            SELECT filename, doc_type, created_at, file_size_bytes 
            FROM documents 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        recent_docs = cursor.fetchall()
        
        if recent_docs:
            print(f"\n📅 Recent Documents (last 5):")
            for filename, doc_type, created_at, size in recent_docs:
                size_mb = f"{size/1024/1024:.2f} MB" if size else "Unknown size"
                print(f"   - {filename} ({doc_type}) - {created_at} - {size_mb}")
        
    finally:
        conn.close()

def cleanup_old_documents(days_old=30):
    """Clean up documents older than specified days."""
    cutoff_date = (datetime.now() - timedelta(days=days_old)).isoformat()
    
    print(f"\n🗑️  Cleaning up documents older than {days_old} days (before {cutoff_date[:10]}):")
    print("=" * 70)
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
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
            return
        
        print(f"Found {len(old_docs)} old documents:")
        total_size_cleaned = 0
        for doc_id, filename, doc_type, created_at, size in old_docs:
            size_mb = f"{size/1024/1024:.2f} MB" if size else "Unknown size"
            total_size_cleaned += size or 0
            print(f"   - {filename} ({doc_type}) - {created_at} - {size_mb}")
        
        # Ask for confirmation
        response = input(f"\n⚠️  Delete these {len(old_docs)} documents? (y/N): ").strip().lower()
        if response not in ['y', 'yes']:
            print("❌ Cleanup cancelled.")
            return
        
        # Delete old documents (cascading will handle related records)
        cursor.execute("DELETE FROM documents WHERE created_at < ?", (cutoff_date,))
        deleted_count = cursor.rowcount
        
        conn.commit()
        
        print(f"✅ Successfully deleted {deleted_count} old documents!")
        print(f"💾 Freed up ~{total_size_cleaned/1024/1024:.2f} MB of storage")
        
    finally:
        conn.close()

def cleanup_orphaned_records():
    """Clean up orphaned records in related tables."""
    print(f"\n🧹 Cleaning up orphaned records:")
    print("=" * 40)
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Clean up candidate_documents with null resume_doc_id
        cursor.execute("DELETE FROM candidate_documents WHERE resume_doc_id IS NULL")
        orphaned_candidates = cursor.rowcount
        
        # Clean up import_sessions with no documents
        cursor.execute("""
            DELETE FROM import_sessions 
            WHERE id NOT IN (SELECT DISTINCT import_session_id FROM documents WHERE import_session_id IS NOT NULL)
        """)
        orphaned_sessions = cursor.rowcount
        
        conn.commit()
        
        if orphaned_candidates > 0:
            print(f"✅ Cleaned up {orphaned_candidates} orphaned candidate documents")
        if orphaned_sessions > 0:
            print(f"✅ Cleaned up {orphaned_sessions} orphaned import sessions")
        if orphaned_candidates == 0 and orphaned_sessions == 0:
            print("✅ No orphaned records found")
        
    finally:
        conn.close()

def cleanup_all_documents():
    """DANGEROUS: Clean up ALL document review files."""
    print(f"\n⚠️  DANGER ZONE: Clean up ALL document review files!")
    print("=" * 50)
    print("This will delete:")
    print("- All documents (resumes and JDs)")
    print("- All import sessions")
    print("- All candidate documents")
    print("- All resume data")
    print("- This CANNOT be undone!")
    
    response = input("\n❗ Are you absolutely sure? Type 'DELETE ALL' to confirm: ").strip()
    if response != 'DELETE ALL':
        print("❌ Cleanup cancelled.")
        return
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # Delete in correct order to handle foreign keys
        cursor.execute("DELETE FROM candidate_documents")
        candidate_docs_deleted = cursor.rowcount
        
        cursor.execute("DELETE FROM documents")
        docs_deleted = cursor.rowcount
        
        cursor.execute("DELETE FROM import_sessions")
        sessions_deleted = cursor.rowcount
        
        cursor.execute("DELETE FROM resumes")
        resumes_deleted = cursor.rowcount
        
        conn.commit()
        
        print(f"✅ ALL document review files deleted:")
        print(f"   - Documents: {docs_deleted}")
        print(f"   - Import Sessions: {sessions_deleted}")
        print(f"   - Candidate Documents: {candidate_docs_deleted}")
        print(f"   - Resumes: {resumes_deleted}")
        print(f"💾 Database cleaned up successfully!")
        
    finally:
        conn.close()

def main():
    """Main cleanup interface."""
    print("📁 Document Review Files Cleanup Tool")
    print("=" * 50)
    
    # Initialize database
    init_db()
    
    # Show current state
    show_current_documents()
    
    while True:
        print("\n🛠️  Cleanup Options:")
        print("1. Clean up documents older than X days")
        print("2. Clean up orphaned records")
        print("3. Show current documents summary")
        print("4. DANGER: Delete ALL document review files")
        print("5. Exit")
        
        try:
            choice = input("\nSelect option (1-5): ").strip()
            
            if choice == '1':
                days = input("Enter number of days (default 30): ").strip()
                days = int(days) if days.isdigit() else 30
                cleanup_old_documents(days)
                
            elif choice == '2':
                cleanup_orphaned_records()
                
            elif choice == '3':
                show_current_documents()
                
            elif choice == '4':
                cleanup_all_documents()
                
            elif choice == '5':
                print("👋 Goodbye!")
                break
                
            else:
                print("❌ Invalid choice. Please select 1-5.")
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()