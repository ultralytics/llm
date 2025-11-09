"""Example usage of Ultralytics LLM Python client."""

from ultralytics_llm import LLMClient

# Initialize client
client = LLMClient(api_key="your-api-key-here")

# Send a chat message
try:
    response = client.chat("What's new in YOLO11?")
    print(f"Response: {response}")
except NotImplementedError as e:
    print(f"⚠️  {e}")
    print("Python client is under development. Use JavaScript widget for now!")
