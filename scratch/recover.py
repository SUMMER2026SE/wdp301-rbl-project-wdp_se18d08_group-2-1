import json
import re

log_path = r"C:\Users\ASUS\.gemini\antigravity\brain\c0f47e55-74ef-469e-a5da-36d6ab15ddd5\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        if "SubmitBidModal.jsx" in line:
            try:
                data = json.loads(line)
                # Check tool calls or writes
                calls = data.get("tool_calls", [])
                for call in calls:
                    args = call.get("args", {})
                    if "SubmitBidModal.jsx" in str(args.get("TargetFile", "")) or "SubmitBidModal.jsx" in str(args.get("AbsolutePath", "")):
                        code = args.get("CodeContent") or args.get("ReplacementContent")
                        if code and "SubmitBidModal" in code and "stub" not in code.lower():
                            print("FOUND CODE:")
                            print(code)
                            print("="*40)
            except Exception as e:
                pass
