from __future__ import annotations

import argparse
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from database.sqlite_db import init_db


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize the SQLite database for the resume ranking system.")
    parser.add_argument("--db", default="resumes.db", help="SQLite database file path.")
    args = parser.parse_args()

    db_path = Path(args.db)
    init_db(db_path)
    print(f"SQLite database initialized at: {db_path.resolve()}")


if __name__ == "__main__":
    main()
