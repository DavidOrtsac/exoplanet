import pandas as pd
import requests
import json
import time

def test_web_app_with_real_data():
    """Test the web app with real examples from the dataset"""
    print("TESTING WEB APPLICATION WITH REAL DATA")
    print("=" * 50)
    
    # Load real data
    df = pd.read_csv('koi_data.csv', comment='#')
    df_clean = df[df['koi_pdisposition'].isin(['CANDIDATE', 'FALSE POSITIVE'])]
    
    features = ['koi_period', 'koi_duration', 'koi_depth', 'koi_prad', 
               'koi_impact', 'koi_teq', 'koi_fpflag_nt', 'koi_fpflag_ss']
    
    # Test with a few known examples
    test_cases = [
        # Known candidates
        df_clean[df_clean['koi_pdisposition'] == 'CANDIDATE'].iloc[0],
        df_clean[df_clean['koi_pdisposition'] == 'CANDIDATE'].iloc[1],
        df_clean[df_clean['koi_pdisposition'] == 'CANDIDATE'].iloc[2],
        # Known false positives  
        df_clean[df_clean['koi_pdisposition'] == 'FALSE POSITIVE'].iloc[0],
        df_clean[df_clean['koi_pdisposition'] == 'FALSE POSITIVE'].iloc[1],
    ]
    
    base_url = "http://localhost:5001"
    
    print("Testing web app predictions vs known labels:")
    print()
    
    for i, row in enumerate(test_cases):
        # Prepare data for web request
        test_data = {}
        for feature in features:
            value = row[feature]
            if pd.isna(value):
                # Use median for missing values (same as training)
                value = df_clean[feature].median()
            test_data[feature] = float(value)
        
        actual_label = row['koi_pdisposition']
        koi_name = row.get('kepoi_name', f'Test_{i+1}')
        
        try:
            # Make request to web app
            response = requests.post(
                f"{base_url}/predict", 
                json=test_data,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                predicted_label = result['prediction']
                confidence = result['confidence']
                
                # Check if prediction matches actual
                correct = "✅" if predicted_label == actual_label else "❌"
                
                print(f"{correct} {koi_name}:")
                print(f"    Actual: {actual_label}")
                print(f"    Predicted: {predicted_label} (confidence: {confidence*100:.1f}%)")
                print()
            else:
                print(f"❌ {koi_name}: HTTP Error {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ {koi_name}: Connection error - {e}")
            print("   Make sure Flask app is running on http://localhost:5001")
            break
        
        time.sleep(0.1)  # Small delay between requests

if __name__ == "__main__":
    test_web_app_with_real_data()
