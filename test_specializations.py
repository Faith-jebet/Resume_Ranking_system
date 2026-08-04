#!/usr/bin/env python3
"""
Quick test for specializations endpoint
"""

import requests

BASE_URL = "http://localhost:8000"

try:
    response = requests.get(f"{BASE_URL}/api/specializations", timeout=5)
    print(f"Specializations Status: {response.status_code}")
    if response.status_code == 200:
        specializations = response.json()
        print(f"Found {len(specializations)} specializations:")
        for spec in specializations:
            print(f"  - {spec['title']} ({spec.get('positions', 0)} positions)")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error: {e}")