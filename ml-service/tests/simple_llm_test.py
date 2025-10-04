from dotenv import load_dotenv
load_dotenv()

import pandas as pd
from scripts.llm_in_context_classifier_fixed import LLMInContextClassifierFixed

print("Loading LLM classifier...")
llm = LLMInContextClassifierFixed()

print("\nTesting with a simple query...")
query = {
    'period': 9.488036,
    'duration': 2.9575,
    'depth': 615.8,
    'prad': 2.26,
    'teq': 793.0
}

print(f"Query: {query}")

try:
    result = llm.classify(query, k=25)
    print(f"✅ Result: {result}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()


