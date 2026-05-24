#!/usr/bin/env python3
"""
scripts/db_shell.py
An interactive, cross-platform SQLite database shell in Python.
Allows running SQL queries and querying tables on environments (like Windows)
without the standalone sqlite3 CLI executable.
"""

import sys
import os
import sqlite3

# Reconfigure encoding to UTF-8 on Windows for beautiful outputs
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resumes.db"))

def print_table(headers, rows):
    if not rows:
        print("(No rows returned)")
        return
        
    # Calculate column widths
    widths = [len(h) for h in headers]
    for row in rows:
        for idx, val in enumerate(row):
            val_str = str(val) if val is not None else "NULL"
            if len(val_str) > widths[idx]:
                widths[idx] = len(val_str)
                
    # Cap column width at 40 characters for display to avoid horizontal scrolling issues
    widths = [min(w, 40) for w in widths]
    
    # Print header
    header_parts = []
    border_parts = []
    for idx, h in enumerate(headers):
        header_parts.append(h.ljust(widths[idx])[:widths[idx]])
        border_parts.append("-" * widths[idx])
    print(" | ".join(header_parts))
    print("-+-".join(border_parts))
    
    # Print data rows
    for row in rows:
        row_parts = []
        for idx, val in enumerate(row):
            val_str = str(val) if val is not None else "NULL"
            # Truncate if longer than max width
            if len(val_str) > widths[idx]:
                val_str = val_str[:widths[idx]-3] + "..."
            row_parts.append(val_str.ljust(widths[idx]))
        print(" | ".join(row_parts))
    print(f"\n({len(rows)} rows returned)\n")

def show_help():
    print("""
📚 Available Commands:
  .help          - Show this help message
  .tables        - List all tables in the database
  .schema <tbl>  - Show CREATE statement for a specific table
  .exit / .quit  - Exit this interactive database shell
  
Any other input will be executed as a raw SQL statement on the database.
Make sure to end SQL statements with a semicolon (;)!
""")

def main():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database file not found at: {DB_PATH}")
        print("Run your FastAPI server or pipeline first to initialize it.")
        return

    print(f"🔌 Connected to SQLite database: {DB_PATH}")
    print("Type '.help' for instructions. Type '.exit' to quit.")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    while True:
        try:
            query = input("db> ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            break
            
        if not query:
            continue
            
        # Parse meta commands
        lower_query = query.lower()
        if lower_query in (".exit", ".quit", "exit", "quit"):
            print("Exiting...")
            break
        elif lower_query in (".help", "help"):
            show_help()
            continue
        elif lower_query in (".tables", "tables"):
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            rows = cursor.fetchall()
            print("\n📋 Tables:")
            for r in rows:
                print(f"  - {r[0]}")
            print()
            continue
        elif lower_query.startswith(".schema"):
            parts = query.split()
            if len(parts) < 2:
                print("Usage: .schema <table_name>")
                continue
            table_name = parts[1]
            cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?;", (table_name,))
            row = cursor.fetchone()
            if row:
                print(f"\n📄 Schema for '{table_name}':\n{row[0]}\n")
            else:
                print(f"⚠️ Table '{table_name}' not found.")
            continue
            
        # Execute raw SQL query
        try:
            cursor.execute(query)
            if query.strip().upper().startswith(("SELECT", "PRAGMA", "EXPLAIN")):
                rows = cursor.fetchall()
                if rows:
                    headers = list(rows[0].keys())
                    print_table(headers, [list(r) for r in rows])
                else:
                    print("(No rows returned)")
            else:
                conn.commit()
                changes = conn.changes()
                print(f"✅ Query executed successfully. Rows affected: {changes}")
        except Exception as err:
            print(f"❌ SQL Error: {err}")

    conn.close()

if __name__ == "__main__":
    main()
