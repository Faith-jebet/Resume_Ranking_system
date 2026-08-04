#!/usr/bin/env python3
"""
Quick test to verify the new API endpoints are working.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_categories():
    print("Testing categories endpoints...")
    
    # Test GET /api/categories
    try:
        response = requests.get(f"{BASE_URL}/api/categories")
        print(f"GET /api/categories - Status: {response.status_code}")
        if response.status_code == 200:
            categories = response.json()
            print(f"  Found {len(categories)} categories")
            for cat in categories[:3]:  # Show first 3
                print(f"    - {cat.get('title')} ({cat.get('open_roles')} open roles)")
    except Exception as e:
        print(f"  Error: {e}")

def test_specializations():
    print("\nTesting specializations endpoints...")
    
    # Test GET /api/specializations
    try:
        response = requests.get(f"{BASE_URL}/api/specializations")
        print(f"GET /api/specializations - Status: {response.status_code}")
        if response.status_code == 200:
            specializations = response.json()
            print(f"  Found {len(specializations)} specializations")
            for spec in specializations[:3]:  # Show first 3
                print(f"    - {spec.get('title')} ({spec.get('positions')} positions)")
    except Exception as e:
        print(f"  Error: {e}")

def test_create_category():
    print("\nTesting category creation...")
    
    new_category = {
        "title": "Test Category",
        "description": "This is a test category created via API",
        "open_roles": 100,
        "icon": "Briefcase",
        "style": "light"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/categories",
            json=new_category
        )
        print(f"POST /api/categories - Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"  Created category with ID: {result.get('category_id')}")
    except Exception as e:
        print(f"  Error: {e}")

def main():
    print("API Endpoint Test Script")
    print("=" * 50)
    
    test_categories()
    test_specializations()
    test_create_category()
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    main()