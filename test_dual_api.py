#!/usr/bin/env python3
"""
Quick test script to verify both RandomForest and LLM endpoints work correctly
"""

import requests
import json
import time

# Test data (from our successful 100-sample test)
test_cases = [
    {
        "name": "Known Candidate",
        "data": {
            "koi_period": 27.9,
            "koi_duration": 5.346,
            "koi_depth": 300.2,
            "koi_prad": 2.19,
            "koi_impact": 0.854,
            "koi_teq": 677
        },
        "expected": "CANDIDATE"
    },
    {
        "name": "Known False Positive", 
        "data": {
            "koi_period": 0.49,
            "koi_duration": 0.894,
            "koi_depth": 1107.6,
            "koi_prad": 3.42,
            "koi_impact": 0.957,
            "koi_teq": 1788
        },
        "expected": "FALSE POSITIVE"
    }
]

BASE_URL = "http://localhost:5001"

def test_endpoint(endpoint, data, name):
    """Test a specific endpoint"""
    print(f"\n🧪 Testing {endpoint} with {name}")
    print("-" * 50)
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}{endpoint}", 
                               json=data, 
                               timeout=30)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! ({elapsed:.1f}s)")
            print(f"   Prediction: {result.get('prediction', 'N/A')}")
            print(f"   Confidence: {result.get('confidence', 'N/A')}")
            if 'model' in result:
                print(f"   Model: {result['model']}")
            if 'processing_time' in result:
                print(f"   Processing Time: {result['processing_time']}")
            return True
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the Flask app running on port 5001?")
        return False
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 DUAL-MODEL API TEST")
    print("=" * 60)
    
    # Test health endpoint first
    print("\n🏥 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            health = response.json()
            print("✅ Health check passed!")
            print(f"   RandomForest: {'Available' if health.get('randomforest_available') else 'Not Available'}")
            print(f"   LLM: {'Available' if health.get('llm_available') else 'Not Available'}")
            print(f"   Models loaded: {health.get('models_loaded', 0)}")
        else:
            print("❌ Health check failed")
            return
    except:
        print("❌ Cannot connect to Flask app. Please start it with: python3 app.py")
        return
    
    # Test each endpoint with each test case
    endpoints = [
        "/predict/randomforest",
        "/predict/llm", 
        "/predict/both"
    ]
    
    for test_case in test_cases:
        for endpoint in endpoints:
            test_endpoint(endpoint, test_case["data"], test_case["name"])
            time.sleep(0.5)  # Brief pause between tests
    
    print("\n" + "=" * 60)
    print("🏁 API testing complete!")
    print("💡 If all tests passed, your dual-model web app is ready!")
    print("🌐 Visit http://localhost:5001 to use the interactive interface")

if __name__ == "__main__":
    main()
