#!/usr/bin/env python3
"""
Deployment test script for Resume Ranking System
Tests if services can start without critical import errors
"""

import sys
import os
from pathlib import Path

def test_backend_imports():
    """Test if backend can import without critical errors"""
    print("🧪 Testing Backend imports...")
    
    try:
        # Add Backend to path
        backend_path = Path(__file__).parent / "Backend"
        sys.path.insert(0, str(backend_path))
        
        # Try importing the main FastAPI app
        from app.main import app
        print("✅ Backend app imported successfully")
        
        # Test health endpoint is available
        if hasattr(app, 'routes'):
            health_routes = [route for route in app.routes if hasattr(route, 'path') and 'health' in route.path]
            if health_routes:
                print("✅ Health endpoint available")
            else:
                print("⚠️  Health endpoint not found")
        
        return True
        
    except ImportError as e:
        print(f"❌ Backend import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return False

def test_agent_imports():
    """Test if agent can import without critical errors"""
    print("\n🧪 Testing Agent imports...")
    
    try:
        # Add Agent to path
        agent_path = Path(__file__).parent / "Agent"
        sys.path.insert(0, str(agent_path))
        
        # Try importing the agent API
        from my_agent.api.main import app
        print("✅ Agent API imported successfully")
        
        # Check if main entry point works
        from my_agent.main import run_api_server
        print("✅ Agent main entry point available")
        
        return True
        
    except ImportError as e:
        print(f"❌ Agent import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        return False

def test_frontend_build():
    """Test if frontend has necessary files"""
    print("\n🧪 Testing Frontend structure...")
    
    frontend_path = Path(__file__).parent / "frontend"
    
    # Check package.json exists
    if (frontend_path / "package.json").exists():
        print("✅ Frontend package.json found")
    else:
        print("❌ Frontend package.json missing")
        return False
    
    # Check if src directory exists
    if (frontend_path / "src").exists():
        print("✅ Frontend src directory found")
    else:
        print("❌ Frontend src directory missing")
        return False
        
    return True

def main():
    """Run all deployment tests"""
    print("🚀 Resume Ranking System - Deployment Tests")
    print("=" * 50)
    
    results = []
    
    # Test each component
    results.append(("Backend", test_backend_imports()))
    results.append(("Agent", test_agent_imports()))
    results.append(("Frontend", test_frontend_build()))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    
    all_passed = True
    for component, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {component}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All tests passed! Ready for deployment.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the issues above before deploying.")
        return 1

if __name__ == "__main__":
    sys.exit(main())